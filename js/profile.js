document.addEventListener('DOMContentLoaded', () => {
  const user = window.CIVIC_AUTH.requireAuth();
  if (!user) return;
  const c = document.getElementById('profileContent');
  const links = {
    citizen: [['citizen-portal.html','Citizen Portal'],['report.html','Report a Problem']],
    student: [['student-dashboard.html','Student Dashboard'],['student-request.html','Submit Proposal']],
    partner: [['partner-support.html','Partner Support'],['offer-support.html','Offer Support']],
    admin: [['admin-dashboard.html','Admin Dashboard']]
  };
  const ls = (links[user.role] || []).concat([['explore.html','Explore Problems'],['profile.html','My Profile']]);
  c.innerHTML = `
    <p><strong>Name:</strong> ${CivicUtils.escapeHTML(user.name)}</p>
    <p><strong>Email:</strong> ${CivicUtils.escapeHTML(user.email)}</p>
    <p><strong>Role:</strong> ${CivicUtils.escapeHTML(user.role)}</p>
    ${user.university ? `<p><strong>University:</strong> ${CivicUtils.escapeHTML(user.university)}</p>` : ''}
    ${user.organization ? `<p><strong>Organisation:</strong> ${CivicUtils.escapeHTML(user.organization)}</p>` : ''}
    <h3 style="margin-top:16px;">Quick Links</h3>
    <ul>${ls.map(([h,t])=>`<li><a href="${h}">${t}</a></li>`).join('')}</ul>
    <button class="btn btn-outline-subtle btn-sm" id="logoutBtn" style="margin-top:16px;">Sign Out</button>
  `;
  document.getElementById('logoutBtn').addEventListener('click', () => CIVIC_AUTH.logout());
});
