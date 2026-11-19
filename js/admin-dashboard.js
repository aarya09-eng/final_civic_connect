/**
 * CivicConnect — Admin Dashboard Logic (js/admin-dashboard.js)
 * Strictly Vanilla JavaScript | Preserves CivicStore & CIVIC_AUTH integration
 */

document.addEventListener('DOMContentLoaded', function() {
  if (typeof CIVIC_AUTH !== 'undefined') {
    var user = CIVIC_AUTH.requireAuth(['admin']);
    if (!user) return;
  }
  initAdminDashboard();
});

function initAdminDashboard() {
  updateSummaryMetrics();
  renderReportedProblems();
  renderStudentProposals();
  renderPartnerSupport();
  renderActiveCases();
  initAdminPanelSwitching();
}

function initAdminPanelSwitching() {
  var buttons = document.querySelectorAll('.admin-mgmt-btn[data-admin-panel]');
  var panels = document.querySelectorAll('.admin-mgmt-panel[data-admin-panel]');
  var hint = document.getElementById('adminPanelHint');

  if (!buttons.length || !panels.length) return;

  // By default, no panel is active until selected
  panels.forEach(function(panel) {
    panel.classList.remove('is-active');
    panel.setAttribute('hidden', '');
  });
  buttons.forEach(function(b) {
    b.classList.remove('is-active');
    b.setAttribute('aria-selected', 'false');
  });
  if (hint) hint.style.display = 'block';

  buttons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var panelId = btn.getAttribute('data-admin-panel');
      if (!panelId) return;

      buttons.forEach(function(b) {
        var isActive = b.getAttribute('data-admin-panel') === panelId;
        b.classList.toggle('is-active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      panels.forEach(function(panel) {
        var isActive = panel.getAttribute('data-admin-panel') === panelId;
        panel.classList.toggle('is-active', isActive);
        if (isActive) {
          panel.removeAttribute('hidden');
          panel.style.display = 'block';
        } else {
          panel.setAttribute('hidden', '');
          panel.style.display = 'none';
        }
      });

      if (hint) hint.style.display = 'none';
    });
  });
}

function _getProblems() {
  return typeof CivicStore !== 'undefined' ? CivicStore.getProblems()
    : (typeof SAMPLE_PROBLEMS !== 'undefined' ? SAMPLE_PROBLEMS : []);
}

function _getProposals() {
  return typeof CivicStore !== 'undefined' ? CivicStore.getProposals()
    : (typeof SAMPLE_STUDENT_PROPOSALS !== 'undefined' ? SAMPLE_STUDENT_PROPOSALS : []);
}

function _getSupport() {
  return typeof CivicStore !== 'undefined' ? CivicStore.getSupportOffers()
    : (typeof SAMPLE_SUPPORT_REQUESTS !== 'undefined' ? SAMPLE_SUPPORT_REQUESTS : []);
}

function _getCases() {
  return typeof CivicStore !== 'undefined' ? CivicStore.getActiveCases()
    : (typeof SAMPLE_ACTIVE_CASES !== 'undefined' ? SAMPLE_ACTIVE_CASES : []);
}

function updateSummaryMetrics() {
  var problems = _getProblems();
  var proposals = _getProposals();
  var support = _getSupport();
  var activeCases = _getCases();

  var underReviewCount = problems.filter(function(p) {
    var s = (p.status || '').toLowerCase();
    return s === 'new' || s.includes('under review') || s.includes('reported');
  }).length;

  var implementingCount = activeCases.filter(function(c) {
    var s = (c.stage || '').toLowerCase();
    return s.includes('progress') || s.includes('implement');
  }).length;

  var collaborationCount = support.filter(function(s) {
    var st = (s.status || '').toLowerCase();
    return st.includes('connected') || st.includes('supporting');
  }).length;

  function setElText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(val);
  }

  setElText('adminProblemsCount', problems.length);
  setElText('adminReviewCount', underReviewCount);
  setElText('adminImplementingCount', implementingCount);
  setElText('adminCollaborationCount', collaborationCount);

  setElText('adminProblemsSectionCount', problems.length + ' Problems');
  setElText('adminProposalsSectionCount', proposals.length + ' Proposals');
  setElText('adminSupportSectionCount', support.length + ' Offers');
  setElText('adminActiveSectionCount', activeCases.length + ' Active Cases');
}

