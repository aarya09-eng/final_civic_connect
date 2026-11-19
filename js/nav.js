// CivicConnect — Dynamic Auth-Aware Navigation
document.addEventListener('DOMContentLoaded', function() {
  if (typeof CIVIC_AUTH === 'undefined') return;
  const user = CIVIC_AUTH.getCurrentUser();
  const authControls = document.getElementById('navAuthControls');

  // Show/hide role nav items
  document.querySelectorAll('[data-nav-role]').forEach(function(el) {
    const roles = el.getAttribute('data-nav-role').split(',');
    el.style.display = (!user || !roles.includes(user.role)) ? 'none' : '';
  });

  if (authControls) {
    if (user) {
      const esc = typeof CivicUtils !== 'undefined' ? CivicUtils.escapeHTML : function(s) { return s; };
      authControls.innerHTML =
        '<span class="nav-user-badge"><span class="nav-user-role">' + esc(user.role) + '</span>' + esc(user.name) + '</span>' +
        '<button class="btn btn-outline-subtle" id="navLogoutBtn" style="font-size:0.82rem;padding:5px 12px;">Sign Out</button>';
      document.getElementById('navLogoutBtn').addEventListener('click', function() { CIVIC_AUTH.logout(); });
    } else {
      authControls.innerHTML = '<a href="auth.html" class="btn btn-primary" style="font-size:0.85rem;padding:6px 16px;">Sign In / Register</a>';
    }
  }

  // Show unauthorized error message
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('error') === 'unauthorized') {
    const main = document.querySelector('main') || document.body;
    const div = document.createElement('div');
    div.style.cssText = 'background:#fef2f2;border:1.5px solid #dc2626;color:#991b1b;padding:12px 20px;border-radius:6px;margin:20px auto;max-width:600px;font-size:0.9rem;';
    div.textContent = 'Access denied. You do not have permission to view that page.';
    main.insertBefore(div, main.firstChild);
    setTimeout(function() { div.remove(); }, 5000);
  }
});
