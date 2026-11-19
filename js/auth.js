// CivicConnect — Authentication Module
(function seedAdmin() {
  const users = JSON.parse(localStorage.getItem('civic_users') || '[]');
  if (!users.find(u => u.role === 'admin')) {
    users.push({
      uid: 'USR-ADMIN-001', name: 'CivicConnect Admin',
      email: 'admin@civicconnect.in',
      passwordHash: _hash('Admin@2026'),
      role: 'admin', createdAt: new Date().toISOString()
    });
    localStorage.setItem('civic_users', JSON.stringify(users));
  }
  function _hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
    return h.toString(36);
  }
})();

window.CIVIC_AUTH = {
  SESSION_KEY: 'civic_session',
  USERS_KEY: 'civic_users',

  _hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
    return h.toString(36);
  },

  _getUsers() {
    try { return JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]'); } catch { return []; }
  },

  getCurrentUser() {
    try {
      const raw = sessionStorage.getItem(this.SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  login(email, password) {
    const users = this._getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('No account found with this email.');
    if (user.passwordHash !== this._hash(password)) throw new Error('Incorrect password. Please try again.');
    const safe = { uid: user.uid, name: user.name, email: user.email, role: user.role, university: user.university || null, organization: user.organization || null };
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(safe));
    return safe;
  },

  register({ name, email, password, role, university, organization }) {
    const users = this._getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) throw new Error('An account with this email already exists.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');
    const user = {
      uid: CivicUtils.generateId('USR'), name, email,
      passwordHash: this._hash(password),
      role, university: university || null, organization: organization || null,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    const safe = { uid: user.uid, name: user.name, email: user.email, role: user.role, university: user.university, organization: user.organization };
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(safe));
    return safe;
  },

  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
    window.location.href = 'index.html';
  },

  requireAuth(allowedRoles) {
    const user = this.getCurrentUser();
    if (!user) {
      window.location.href = 'auth.html?redirect=' + encodeURIComponent(location.href);
      return null;
    }
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      window.location.href = 'index.html?error=unauthorized';
      return null;
    }
    return user;
  }
};