function renderReportedProblems() {
  var tableBody = document.getElementById('adminProblemsTableBody');
  if (!tableBody) return;

  var problems = _getProblems();
  tableBody.innerHTML = '';

  problems.forEach(function(p) {
    var tr = document.createElement('tr');
    tr.id = 'row-problem-' + p.id;

    var priorityClass = 'tag-priority--' + (p.priority || 'medium').toLowerCase();
    var statusClass = getStatusClass(p.status);

    tr.innerHTML =
      '<td><span class="tag-id">' + escapeHTML(p.id) + '</span></td>' +
      '<td>' +
        '<strong>' + escapeHTML(p.title) + '</strong>' +
        '<div style="font-size:0.8rem;color:var(--color-text-muted);margin-top:2px;">' +
          escapeHTML((p.shortDescription || p.fullDescription || '').substring(0, 70)) + '...' +
        '</div>' +
      '</td>' +
      '<td><span style="font-size:0.85rem;color:var(--color-text-muted);">&#9679; ' + escapeHTML(p.location) + '</span></td>' +
      '<td><span class="tag-category">' + escapeHTML(p.category || 'General') + '</span></td>' +
      '<td><span class="tag-priority ' + priorityClass + '">' + escapeHTML(p.priority || 'Medium') + '</span></td>' +
      '<td class="admin-col-status"><span class="tag-status ' + statusClass + '" id="prob-status-' + escapeHTML(p.id) + '">' + escapeHTML(p.status || 'Reported') + '</span></td>' +
      '<td>' +
        '<div style="display:flex;flex-direction:column;gap:5px;">' +
          '<select class="admin-status-select" ' +
                  'aria-label="Update status for ' + escapeHTML(p.id) + '" ' +
                  'onchange="adminUpdateProblemStatus(\'' + p.id + '\', this.value)" ' +
                  'style="font-size:0.78rem;padding:3px 6px;border-radius:4px;border:1px solid var(--color-border);background:#FFFFFF;color:var(--color-text-main);">' +
            '<option value="" disabled selected>Change Status...</option>' +
            '<option value="Reported">Reported</option>' +
            '<option value="Under Review">Under Review</option>' +
            '<option value="Solution Proposed">Solution Proposed</option>' +
            '<option value="In Progress">In Progress</option>' +
            '<option value="Resolved">Resolved</option>' +
          '</select>' +
          '<a href="details.html?id=' + encodeURIComponent(p.id) + '" class="btn btn-sm btn-secondary" style="font-size:0.75rem;padding:3px 8px;text-align:center;text-decoration:none;">' +
            'View Details' +
          '</a>' +
        '</div>' +
      '</td>';

    tableBody.appendChild(tr);
  });
}

