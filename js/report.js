/**
 * CivicConnect — Report a Problem Logic (js/report.js)
 * Strictly Vanilla JavaScript | Preserves CivicStore & CIVIC_AUTH backend integration
 */

document.addEventListener('DOMContentLoaded', function() {
  if (typeof CIVIC_AUTH !== 'undefined') {
    var user = CIVIC_AUTH.requireAuth(['citizen', 'admin']);
    if (!user) return;
  }
  initReportForm();
});

function initReportForm() {
  var user = typeof CIVIC_AUTH !== 'undefined' ? CIVIC_AUTH.getCurrentUser() : null;
  var form = document.getElementById('reportProblemForm');
  var confirmationBox = document.getElementById('reportConfirmation');
  var clearFormBtn = document.getElementById('clearFormBtn');
  var resetFormFromSuccessBtn = document.getElementById('resetFormFromSuccessBtn');
  var useLocationBtn = document.getElementById('useMyLocationBtn');
  var locationStatusMsg = document.getElementById('locationStatusMsg');

  if (!form) return;

  var titleInput = document.getElementById('problemTitle');
  var descriptionInput = document.getElementById('problemDescription');
  var locationInput = document.getElementById('problemLocation');
  var categorySelect = document.getElementById('problemCategory');
  var riskLevelSelect = document.getElementById('riskLevelSelect');

  var evidenceInput = document.getElementById('supportingEvidenceInput');
  var evidenceDropZone = document.getElementById('evidenceDropZone');
  var evidencePreviewWrap = document.getElementById('evidencePreviewWrap');
  var evidenceFileName = document.getElementById('evidenceFileName');
  var removeEvidenceBtn = document.getElementById('removeEvidenceBtn');
  var selectedEvidenceName = '';

  // --------------------------------------------------------------------------
  // 1. Browser Geolocation API ("Use My Location")
  // --------------------------------------------------------------------------
  function showLocationStatus(type, message) {
    if (!locationStatusMsg) return;
    locationStatusMsg.className = 'location-status-msg location-status-msg--' + type;
    locationStatusMsg.textContent = message;
    locationStatusMsg.style.display = 'block';
  }

  if (useLocationBtn && locationInput) {
    useLocationBtn.addEventListener('click', function() {
      if (!navigator.geolocation) {
        showLocationStatus('error', 'Browser geolocation is not supported in this browser.');
        return;
      }

      showLocationStatus('loading', 'Requesting browser location...');
      useLocationBtn.disabled = true;

      navigator.geolocation.getCurrentPosition(
        function(position) {
          useLocationBtn.disabled = false;
          var lat = position.coords.latitude;
          var lng = position.coords.longitude;
          var accuracy = Math.round(position.coords.accuracy);

          locationInput.value = 'Approx. Lat ' + lat.toFixed(4) + ', Lng ' + lng.toFixed(4) + ' (\u00b1' + accuracy + 'm)';
          locationInput.dataset.lat = lat;
          locationInput.dataset.lng = lng;

          var locGroup = locationInput.closest('.form-group');
          if (locGroup) {
            locGroup.classList.remove('has-error');
            var errEl = locGroup.querySelector('.field-error');
            if (errEl) errEl.textContent = '';
          }

          showLocationStatus('success', 'Location detected (' + lat.toFixed(4) + ', ' + lng.toFixed(4) + '). You can append a landmark, village, or ward name.');
        },
        function(err) {
          useLocationBtn.disabled = false;
          var msg = 'Could not retrieve your location. Please enter your village, town, or ward manually.';
          if (err.code === 1) msg = 'Location access was denied. Please enter your location manually.';
          else if (err.code === 3) msg = 'Location request timed out. Please enter your location manually.';
          showLocationStatus('error', msg);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  // --------------------------------------------------------------------------
  // 2. Field Validation Helper
  // --------------------------------------------------------------------------
  function validateField(inputEl, condition, errorMsg) {
    var parentGroup = inputEl ? inputEl.closest('.form-group') : null;
    var errorEl = parentGroup ? parentGroup.querySelector('.field-error') : null;

    if (!condition) {
      if (parentGroup) parentGroup.classList.add('has-error');
      if (errorEl) errorEl.textContent = errorMsg;
      return false;
    } else {
      if (parentGroup) parentGroup.classList.remove('has-error');
      if (errorEl) errorEl.textContent = '';
      return true;
    }
  }

  [titleInput, descriptionInput, locationInput, categorySelect].forEach(function(el) {
    if (!el) return;
    el.addEventListener('input', function() {
      var parent = el.closest('.form-group');
      if (parent && parent.classList.contains('has-error')) {
        parent.classList.remove('has-error');
        var err = parent.querySelector('.field-error');
        if (err) err.textContent = '';
      }
    });
    el.addEventListener('change', function() {
      var parent = el.closest('.form-group');
      if (parent && parent.classList.contains('has-error')) {
        parent.classList.remove('has-error');
        var err = parent.querySelector('.field-error');
        if (err) err.textContent = '';
      }
    });
  });

  // --------------------------------------------------------------------------
  // 3. Supporting Evidence File Handling (Images, Video, PDF, Docs)
  // --------------------------------------------------------------------------
  function updateEvidenceFile(file) {
    if (file && evidencePreviewWrap && evidenceFileName) {
      selectedEvidenceName = file.name;
      var sizeKb = Math.round(file.size / 1024);
      var sizeText = sizeKb > 1024 ? (sizeKb / 1024).toFixed(1) + ' MB' : sizeKb + ' KB';
      evidenceFileName.textContent = 'Selected: ' + file.name + ' (' + sizeText + ')';
      evidencePreviewWrap.style.display = 'block';
    } else {
      clearEvidenceFile();
    }
  }

  function clearEvidenceFile() {
    selectedEvidenceName = '';
    if (evidenceInput) evidenceInput.value = '';
    if (evidencePreviewWrap) evidencePreviewWrap.style.display = 'none';
    if (evidenceFileName) evidenceFileName.textContent = '';
  }

  if (evidenceInput) {
    evidenceInput.addEventListener('change', function() {
      if (evidenceInput.files && evidenceInput.files.length > 0) {
        updateEvidenceFile(evidenceInput.files[0]);
      } else {
        clearEvidenceFile();
      }
    });
  }

  if (evidenceDropZone) {
    ['dragenter', 'dragover'].forEach(function(eventName) {
      evidenceDropZone.addEventListener(eventName, function(e) {
        e.preventDefault();
        e.stopPropagation();
        evidenceDropZone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach(function(eventName) {
      evidenceDropZone.addEventListener(eventName, function(e) {
        e.preventDefault();
        e.stopPropagation();
        evidenceDropZone.classList.remove('is-dragover');
      });
    });

    evidenceDropZone.addEventListener('drop', function(e) {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        var file = e.dataTransfer.files[0];
        updateEvidenceFile(file);
      }
    });
  }

  if (removeEvidenceBtn) {
    removeEvidenceBtn.addEventListener('click', function(e) {
      e.preventDefault();
      clearEvidenceFile();
    });
  }

  // --------------------------------------------------------------------------
  // 4. Form Submission Handling
  // --------------------------------------------------------------------------
  form.addEventListener('submit', function(event) {
    event.preventDefault();

    var firstInvalid = null;

    var titleVal = (titleInput.value || '').trim();
    var isTitleValid = validateField(
      titleInput,
      titleVal.length >= 5,
      'Please enter a short title describing the problem (at least 5 characters).'
    );
    if (!isTitleValid && !firstInvalid) firstInvalid = titleInput;

    var descVal = (descriptionInput.value || '').trim();
    var isDescValid = validateField(
      descriptionInput,
      descVal.length >= 15,
      'Please explain what is happening in a few sentences (at least 15 characters).'
    );
    if (!isDescValid && !firstInvalid) firstInvalid = descriptionInput;

    var locVal = (locationInput.value || '').trim();
    var isLocValid = validateField(
      locationInput,
      locVal.length >= 3,
      'Please provide an example village, town, ward, or landmark.'
    );
    if (!isLocValid && !firstInvalid) firstInvalid = locationInput;

    var catVal = categorySelect ? categorySelect.value : '';
    var isCatValid = validateField(
      categorySelect,
      catVal && catVal !== '' && catVal !== 'select',
      'Please choose a broad category (select "Not sure" if you are uncertain).'
    );
    if (!isCatValid && !firstInvalid) firstInvalid = categorySelect;

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    var coords = null;
    if (locationInput.dataset.lat && locationInput.dataset.lng) {
      coords = [parseFloat(locationInput.dataset.lat), parseFloat(locationInput.dataset.lng)];
    }

    var savedProblem = null;
    if (typeof CivicStore !== 'undefined' && user) {
      savedProblem = CivicStore.saveReport({
        title: titleVal,
        description: descVal,
        location: locVal,
        category: catVal,
        riskLevel: riskLevelSelect ? riskLevelSelect.value : 'Medium',
        peopleAffected: document.getElementById('approxPeopleAffected') ? document.getElementById('approxPeopleAffected').value : '',
        duration: document.getElementById('durationSelect') ? document.getElementById('durationSelect').value : '',
        whoAffected: document.getElementById('whoIsAffected') ? document.getElementById('whoIsAffected').value : '',
        reporterName: document.getElementById('reporterName') ? document.getElementById('reporterName').value : '',
        reporterContact: document.getElementById('reporterContact') ? document.getElementById('reporterContact').value : '',
        evidenceFileName: selectedEvidenceName,
        coordinates: coords
      }, user);
    }

    var idEl = document.getElementById('confirmedProblemId');
    if (idEl) {
      idEl.textContent = savedProblem ? savedProblem.id : 'CC-NEW';
    }

    form.style.display = 'none';
    if (confirmationBox) {
      confirmationBox.style.display = 'block';
      confirmationBox.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // --------------------------------------------------------------------------
  // 5. Form Reset
  // --------------------------------------------------------------------------
  function resetForm() {
    form.reset();
    document.querySelectorAll('.form-group.has-error').forEach(function(g) {
      g.classList.remove('has-error');
      var err = g.querySelector('.field-error');
      if (err) err.textContent = '';
    });
    if (locationStatusMsg) {
      locationStatusMsg.style.display = 'none';
      locationStatusMsg.textContent = '';
    }
    clearEvidenceFile();
    if (confirmationBox) confirmationBox.style.display = 'none';
    form.style.display = 'block';
    if (titleInput) titleInput.focus();
  }

  if (clearFormBtn) clearFormBtn.addEventListener('click', resetForm);
  if (resetFormFromSuccessBtn) resetFormFromSuccessBtn.addEventListener('click', resetForm);
}
