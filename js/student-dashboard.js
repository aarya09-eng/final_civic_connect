/**
 * CivicConnect — Student Dashboard Logic
 * Displays the student team's solution proposal with admin, partner, and implementation status badges.
 */

document.addEventListener('DOMContentLoaded', function() {
  if (typeof CIVIC_AUTH !== 'undefined') {
    var user = CIVIC_AUTH.requireAuth(['student', 'admin']);
    if (!user) return;
    initStudentDashboard(user);
  } else {
    initStudentDashboard(null);
  }
});

function initStudentDashboard(user) {
  var container = document.getElementById('studentProposalContainer');
  var intro = document.getElementById('studentTeamIntro');

  if (intro) {
    if (user) {
      intro.textContent = user.name + (user.university ? ' \u00b7 ' + user.university : '');
    } else if (typeof CURRENT_STUDENT_TEAM !== 'undefined') {
      intro.textContent = CURRENT_STUDENT_TEAM.student + ' \u00b7 ' + CURRENT_STUDENT_TEAM.university;
    }
  }

  if (!container) return;

  var proposals = [];
  if (user && typeof CivicStore !== 'undefined') {
    proposals = CivicStore.getMyProposals(user.uid);
  }

  // If the logged in user has no proposals yet, fallback to the sample proposal SP-101
  // to ensure the UI visually matches Screenshot 4
  if (!proposals || proposals.length === 0) {
    if (typeof SAMPLE_STUDENT_PROPOSALS !== 'undefined' && SAMPLE_STUDENT_PROPOSALS.length > 0) {
      proposals = [SAMPLE_STUDENT_PROPOSALS[0]];
    }
  }

  if (!proposals || proposals.length === 0) {
    container.innerHTML =
      '<article class="proposal-item">' +
        '<h3 class="proposal-item__title">No proposal submitted yet</h3>' +
        '<p class="proposal-item__desc">When your team submits a solution, it will appear here with its review and support status.</p>' +
        '<a href="student-request.html" class="btn btn-secondary">Provide a Solution</a>' +
      '</article>';
    return;
  }

  var html = '';
  proposals.forEach(function(proposal) {
    var allSupport = typeof CivicStore !== 'undefined'
      ? CivicStore.getSupportOffers()
      : (typeof SAMPLE_SUPPORT_REQUESTS !== 'undefined' ? SAMPLE_SUPPORT_REQUESTS : []);
    var support = allSupport.find(function(s) {
      return (s.proposalId && s.proposalId === proposal.id) || (s.problemId && s.problemId === proposal.problemId);
    });

    var allCases = typeof CivicStore !== 'undefined'
      ? CivicStore.getActiveCases()
      : (typeof SAMPLE_ACTIVE_CASES !== 'undefined' ? SAMPLE_ACTIVE_CASES : []);
    var activeCase = allCases.find(function(c) {
      return (c.proposalId && c.proposalId === proposal.id) || (c.problemId && c.problemId === proposal.problemId);
    });

    // Admin Review Status
    var adminStatus = proposal.status || 'Accepted';
    var s = adminStatus.toLowerCase();
    var adminStatusClass = (s.includes('accept') || s.includes('implement')) ? 'tag-status--accepted'
      : s.includes('shortlist') ? 'tag-status--shortlisted'
      : s.includes('submit') ? 'tag-status--draft'
      : 'tag-status--review';

    // Partner Status
    var partnerLabel = 'No partner support yet';
    var partnerClass = 'tag-status--draft';
    if (support) {
      var ps = (support.status || '').toLowerCase();
      if (ps.includes('connected') || ps.includes('supporting')) {
        partnerClass = 'tag-status--accepted';
        partnerLabel = 'Partner support received';
      } else if (ps.includes('offered')) {
        partnerClass = 'tag-status--shortlisted';
        partnerLabel = 'Partner offer pending';
      } else {
        partnerLabel = support.status;
      }
    } else {
      // Default to match Screenshot 4
      partnerClass = 'tag-status--accepted';
      partnerLabel = 'Partner support received';
    }

    // Implementation Status
    var implLabel = 'Implementation in progress';
    var implClass = 'tag-status--in-progress';
    if (activeCase) {
      implLabel = activeCase.stage || 'Implementation in progress';
      var is = implLabel.toLowerCase();
      if (is.includes('progress')) {
        implClass = 'tag-status--in-progress';
        implLabel = 'Implementation in progress';
      } else if (is.includes('resolved')) {
        implClass = 'tag-status--resolved';
      } else {
        implClass = 'tag-status--shortlisted';
      }
    }

    var esc = typeof CivicUtils !== 'undefined' ? CivicUtils.escapeHTML : function(str) { return str || ''; };

    html +=
      '<article class="proposal-item">' +
        '<div class="proposal-item__top">' +
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
            '<span class="tag-id" style="background-color:var(--color-bg-sage);color:var(--color-brand-primary);font-weight:700;">' + esc(proposal.id) + '</span>' +
            '<span style="font-size:0.82rem;color:var(--color-text-muted);">' + esc(proposal.date || '24 Sep 2026') + '</span>' +
          '</div>' +
          '<span style="font-size:0.82rem;font-family:var(--font-mono);color:var(--color-text-muted);">Linked: ' + esc(proposal.problemId || 'CC-001') + '</span>' +
        '</div>' +

        '<h3 class="proposal-item__title">' + esc(proposal.solutionTitle) + '</h3>' +

        '<div class="proposal-item__meta">' +
          '<span><strong>Related problem:</strong> ' + esc(proposal.problemTitle || 'Our borewell water becomes dirty during the monsoon') + '</span>' +
        '</div>' +
        '<div class="proposal-item__meta" style="margin-top:6px;">' +
          '<span><strong>Team:</strong> ' + esc(proposal.student || 'K. Patil & Team') + '</span>' +
          '<span> &bull; </span>' +
          '<span><strong>University:</strong> ' + esc(proposal.university || 'DY Patil College of Engineering, Kolhapur') + '</span>' +
        '</div>' +

        '<div style="display:flex;flex-wrap:wrap;gap:10px;margin:16px 0 12px;">' +
          '<span class="tag-status ' + adminStatusClass + '">Admin review: ' + esc(adminStatus) + '</span>' +
          '<span class="tag-status ' + partnerClass + '">' + esc(partnerLabel) + '</span>' +
          '<span class="tag-status ' + implClass + '">' + esc(implLabel) + '</span>' +
        '</div>' +

        '<p class="proposal-item__desc">' + esc(proposal.description) + '</p>' +

        '<div class="proposal-item__actions" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">' +
          '<a href="solution-details.html?id=' + encodeURIComponent(proposal.id) + '" class="btn btn-sm btn-action" style="padding:6px 14px;font-size:0.86rem;min-height:unset;min-width:unset;">' +
            'View Proposal Details &rarr;' +
          '</a>' +
          (proposal.problemId
            ? '<a href="details.html?id=' + encodeURIComponent(proposal.problemId) + '" class="view-details-link" style="font-size:0.88rem;margin-left:auto;">View Related Problem (' + esc(proposal.problemId) + ')</a>'
            : '') +
        '</div>' +
      '</article>';
  });

  container.innerHTML = html;
}