function renderStudentProposals() {
  var tableBody = document.getElementById('adminSolutionsTableBody');
  if (!tableBody) return;

  var proposals = _getProposals();
  tableBody.innerHTML = '';

  proposals.forEach(function(prop) {
    var tr = document.createElement('tr');
    tr.id = 'row-prop-' + prop.id;

    var statusBadgeClass = getProposalStatusClass(prop.status);
    var university = prop.university || '';

    tr.innerHTML =
      '<td><span class="tag-id" style="font-weight:700;">' + escapeHTML(prop.id) + '</span></td>' +
      '<td>' +
        '<strong>' + escapeHTML(prop.solutionTitle) + '</strong>' +
        '<div style="font-size:0.8rem;color:var(--color-text-muted);margin-top:2px;">' +
          'Target: ' + escapeHTML(prop.problemTitle || prop.problemId) +
        '</div>' +
      '</td>' +
      '<td>' +
        (prop.problemId
          ? '<a href="details.html?id=' + encodeURIComponent(prop.problemId) + '" class="tag-id" style="text-decoration:none;display:inline-block;" title="View Linked Problem">' +
              escapeHTML(prop.problemId) + ' &rarr;' +
            '</a>'
          : '<span class="tag-id">—</span>') +
      '</td>' +
      '<td>' +
        '<span style="font-size:0.86rem;font-weight:600;">' + escapeHTML(prop.student) + '</span>' +
        '<div style="font-size:0.78rem;color:var(--color-text-muted);">' + escapeHTML(university) + '</div>' +
      '</td>' +
      '<td class="admin-col-status"><span class="tag-status ' + statusBadgeClass + '" id="prop-status-' + escapeHTML(prop.id) + '">' + escapeHTML(prop.status || 'Under Review') + '</span></td>' +
      '<td>' +
        '<div style="display:flex;flex-direction:column;gap:4px;">' +
          '<div style="display:flex;gap:4px;">' +
            '<a href="solution-details.html?id=' + encodeURIComponent(prop.id) + '" class="btn btn-sm btn-secondary" style="font-size:0.75rem;padding:3px 7px;">' +
              'View' +
            '</a>' +
            '<button type="button" class="btn btn-sm btn-primary" onclick="adminUpdateProposalStatus(\'' + prop.id + '\', \'Accepted\')" style="font-size:0.75rem;padding:3px 7px;">' +
              'Approve' +
            '</button>' +
          '</div>' +
          '<div style="display:flex;gap:4px;">' +
            '<button type="button" class="btn btn-sm btn-outline-subtle" onclick="adminUpdateProposalStatus(\'' + prop.id + '\', \'Under Review\')" style="font-size:0.72rem;padding:2px 6px;">' +
              'Request Changes' +
            '</button>' +
            '<button type="button" class="btn btn-sm" onclick="adminUpdateProposalStatus(\'' + prop.id + '\', \'Rejected\')" style="font-size:0.72rem;padding:2px 6px;background:#C53929;color:#FFFFFF;border:none;border-radius:4px;">' +
              'Reject' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</td>';

    tableBody.appendChild(tr);
  });
}

function renderPartnerSupport() {
  var tableBody = document.getElementById('adminSupportTableBody');
  if (!tableBody) return;

  var supportOffers = _getSupport();
  tableBody.innerHTML = '';

  supportOffers.forEach(function(req) {
    var tr = document.createElement('tr');
    tr.id = 'row-supp-' + req.id;

    var statusBadgeClass = getSupportStatusClass(req.status);

    tr.innerHTML =
      '<td><span class="tag-id" style="font-weight:700;">' + escapeHTML(req.id) + '</span></td>' +
      '<td>' +
        '<strong style="font-size:0.9rem;">' + escapeHTML(req.organization || 'Partner') + '</strong>' +
        '<div style="font-size:0.78rem;color:var(--color-text-muted);">' + escapeHTML(req.contactPerson || '') + '</div>' +
      '</td>' +
      '<td><span class="tag-category">' + escapeHTML(req.supportType || 'Guidance') + '</span></td>' +
      '<td>' +
        (req.problemId
          ? '<a href="details.html?id=' + encodeURIComponent(req.problemId) + '" class="tag-id" style="text-decoration:none;display:inline-block;" title="View Linked Problem">' +
              escapeHTML(req.problemId) + ' &rarr;' +
            '</a>'
          : '<span class="tag-id">—</span>') +
      '</td>' +
      '<td class="admin-col-status"><span class="tag-status ' + statusBadgeClass + '" id="supp-status-' + escapeHTML(req.id) + '">' + escapeHTML(req.status || 'Offered') + '</span></td>' +
      '<td>' +
        '<div style="display:flex;flex-direction:column;gap:4px;">' +
          '<div style="display:flex;gap:4px;">' +
            '<a href="support-details.html?id=' + encodeURIComponent(req.id) + '" class="btn btn-sm btn-secondary" style="font-size:0.75rem;padding:3px 7px;">' +
              'View' +
            '</a>' +
            '<button type="button" class="btn btn-sm btn-primary" onclick="adminUpdateSupportStatus(\'' + req.id + '\', \'Connected & Supporting\')" style="font-size:0.75rem;padding:3px 7px;">' +
              'Accept' +
            '</button>' +
          '</div>' +
          '<div style="display:flex;gap:4px;">' +
            '<button type="button" class="btn btn-sm btn-outline-subtle" onclick="adminUpdateSupportStatus(\'' + req.id + '\', \'More Info Requested\')" style="font-size:0.72rem;padding:2px 6px;">' +
              'Request Info' +
            '</button>' +
            '<button type="button" class="btn btn-sm" onclick="adminUpdateSupportStatus(\'' + req.id + '\', \'Declined\')" style="font-size:0.72rem;padding:2px 6px;background:#6F7D78;color:#FFFFFF;border:none;border-radius:4px;">' +
              'Decline' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</td>';

    tableBody.appendChild(tr);
  });
}

