/**
 * CivicConnect — Problem Details Logic (js/details.js)
 * Strictly Vanilla JavaScript | Reads URL query parameter ?id=... from shared js/data.js
 */

document.addEventListener('DOMContentLoaded', () => {
  initProblemDetails();
});

function initProblemDetails() {
  const contentContainer = document.getElementById('detailsContent');
  const notFoundContainer = document.getElementById('detailsNotFound');

  if (!contentContainer || !notFoundContainer) return;

  // Read URL query parameter: ?id=... or ?problemId=...
  const urlParams = new URLSearchParams(window.location.search);
  const problemId = urlParams.get('id') || urlParams.get('problemId');

  // Look up problem in shared dataset (supports "CC-001" and backward-compatible slugs)
  const allProblems = typeof CivicStore !== 'undefined'
    ? CivicStore.getProblems()
    : (typeof SAMPLE_PROBLEMS !== 'undefined' ? SAMPLE_PROBLEMS : []);
  const problem = allProblems.find(p => p.id === problemId || p.slug === problemId)
    || (typeof findProblemById === 'function' ? findProblemById(problemId) : null);

  if (!problem) {
    contentContainer.style.display = 'none';
    notFoundContainer.style.display = 'block';
    return;
  }

  // Found matching problem: Populate DOM elements
  notFoundContainer.style.display = 'none';
  contentContainer.style.display = 'block';

  // Update page title dynamically
  document.title = `${problem.id}: ${problem.title} — CivicConnect`;

  // Problem ID tag
  const idEl = document.getElementById('detailProblemId');
  if (idEl) {
    idEl.textContent = problem.id;
  }

  // Priority badge in top tags
  const priorityVal = problem.priority || 'Medium';
  const priorityClass = `tag-priority--${priorityVal.toLowerCase()}`;
  const priorityEl = document.getElementById('detailPriority');
  if (priorityEl) {
    priorityEl.textContent = `${priorityVal} Priority`;
    priorityEl.className = `tag-priority ${priorityClass}`;
  }

  const priorityBadgeEl = document.getElementById('detailPriorityBadge');
  if (priorityBadgeEl) {
    priorityBadgeEl.textContent = `${priorityVal} Priority`;
    priorityBadgeEl.className = `tag-priority ${priorityClass}`;
  }

  // Populate Priority Evaluation Factors Card (Transparent, Rule-based Assessment)
  const factorPriority = document.getElementById('factorPriorityVal');
  if (factorPriority) factorPriority.textContent = priorityVal;

  const factorSeverity = document.getElementById('factorSeverityVal');
  if (factorSeverity) factorSeverity.textContent = problem.severity || 'Medium';

  const factorPeople = document.getElementById('factorPeopleVal');
  if (factorPeople) factorPeople.textContent = problem.peopleAffected ? `${problem.peopleAffected} residents` : 'Localized group';

  const factorRisk = document.getElementById('factorRiskVal');
  if (factorRisk) factorRisk.textContent = problem.riskLevel || 'Medium';

  const factorAge = document.getElementById('factorAgeVal');
  if (factorAge) factorAge.textContent = problem.reportedDaysAgo ? `${problem.reportedDaysAgo} days ago` : 'Recently reported';

  const priorityReasonEl = document.getElementById('detailPriorityReason');
  if (priorityReasonEl) {
    priorityReasonEl.textContent = problem.priorityReason || 
      `Assessed as ${priorityVal} priority based on ${problem.severity || 'medium'} severity, ${problem.peopleAffected || 'community'} affected population, and ${problem.reportedDaysAgo || 30} days unresolved duration.`;
  }

  // Status tag styling
  const statusClass = problem.status.toLowerCase() === 'new' 
    ? 'tag-status--new' 
    : 'tag-status--exploring';

  const statusEl = document.getElementById('detailStatus');
  if (statusEl) {
    statusEl.textContent = problem.status;
    statusEl.className = `tag-status ${statusClass}`;
  }

  const categoryEl = document.getElementById('detailCategory');
  if (categoryEl) categoryEl.textContent = problem.category;

  const titleEl = document.getElementById('detailTitle');
  if (titleEl) titleEl.textContent = problem.title;

  const locationEl = document.getElementById('detailLocation');
  if (locationEl) locationEl.textContent = problem.location;

  const fullDescEl = document.getElementById('detailFullDesc');
  if (fullDescEl) fullDescEl.textContent = problem.fullDescription || problem.shortDescription || '';

  const affectedEl = document.getElementById('detailAffected');
  if (affectedEl) affectedEl.textContent = problem.affectedGroup || 'Community residents';

  const durationEl = document.getElementById('detailDuration');
  if (durationEl) durationEl.textContent = problem.duration || 'Not specified';

  // Populate Possible Areas to Explore
  const exploreListEl = document.getElementById('detailExplorationList');
  if (exploreListEl && Array.isArray(problem.possibleAreas) && problem.possibleAreas.length > 0) {
    exploreListEl.innerHTML = '';
    problem.possibleAreas.forEach(areaText => {
      const li = document.createElement('li');
      li.className = 'exploration-item';
      li.innerHTML = `
        <span class="exploration-bullet" aria-hidden="true">&#9670;</span>
        <span>${escapeHTML(areaText)}</span>
      `;
      exploreListEl.appendChild(li);
    });
  } else if (exploreListEl) {
    exploreListEl.innerHTML = `
      <li class="exploration-item">
        <span class="exploration-bullet" aria-hidden="true">&#9670;</span>
        <span>Investigate low-cost field interventions and filtration or storage methodologies.</span>
      </li>
      <li class="exploration-item">
        <span class="exploration-bullet" aria-hidden="true">&#9670;</span>
        <span>Engage local community stakeholders to assess feasibility and seasonal patterns.</span>
      </li>
    `;
  }

  // --------------------------------------------------------------------------
  // Populate Related Student Proposals & Partner Support Offers
  // --------------------------------------------------------------------------
  const relSection = document.getElementById('problemRelationsSection');
  const relGrid = document.getElementById('problemRelationsGrid');

  if (relSection && relGrid) {
    const allProposals = typeof CivicStore !== 'undefined'
      ? CivicStore.getProposals()
      : (typeof SAMPLE_STUDENT_PROPOSALS !== 'undefined' ? SAMPLE_STUDENT_PROPOSALS : []);
    const matchingProposals = allProposals.filter(pr => pr.problemId === problem.id);

    const allSupport = typeof CivicStore !== 'undefined'
      ? CivicStore.getSupportOffers()
      : (typeof SAMPLE_SUPPORT_REQUESTS !== 'undefined' ? SAMPLE_SUPPORT_REQUESTS : []);
    const matchingSupport = allSupport.filter(su => su.problemId === problem.id);

    if (matchingProposals.length > 0 || matchingSupport.length > 0) {
      relSection.style.display = 'block';
      let relHtml = '';

      matchingProposals.forEach(prop => {
        relHtml += `
          <div class="form-panel-tinted" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span class="tag-id" style="font-size:0.75rem;">${escapeHTML(prop.id)}</span>
                <span class="tag-status tag-status--review" style="font-size:0.72rem;">Proposal: ${escapeHTML(prop.status || 'Under Review')}</span>
              </div>
              <h4 style="font-size:0.95rem; font-weight:700; color:var(--color-brand-primary); margin:0 0 4px 0;">${escapeHTML(prop.solutionTitle)}</h4>
              <p style="font-size:0.82rem; color:var(--color-text-muted); margin:0 0 10px 0;">Team: ${escapeHTML(prop.student)} (${escapeHTML(prop.university || '')})</p>
            </div>
            <a href="solution-details.html?id=${encodeURIComponent(prop.id)}" class="btn btn-sm btn-secondary" style="font-size:0.75rem; text-align:center; padding:4px 10px;">
              View Proposal Details &rarr;
            </a>
          </div>
        `;
      });

      matchingSupport.forEach(supp => {
        relHtml += `
          <div class="form-panel-tinted" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span class="tag-id" style="font-size:0.75rem; background-color:var(--color-brand-primary); color:#fff;">${escapeHTML(supp.id)}</span>
                <span class="tag-status tag-status--accepted" style="font-size:0.72rem;">Partner: ${escapeHTML(supp.status || 'Connected')}</span>
              </div>
              <h4 style="font-size:0.95rem; font-weight:700; color:var(--color-brand-primary); margin:0 0 4px 0;">${escapeHTML(supp.organization || 'Support Partner')}</h4>
              <p style="font-size:0.82rem; color:var(--color-text-muted); margin:0 0 10px 0;">Type: ${escapeHTML(supp.supportType || '')}</p>
            </div>
            <a href="support-details.html?id=${encodeURIComponent(supp.id)}" class="btn btn-sm btn-action" style="font-size:0.75rem; text-align:center; padding:4px 10px;">
              View Support Details &rarr;
            </a>
          </div>
        `;
      });

      relGrid.innerHTML = relHtml;
    } else {
      relSection.style.display = 'none';
    }
  }

  // Update Action Links with Current Challenge Query Parameter
  const startProjectBtn = document.getElementById('startProjectRequestBtn');
  if (startProjectBtn) {
    startProjectBtn.href = `student-request.html?problemId=${encodeURIComponent(problem.id)}`;
  }

  const offerSupportBtn = document.getElementById('offerSupportBtn');
  if (offerSupportBtn) {
    offerSupportBtn.href = `offer-support.html?problemId=${encodeURIComponent(problem.id)}`;
  }
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
