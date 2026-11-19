/**
 * CivicConnect — Partner Offer Support Logic (js/offer-support.js)
 * Strictly Vanilla JavaScript | Preserves CivicStore & CIVIC_AUTH integration
 */

document.addEventListener('DOMContentLoaded', function() {
  if (typeof CIVIC_AUTH !== 'undefined') {
    var user = CIVIC_AUTH.requireAuth(['partner', 'admin']);
    if (!user) return;
  }
  initSupporterOfferForm();
});

function initSupporterOfferForm() {
  var user = typeof CIVIC_AUTH !== 'undefined' ? CIVIC_AUTH.getCurrentUser() : null;
  var form = document.getElementById('supporterOfferForm');
  var confirmationBox = document.getElementById('offerConfirmation');
  var resetOfferFormBtn = document.getElementById('resetOfferFormBtn');

  if (!form) return;

  var urlParams = new URLSearchParams(window.location.search);
  var problemId = urlParams.get('problemId') || urlParams.get('id');
  var proposalId = urlParams.get('proposalId');

  var contextBox = document.getElementById('challengeContextBox');
  var contextTitleEl = document.getElementById('contextProblemTitle');
  var contextLocationEl = document.getElementById('contextProblemLocation');
  var supportTargetInput = document.getElementById('supportTarget');
  var backLink = document.getElementById('backLinkSupporter');

  var allProblems = typeof CivicStore !== 'undefined'
    ? CivicStore.getProblems()
    : (typeof SAMPLE_PROBLEMS !== 'undefined' ? SAMPLE_PROBLEMS : []);

  var allProposals = typeof CivicStore !== 'undefined'
    ? CivicStore.getProposals()
    : (typeof SAMPLE_STUDENT_PROPOSALS !== 'undefined' ? SAMPLE_STUDENT_PROPOSALS : []);

  var matchedProblem = null;
  var matchedProposal = null;

  if (proposalId) {
    matchedProposal = allProposals.find(function(p) { return p.id === proposalId; });
    if (matchedProposal && !problemId) {
      problemId = matchedProposal.problemId;
    }
  }

  if (problemId) {
    matchedProblem = allProblems.find(function(p) { return p.id === problemId || p.slug === problemId; });
  }

  // Populate context box if problem or proposal is selected
  if (matchedProblem || matchedProposal) {
    if (contextBox) contextBox.style.display = 'block';

    if (matchedProposal && matchedProblem) {
      if (contextTitleEl) contextTitleEl.textContent = 'Proposal: ' + matchedProposal.id + ' — ' + matchedProposal.solutionTitle;
      if (contextLocationEl) contextLocationEl.textContent = 'Linked Problem: ' + matchedProblem.id + ' (' + matchedProblem.title + ') \u2022 Team: ' + matchedProposal.student;
      if (supportTargetInput) supportTargetInput.value = '[' + matchedProposal.id + '] ' + matchedProposal.solutionTitle + ' (Problem: ' + matchedProblem.id + ')';
    } else if (matchedProblem) {
      if (contextTitleEl) contextTitleEl.textContent = matchedProblem.id + ': ' + matchedProblem.title;
      if (contextLocationEl) contextLocationEl.textContent = '\u2022 ' + matchedProblem.location + ' | Category: ' + matchedProblem.category;
      if (supportTargetInput) supportTargetInput.value = matchedProblem.id + ': ' + matchedProblem.title;
    }

    if (backLink && matchedProblem) {
      backLink.href = 'details.html?id=' + encodeURIComponent(matchedProblem.id);
      backLink.innerHTML = '<span aria-hidden="true">&larr;</span> Back to Problem Details (' + matchedProblem.id + ')';
    }
  }

  // Pre-fill user information if available
  if (user) {
    var nameInput = document.getElementById('supporterName');
    if (nameInput && !nameInput.value) nameInput.value = user.name || '';

    var orgInput = document.getElementById('supporterOrg');
    if (orgInput && !orgInput.value && user.organization) orgInput.value = user.organization;

    var emailInput = document.getElementById('supporterEmail');
    if (emailInput && !emailInput.value) emailInput.value = user.email || '';
  }

  // Support offer type "Other" toggle
  var otherCheckbox = document.getElementById('supportOfferOther');
  var otherWrap = document.getElementById('supportOfferOtherWrap');
  if (otherCheckbox && otherWrap) {
    otherCheckbox.addEventListener('change', function() {
      otherWrap.style.display = otherCheckbox.checked ? 'block' : 'none';
      if (otherCheckbox.checked) {
        var otherText = document.getElementById('supportOfferOtherText');
        if (otherText) otherText.focus();
      }
    });
  }

  // --------------------------------------------------------------------------
  // Validation Helper
  // --------------------------------------------------------------------------
  function validateField(inputEl, condition, errorMsg) {
    if (!inputEl) return true;
    var parent = inputEl.closest('.form-group');
    var errorEl = parent ? parent.querySelector('.field-error') : null;

    if (!condition) {
      if (parent) parent.classList.add('has-error');
      if (errorEl) errorEl.textContent = errorMsg;
      return false;
    } else {
      if (parent) parent.classList.remove('has-error');
      if (errorEl) errorEl.textContent = '';
      return true;
    }
  }

  form.querySelectorAll('input, textarea, select').forEach(function(el) {
    el.addEventListener('input', function() {
      var parent = el.closest('.form-group');
      if (parent && parent.classList.contains('has-error')) {
        parent.classList.remove('has-error');
        var err = parent.querySelector('.field-error');
        if (err) err.textContent = '';
      }
    });
  });

  // --------------------------------------------------------------------------
  // Submission
  // --------------------------------------------------------------------------
  form.addEventListener('submit', function(event) {
    event.preventDefault();

    var firstInvalid = null;

    var nameInput = document.getElementById('supporterName');
    var isNameValid = validateField(nameInput, (nameInput.value || '').trim().length >= 2, 'Please enter your name.');
    if (!isNameValid && !firstInvalid) firstInvalid = nameInput;

    var roleInput = document.getElementById('supporterRole');
    var isRoleValid = validateField(roleInput, (roleInput.value || '').trim().length >= 3, 'Please specify your role or domain expertise.');
    if (!isRoleValid && !firstInvalid) firstInvalid = roleInput;

    var emailInput = document.getElementById('supporterEmail');
    var emailVal = (emailInput ? emailInput.value : '').trim();
    var isEmailValid = validateField(emailInput, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal), 'Please enter a valid email address.');
    if (!isEmailValid && !firstInvalid) firstInvalid = emailInput;

    var capabilityInput = document.getElementById('supportCapability');
    var isCapValid = validateField(capabilityInput, (capabilityInput.value || '').trim().length >= 10, 'Please briefly describe the support you can provide (at least 10 characters).');
    if (!isCapValid && !firstInvalid) firstInvalid = capabilityInput;

    var targetInput = document.getElementById('supportTarget');
    var isTargetValid = validateField(targetInput, (targetInput.value || '').trim().length >= 3, 'Please name the challenge, project, or student proposal.');
    if (!isTargetValid && !firstInvalid) firstInvalid = targetInput;

    var whyInput = document.getElementById('whySupport');
    var isWhyValid = validateField(whyInput, (whyInput.value || '').trim().length >= 10, 'Please share why you want to support this challenge (at least 10 characters).');
    if (!isWhyValid && !firstInvalid) firstInvalid = whyInput;

    var checkedTypes = Array.from(document.querySelectorAll('input[name="supportOfferTypes"]:checked'));
    var typesErrorEl = document.getElementById('supportOfferTypesError');
    if (checkedTypes.length === 0) {
      if (typesErrorEl) typesErrorEl.textContent = 'Please select at least one type of support.';
      if (!firstInvalid) firstInvalid = document.getElementById('supportOfferTypesGrid');
    } else {
      if (typesErrorEl) typesErrorEl.textContent = '';
    }

    var descInput = document.getElementById('offerDescription');
    var isDescValid = validateField(descInput, (descInput.value || '').trim().length >= 15, 'Please describe your offer (at least 15 characters).');
    if (!isDescValid && !firstInvalid) firstInvalid = descInput;

    var availSelect = document.getElementById('supporterAvailability');
    var isAvailValid = validateField(availSelect, (availSelect ? availSelect.value : '') !== '', 'Please indicate your availability.');
    if (!isAvailValid && !firstInvalid) firstInvalid = availSelect;

    var collabInput = document.getElementById('collaborationExpectations');
    var isCollabValid = validateField(collabInput, (collabInput.value || '').trim().length >= 10, 'Please describe collaboration expectations (at least 10 characters).');
    if (!isCollabValid && !firstInvalid) firstInvalid = collabInput;

    if (firstInvalid) {
      if (firstInvalid.scrollIntoView) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (firstInvalid.focus) firstInvalid.focus();
      return;
    }

    var typesList = checkedTypes.map(function(cb) { return cb.value; });
    var otherText = document.getElementById('supportOfferOtherText');
    if (otherCheckbox && otherCheckbox.checked && otherText && otherText.value.trim()) {
      typesList.push('Other: ' + otherText.value.trim());
    }

    var targetProbId = matchedProblem ? matchedProblem.id : (problemId || 'CC-001');
    var targetProbTitle = matchedProblem ? matchedProblem.title : targetInput.value.trim();
    var targetPropId = matchedProposal ? matchedProposal.id : (proposalId || null);

    var orgVal = document.getElementById('supporterOrg') ? document.getElementById('supporterOrg').value.trim() : '';

    var savedOffer = null;
    if (typeof CivicStore !== 'undefined' && user) {
      savedOffer = CivicStore.saveSupportOffer({
        problemId: targetProbId,
        problemTitle: targetProbTitle,
        proposalId: targetPropId,
        supportType: typesList.join(', '),
        organization: orgVal || nameInput.value.trim(),
        contactPerson: nameInput.value.trim(),
        contactEmail: emailVal,
        role: roleInput.value.trim(),
        description: descInput.value.trim(),
        availability: availSelect.value,
        availabilityDetails: document.getElementById('availabilityDetails') ? document.getElementById('availabilityDetails').value.trim() : '',
        conditionsLimits: document.getElementById('offerLimits') ? document.getElementById('offerLimits').value.trim() : '',
        studentExpectations: document.getElementById('studentRequirements') ? document.getElementById('studentRequirements').value.trim() : '',
        collaborationExpectations: collabInput.value.trim()
      }, user);
    }

    var idEl = document.getElementById('confirmedOfferId');
    if (idEl) {
      idEl.textContent = savedOffer ? savedOffer.id : 'SR-NEW';
    }

    form.style.display = 'none';
    if (confirmationBox) {
      confirmationBox.style.display = 'block';
      confirmationBox.scrollIntoView({ behavior: 'smooth' });
    }
  });

  if (resetOfferFormBtn) {
    resetOfferFormBtn.addEventListener('click', function() {
      form.reset();
      document.querySelectorAll('.form-group.has-error').forEach(function(g) {
        g.classList.remove('has-error');
        var err = g.querySelector('.field-error');
        if (err) err.textContent = '';
      });
      if (confirmationBox) confirmationBox.style.display = 'none';
      form.style.display = 'block';
      var sn = document.getElementById('supporterName');
      if (sn) sn.focus();
    });
  }
}