function renderActiveCases() {
  var tableBody = document.getElementById('adminActiveCasesTableBody');
  if (!tableBody) return;

  var cases = _getCases();
  tableBody.innerHTML = '';

  cases.forEach(function(item) {
    var tr = document.createElement('tr');
    var team = item.studentTeam || item.team || '';
    var partner = item.partnerOrg || item.partner || '';

    tr.innerHTML =
      '<td><span class="tag-id" style="font-weight:700;color:var(--color-brand-primary);">' + escapeHTML(item.id) + '</span></td>' +
      '<td>' +
        '<strong>' + escapeHTML(item.problemTitle) + '</strong>' +
        '<div style="font-size:0.78rem;color:var(--color-text-muted);margin-top:2px;">' +
          '<a href="details.html?id=' + encodeURIComponent(item.problemId) + '" class="tag-id" style="text-decoration:none;">' + escapeHTML(item.problemId) + '</a> &bull; ' + escapeHTML(item.location || '') +
        '</div>' +
      '</td>' +
      '<td>' +
        '<strong>' + escapeHTML(item.proposalTitle) + '</strong>' +
        '<div style="font-size:0.78rem;color:var(--color-text-muted);margin-top:2px;">' +
          '<a href="solution-details.html?id=' + encodeURIComponent(item.proposalId) + '" class="tag-id" style="text-decoration:none;">' + escapeHTML(item.proposalId) + '</a> &bull; ' + escapeHTML(team) +
        '</div>' +
      '</td>' +
      '<td>' +
        '<strong>' + escapeHTML(partner) + '</strong>' +
        '<div style="font-size:0.78rem;color:var(--color-text-muted);margin-top:2px;">' +
          '<a href="support-details.html?id=' + encodeURIComponent(item.supportId) + '" class="tag-id" style="text-decoration:none;">' + escapeHTML(item.supportId) + '</a> &bull; ' + escapeHTML(item.supportType || '') +
        '</div>' +
      '</td>' +
      '<td class="admin-col-status"><span class="tag-status tag-status--accepted">' + escapeHTML(item.stage || 'In Progress') + '</span></td>' +
      '<td>' +
        '<div style="display:flex;gap:4px;flex-wrap:wrap;">' +
          '<a href="details.html?id=' + encodeURIComponent(item.problemId) + '" class="btn btn-sm btn-secondary" style="font-size:0.75rem;padding:3px 7px;">' +
            'Problem' +
          '</a>' +
          '<a href="solution-details.html?id=' + encodeURIComponent(item.proposalId) + '" class="btn btn-sm btn-outline-subtle" style="font-size:0.75rem;padding:3px 7px;">' +
            'Solution' +
          '</a>' +
        '</div>' +
      '</td>';

    tableBody.appendChild(tr);
  });
}

