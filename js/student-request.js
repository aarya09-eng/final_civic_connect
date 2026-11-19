/**
 * CivicConnect — Student Solution Proposal Logic (js/student-request.js)
 * Strictly Vanilla JavaScript | Preserves CivicStore & CIVIC_AUTH integration
 */

document.addEventListener('DOMContentLoaded', function() {
  if (typeof CIVIC_AUTH !== 'undefined') {
    var user = CIVIC_AUTH.requireAuth(['student', 'admin']);
    if (!user) return;
  }
  initStudentRequestForm();
});

function initStudentRequestForm() {
  var user = typeof CIVIC_AUTH !== 'undefined' ? CIVIC_AUTH.getCurrentUser() : null;
  var form = document.getElementById('studentRequestForm');
  var confirmationBox = document.getElementById('requestConfirmation');
  var resetRequestFormBtn = document.getElementById('resetRequestFormBtn');

  if (!form) return;

  var urlParams = new URLSearchParams(window.location.search);
  var problemId = urlParams.get('problemId') || urlParams.get('id');

  var contextBox = document.getElementById('challengeContextBox');
  var contextTitleEl = document.getElementById('contextProblemTitle');
  var contextLocationEl = document.getElementById('contextProblemLocation');
  var challengeTopicInput = document.getElementById('challengeTopic');
  var backLink = document.getElementById('backLink');

  var matchedProblem = null;
  if (problemId) {
    var availableProblems = typeof CivicStore !== 'undefined'
      ? CivicStore.getProblems()
      : (typeof SAMPLE_PROBLEMS !== 'undefined' ? SAMPLE_PROBLEMS : []);
    matchedProblem = availableProblems.find(function(p) { return p.id === problemId || p.slug === problemId; });
    if (matchedProblem) {
      if (contextBox) contextBox.style.display = 'block';
      if (contextTitleEl) contextTitleEl.textContent = matchedProblem.id + ': ' + matchedProblem.title;
      if (contextLocationEl) contextLocationEl.textContent = '\u2022 ' + matchedProblem.location + ' | Category: ' + matchedProblem.category;
      if (challengeTopicInput) challengeTopicInput.value = matchedProblem.title;
      if (backLink) {
        backLink.href = 'details.html?id=' + encodeURIComponent(matchedProblem.id);
        backLink.innerHTML = '<span aria-hidden="true">&larr;</span> Back to Challenge Details (' + matchedProblem.id + ')';
      }
    }
  }

  // Pre-fill student info if logged in
  if (user) {
    var personInput = document.getElementById('contactPerson');
    if (personInput && !personInput.value) personInput.value = user.name || '';

    var emailInput = document.getElementById('contactEmail');
    if (emailInput && !emailInput.value) emailInput.value = user.email || '';

    var instInput = document.getElementById('institution');
    if (instInput && !instInput.value && user.university) instInput.value = user.university;
  }

  // Support needed "Other" toggle
  var otherCheckbox = document.getElementById('supportNeededOther');
  var otherWrap = document.getElementById('supportOtherWrap');
  if (otherCheckbox && otherWrap) {
    otherCheckbox.addEventListener('change', function() {
      otherWrap.style.display = otherCheckbox.checked ? 'block' : 'none';
      if (otherCheckbox.checked) {
        var otherText = document.getElementById('supportOtherText');
        if (otherText) otherText.focus();
      }
    });
  }

  // --------------------------------------------------------------------------
  // Supporting Material Upload Zone (Multi-file preview)
  // --------------------------------------------------------------------------
  var materialsInput = document.getElementById('supportingMaterialsInput');
  var materialsDropZone = document.getElementById('materialsDropZone');
  var fileList = document.getElementById('materialsFileList');
  var selectedFiles = [];

  function renderFileList() {
    if (!fileList) return;
    fileList.innerHTML = '';
    selectedFiles.forEach(function(file, index) {
      var li = document.createElement('li');
      li.className = 'file-list__item';
      var sizeKb = Math.round(file.size / 1024);
      var sizeText = sizeKb > 1024 ? (sizeKb / 1024).toFixed(1) + ' MB' : sizeKb + ' KB';
      li.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="font-weight:600;color:var(--color-brand-primary);">&#128196; ' + escapeHTML(file.name) + '</span>' +
          '<span style="font-size:0.78rem;color:var(--color-text-muted);">(' + sizeText + ')</span>' +
        '</div>' +
        '<button type="button" class="btn btn-outline-subtle btn-sm" data-file-index="' + index + '" style="font-size:0.75rem;padding:3px 8px;">Remove</button>';
      fileList.appendChild(li);
    });

    fileList.querySelectorAll('button[data-file-index]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var idx = parseInt(btn.getAttribute('data-file-index'));
        selectedFiles.splice(idx, 1);
        renderFileList();
      });
    });
  }

  function addFiles(newFiles) {
    for (var i = 0; i < newFiles.length; i++) {
      selectedFiles.push(newFiles[i]);
    }
    renderFileList();
  }

  if (materialsInput) {
    materialsInput.addEventListener('change', function() {
      if (materialsInput.files && materialsInput.files.length > 0) {
        addFiles(materialsInput.files);
      }
    });
  }

  if (materialsDropZone) {
    ['dragenter', 'dragover'].forEach(function(eventName) {
      materialsDropZone.addEventListener(eventName, function(e) {
        e.preventDefault();
        e.stopPropagation();
        materialsDropZone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach(function(eventName) {
      materialsDropZone.addEventListener(eventName, function(e) {
        e.preventDefault();
        e.stopPropagation();
        materialsDropZone.classList.remove('is-dragover');
      });
    });

    materialsDropZone.addEventListener('drop', function(e) {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
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

  // Clear errors on input
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

    var projectTitle = document.getElementById('projectTitle');
    var isProjectTitleValid = validateField(projectTitle, (projectTitle.value || '').trim().length >= 4, 'Please enter a clear project title (at least 4 characters).');
    if (!isProjectTitleValid && !firstInvalid) firstInvalid = projectTitle;

    var challengeTopic = document.getElementById('challengeTopic');
    var isChallengeValid = validateField(challengeTopic, (challengeTopic.value || '').trim().length >= 3, 'Please identify the community challenge.');
    if (!isChallengeValid && !firstInvalid) firstInvalid = challengeTopic;

    var institution = document.getElementById('institution');
    var isInstValid = validateField(institution, (institution.value || '').trim().length >= 3, 'Please enter your college or university name.');
    if (!isInstValid && !firstInvalid) firstInvalid = institution;

    var contactPerson = document.getElementById('contactPerson');
    var isContactValid = validateField(contactPerson, (contactPerson.value || '').trim().length >= 2, 'Please enter the student lead name.');
    if (!isContactValid && !firstInvalid) firstInvalid = contactPerson;

    var teamSize = document.getElementById('teamSize');
    var teamSizeVal = parseInt(teamSize ? teamSize.value : '0') || 0;
    var isTeamSizeValid = validateField(teamSize, teamSizeVal >= 1 && teamSizeVal <= 20, 'Please enter team size (1-20).');
    if (!isTeamSizeValid && !firstInvalid) firstInvalid = teamSize;

    var contactPhone = document.getElementById('contactPhone');
    var isPhoneValid = validateField(contactPhone, (contactPhone.value || '').trim().length >= 8, 'Please enter a valid phone number.');
    if (!isPhoneValid && !firstInvalid) firstInvalid = contactPhone;

    var contactEmail = document.getElementById('contactEmail');
    var emailVal = (contactEmail ? contactEmail.value : '').trim();
    var isEmailValid = validateField(contactEmail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal), 'Please enter a valid contact email.');
    if (!isEmailValid && !firstInvalid) firstInvalid = contactEmail;

    var specificProblem = document.getElementById('specificProblem');
    var isSpecValid = validateField(specificProblem, (specificProblem.value || '').trim().length >= 10, 'Please provide root cause analysis (at least 10 characters).');
    if (!isSpecValid && !firstInvalid) firstInvalid = specificProblem;

    var whoAffected = document.getElementById('whoAffected');
    var isWhoValid = validateField(whoAffected, (whoAffected.value || '').trim().length >= 5, 'Please describe who is affected.');
    if (!isWhoValid && !firstInvalid) firstInvalid = whoAffected;

    var currentGap = document.getElementById('currentGap');
    var isGapValid = validateField(currentGap, (currentGap.value || '').trim().length >= 10, 'Please describe constraints and limitations.');
    if (!isGapValid && !firstInvalid) firstInvalid = currentGap;

    var proposedSolution = document.getElementById('proposedSolution');
    var isSolValid = validateField(proposedSolution, (proposedSolution.value || '').trim().length >= 15, 'Please describe your proposed solution (at least 15 characters).');
    if (!isSolValid && !firstInvalid) firstInvalid = proposedSolution;

    var approachDifference = document.getElementById('approachDifference');
    var isDiffValid = validateField(approachDifference, (approachDifference.value || '').trim().length >= 10, 'Please explain what makes this approach viable.');
    if (!isDiffValid && !firstInvalid) firstInvalid = approachDifference;

    var howItWorks = document.getElementById('howItWorks');
    var isHowValid = validateField(howItWorks, (howItWorks.value || '').trim().length >= 10, 'Please specify key measurable metrics.');
    if (!isHowValid && !firstInvalid) firstInvalid = howItWorks;

    var validationPlan = document.getElementById('validationPlan');
    var isValValid = validateField(validationPlan, (validationPlan.value || '').trim().length >= 10, 'Please describe how partners could help.');
    if (!isValValid && !firstInvalid) firstInvalid = validationPlan;

    var expectedOutcome = document.getElementById('expectedOutcome');
    var isOutValid = validateField(expectedOutcome, (expectedOutcome.value || '').trim().length >= 10, 'Please describe expected outcome.');
    if (!isOutValid && !firstInvalid) firstInvalid = expectedOutcome;

    var checkedSupport = Array.from(document.querySelectorAll('input[name="supportNeeded"]:checked'));
    var supportErrorEl = document.getElementById('supportNeededError');
    if (checkedSupport.length === 0) {
      if (supportErrorEl) supportErrorEl.textContent = 'Please select at least one kind of support.';
      if (!firstInvalid) firstInvalid = document.getElementById('supportNeededGrid');
    } else {
      if (supportErrorEl) supportErrorEl.textContent = '';
    }

    var projectStage = document.getElementById('projectStage');
    var isStageValid = validateField(projectStage, (projectStage ? projectStage.value : '') !== '', 'Please select the current project stage.');
    if (!isStageValid && !firstInvalid) firstInvalid = projectStage;

    if (firstInvalid) {
      if (firstInvalid.scrollIntoView) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (firstInvalid.focus) firstInvalid.focus();
      return;
    }

    var supportList = checkedSupport.map(function(cb) { return cb.value; });
    var otherText = document.getElementById('supportOtherText');
    if (otherCheckbox && otherCheckbox.checked && otherText && otherText.value.trim()) {
      supportList.push('Other: ' + otherText.value.trim());
    }

    var fileNames = selectedFiles.map(function(f) { return f.name; });

    var targetProblemId = matchedProblem ? matchedProblem.id : (problemId || 'CC-001');
    var targetProblemTitle = matchedProblem ? matchedProblem.title : challengeTopic.value.trim();

    var savedProposal = null;
    if (typeof CivicStore !== 'undefined' && user) {
      savedProposal = CivicStore.saveProposal({
        problemId: targetProblemId,
        problemTitle: targetProblemTitle,
        solutionTitle: projectTitle.value.trim(),
        university: institution.value.trim(),
        teamSize: teamSizeVal,
        approach: proposedSolution.value.trim(),
        description: specificProblem.value.trim(),
        detailedPlan: 'Approach Viability: ' + approachDifference.value.trim() + '\nKey Metrics: ' + howItWorks.value.trim() + '\nValidation: ' + validationPlan.value.trim() + '\nOutcome: ' + expectedOutcome.value.trim(),
        requestedSupport: supportList.join(', '),
        supportingFiles: fileNames,
        contactPerson: contactPerson.value.trim(),
        contactEmail: emailVal,
        projectStage: projectStage.value,
        additionalNotes: document.getElementById('additionalNotes') ? document.getElementById('additionalNotes').value.trim() : ''
      }, user);
    }

    var confirmedIdEl = document.getElementById('confirmedProposalId');
    if (confirmedIdEl) {
      confirmedIdEl.textContent = savedProposal ? savedProposal.id : 'SP-NEW';
    }

    form.style.display = 'none';
    if (confirmationBox) {
      confirmationBox.style.display = 'block';
      confirmationBox.scrollIntoView({ behavior: 'smooth' });
    }
  });

  if (resetRequestFormBtn) {
    resetRequestFormBtn.addEventListener('click', function() {
      form.reset();
      selectedFiles = [];
      renderFileList();
      document.querySelectorAll('.form-group.has-error').forEach(function(g) {
        g.classList.remove('has-error');
        var err = g.querySelector('.field-error');
        if (err) err.textContent = '';
      });
      if (confirmationBox) confirmationBox.style.display = 'none';
      form.style.display = 'block';
      var pt = document.getElementById('projectTitle');
      if (pt) pt.focus();
    });
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