window.adminUpdateProblemStatus = function(problemId, newStatus) {
  if (!newStatus) return;
  if (typeof CivicStore !== 'undefined') CivicStore.updateProblemStatus(problemId, newStatus);
  var el = document.getElementById('prob-status-' + problemId);
  if (el) {
    el.textContent = newStatus;
    el.className = 'tag-status ' + getStatusClass(newStatus);
  }
  updateSummaryMetrics();
  showAdminFeedback('Status for ' + problemId + ' updated to "' + newStatus + '".');
};

window.adminUpdateProposalStatus = function(proposalId, newStatus) {
  if (typeof CivicStore !== 'undefined') CivicStore.updateProposalStatus(proposalId, newStatus);
  var el = document.getElementById('prop-status-' + proposalId);
  if (el) {
    el.textContent = newStatus;
    el.className = 'tag-status ' + getProposalStatusClass(newStatus);
  }
  updateSummaryMetrics();
  showAdminFeedback('Proposal ' + proposalId + ' updated to "' + newStatus + '".');
};

window.adminUpdateSupportStatus = function(supportId, newStatus) {
  if (typeof CivicStore !== 'undefined') CivicStore.updateSupportStatus(supportId, newStatus);
  var el = document.getElementById('supp-status-' + supportId);
  if (el) {
    el.textContent = newStatus;
    el.className = 'tag-status ' + getSupportStatusClass(newStatus);
  }
  updateSummaryMetrics();
  showAdminFeedback('Support offer ' + supportId + ' updated to "' + newStatus + '".');
};

window.adminCreateActiveCase = function(proposalId, supportId) {
  if (typeof CivicStore === 'undefined') return;
  var proposal = _getProposals().find(function(p) { return p.id === proposalId; });
  var support = _getSupport().find(function(s) { return s.id === supportId; });
  if (!proposal || !support) {
    showAdminFeedback('Could not find proposal or support offer.');
    return;
  }
  var newCase = CivicStore.createActiveCase(proposal, support);
  showAdminFeedback('Active Case ' + newCase.id + ' created!');
  renderActiveCases();
  renderStudentProposals();
  renderPartnerSupport();
  updateSummaryMetrics();
};

function showAdminFeedback(message) {
  var notice = document.getElementById('adminActionNotification');
  if (!notice) return;
  notice.textContent = message;
  notice.style.display = 'block';
  if (window._adminNoticeTimer) clearTimeout(window._adminNoticeTimer);
  window._adminNoticeTimer = setTimeout(function() {
    notice.style.display = 'none';
  }, 4500);
}

function getStatusClass(status) {
  var s = (status || '').toLowerCase();
  if (s.includes('resolved')) return 'tag-status--resolved';
  if (s.includes('progress')) return 'tag-status--in-progress';
  if (s.includes('solution')) return 'tag-status--accepted';
  if (s.includes('review') || s.includes('exploring')) return 'tag-status--under-review';
  return 'tag-status--new';
}

function getProposalStatusClass(status) {
  var s = (status || '').toLowerCase();
  if (s.includes('accept') || s.includes('implement')) return 'tag-status--accepted';
  if (s.includes('shortlist')) return 'tag-status--shortlisted';
  if (s.includes('reject')) return 'tag-status--draft';
  return 'tag-status--review';
}

function getSupportStatusClass(status) {
  var s = (status || '').toLowerCase();
  if (s.includes('accept') || s.includes('connected') || s.includes('supporting')) return 'tag-status--accepted';
  if (s.includes('offered') || s.includes('info')) return 'tag-status--shortlisted';
  if (s.includes('decline')) return 'tag-status--draft';
  return 'tag-status--review';
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
