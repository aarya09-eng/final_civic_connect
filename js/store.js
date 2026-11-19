// CivicConnect — Data Persistence Layer (localStorage)
window.CivicStore = {
  PROBLEMS_KEY: 'civic_problems',
  PROPOSALS_KEY: 'civic_proposals',
  SUPPORT_KEY: 'civic_support_offers',
  CASES_KEY: 'civic_active_cases',
  STATUS_OVERRIDES_KEY: 'civic_status_overrides',

  _load(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } },
  _save(key, arr) { localStorage.setItem(key, JSON.stringify(arr)); },

  getProblems() {
    const saved = this._load(this.PROBLEMS_KEY);
    const sampleIds = new Set((typeof SAMPLE_PROBLEMS !== 'undefined' ? SAMPLE_PROBLEMS : []).map(p => p.id));
    const merged = [...(typeof SAMPLE_PROBLEMS !== 'undefined' ? SAMPLE_PROBLEMS : [])];
    saved.forEach(p => { if (!sampleIds.has(p.id)) merged.push(p); });
    const overrides = this._load(this.STATUS_OVERRIDES_KEY);
    const statusMap = Object.fromEntries(overrides.map(item => [item.id, item.status]));
    return merged.map(problem => statusMap[problem.id]
      ? { ...problem, status: statusMap[problem.id] }
      : problem);
  },

  saveReport(data, user) {
    const problem = {
      id: CivicUtils.generateId('CC'), slug: data.title.toLowerCase().replace(/\s+/g, '-').substring(0, 40),
      title: data.title, shortDescription: data.description.substring(0, 150),
      fullDescription: data.description, location: data.location, category: data.category,
      riskLevel: data.riskLevel, peopleAffected: parseInt(data.peopleAffected) || null,
      duration: data.duration || 'Not specified', affectedGroup: data.whoAffected || 'Not specified',
      status: 'New',
      priority: data.riskLevel === 'Critical' ? 'Critical' : data.riskLevel === 'High' ? 'High' : data.riskLevel === 'Low' ? 'Low' : 'Medium',
      severity: data.riskLevel, reportedBy: user.uid,
      reporterName: data.reporterName || 'Anonymous',
      reporterContact: data.reporterContact || '',
      evidenceFileName: data.evidenceFileName || '',
      possibleAreas: [],
      reportedDaysAgo: 0, coordinates: data.coordinates || null, state: '', district: '',
      createdAt: new Date().toISOString()
    };
    const arr = this._load(this.PROBLEMS_KEY); arr.push(problem); this._save(this.PROBLEMS_KEY, arr);
    return problem;
  },

  getMyReports(uid) { return this._load(this.PROBLEMS_KEY).filter(p => p.reportedBy === uid); },

  updateProblemStatus(id, status) {
    const arr = this._load(this.PROBLEMS_KEY);
    const i = arr.findIndex(p => p.id === id);
    if (i > -1) { arr[i].status = status; arr[i].updatedAt = new Date().toISOString(); this._save(this.PROBLEMS_KEY, arr); }
    if (typeof SAMPLE_PROBLEMS !== 'undefined') {
      const si = SAMPLE_PROBLEMS.findIndex(p => p.id === id);
      if (si > -1) SAMPLE_PROBLEMS[si].status = status;
    }
    const overrides = this._load(this.STATUS_OVERRIDES_KEY);
    const existing = overrides.find(item => item.id === id);
    if (existing) existing.status = status;
    else overrides.push({ id, status });
    this._save(this.STATUS_OVERRIDES_KEY, overrides);
  },

  getProposals() {
    const saved = this._load(this.PROPOSALS_KEY);
    const sample = typeof SAMPLE_STUDENT_PROPOSALS !== 'undefined' ? SAMPLE_STUDENT_PROPOSALS : [];
    const sampleIds = new Set(sample.map(p => p.id));
    const overrides = this._load(this.STATUS_OVERRIDES_KEY);
    const statusMap = Object.fromEntries(overrides.map(item => [item.id, item.status]));
    return [...sample, ...saved.filter(p => !sampleIds.has(p.id))].map(proposal =>
      statusMap['proposal:' + proposal.id]
        ? { ...proposal, status: statusMap['proposal:' + proposal.id] }
        : proposal
    );
  },

  saveProposal(data, user) {
    const proposal = {
      id: CivicUtils.generateId('SP'), problemId: data.problemId || '',
      problemTitle: data.problemTitle || '', solutionTitle: data.solutionTitle,
      student: user.name, university: data.university,
      status: 'Under Review', stepIndex: 1, date: CivicUtils.formatDate(),
      teamSize: data.teamSize || 1, approach: data.approach || '',
      description: data.description || '', detailedPlan: data.detailedPlan || '',
      requestedSupport: data.requestedSupport || '',
      supportingFiles: data.supportingFiles || [],
      contactPerson: data.contactPerson || user.name,
      contactEmail: data.contactEmail || user.email,
      projectStage: data.projectStage || 'Exploring the challenge',
      additionalNotes: data.additionalNotes || '',
      submittedBy: user.uid, createdAt: new Date().toISOString()
    };
    const arr = this._load(this.PROPOSALS_KEY); arr.push(proposal); this._save(this.PROPOSALS_KEY, arr);
    return proposal;
  },

  getMyProposals(uid) {
    const saved = this._load(this.PROPOSALS_KEY).filter(p => p.submittedBy === uid);
    const sample = typeof SAMPLE_STUDENT_PROPOSALS !== 'undefined'
      ? SAMPLE_STUDENT_PROPOSALS.filter(p => p.submittedBy === uid) : [];
    return [...sample, ...saved];
  },

  updateProposalStatus(id, status) {
    const arr = this._load(this.PROPOSALS_KEY);
    const i = arr.findIndex(p => p.id === id);
    if (i > -1) { arr[i].status = status; this._save(this.PROPOSALS_KEY, arr); }
    if (typeof SAMPLE_STUDENT_PROPOSALS !== 'undefined') {
      const si = SAMPLE_STUDENT_PROPOSALS.findIndex(p => p.id === id);
      if (si > -1) SAMPLE_STUDENT_PROPOSALS[si].status = status;
    }
    const overrides = this._load(this.STATUS_OVERRIDES_KEY);
    const key = 'proposal:' + id;
    const existing = overrides.find(item => item.id === key);
    if (existing) existing.status = status;
    else overrides.push({ id: key, status });
    this._save(this.STATUS_OVERRIDES_KEY, overrides);
  },

  getSupportOffers() {
    const saved = this._load(this.SUPPORT_KEY);
    const sample = typeof SAMPLE_SUPPORT_REQUESTS !== 'undefined' ? SAMPLE_SUPPORT_REQUESTS : [];
    const sampleIds = new Set(sample.map(s => s.id));
    const overrides = this._load(this.STATUS_OVERRIDES_KEY);
    const statusMap = Object.fromEntries(overrides.map(item => [item.id, item.status]));
    return [...sample, ...saved.filter(s => !sampleIds.has(s.id))].map(offer =>
      statusMap['support:' + offer.id]
        ? { ...offer, status: statusMap['support:' + offer.id] }
        : offer
    );
  },

  saveSupportOffer(data, user) {
    const offer = {
      id: CivicUtils.generateId('SR'), problemId: data.problemId || '',
      problemTitle: data.problemTitle || '', proposalId: data.proposalId || null,
      supportType: data.supportType, partnerCategory: data.partnerCategory || 'Partner',
      organization: data.organization || user.organization || user.name,
      contactPerson: data.contactPerson || user.name,
      contactEmail: data.contactEmail || user.email,
      role: data.role || '',
      status: 'Offered',
      date: CivicUtils.formatDate(),
      description: data.description,
      availability: data.availability || '',
      availabilityDetails: data.availabilityDetails || '',
      conditionsLimits: data.conditionsLimits || '',
      studentExpectations: data.studentExpectations || '',
      collaborationExpectations: data.collaborationExpectations || '',
      submittedBy: user.uid, createdAt: new Date().toISOString()
    };
    const arr = this._load(this.SUPPORT_KEY); arr.push(offer); this._save(this.SUPPORT_KEY, arr);
    return offer;
  },

  updateSupportStatus(id, status) {
    const arr = this._load(this.SUPPORT_KEY);
    const i = arr.findIndex(s => s.id === id);
    if (i > -1) { arr[i].status = status; this._save(this.SUPPORT_KEY, arr); }
    if (typeof SAMPLE_SUPPORT_REQUESTS !== 'undefined') {
      const si = SAMPLE_SUPPORT_REQUESTS.findIndex(s => s.id === id);
      if (si > -1) SAMPLE_SUPPORT_REQUESTS[si].status = status;
    }
    const overrides = this._load(this.STATUS_OVERRIDES_KEY);
    const key = 'support:' + id;
    const existing = overrides.find(item => item.id === key);
    if (existing) existing.status = status;
    else overrides.push({ id: key, status });
    this._save(this.STATUS_OVERRIDES_KEY, overrides);
  },

  getActiveCases() {
    const saved = this._load(this.CASES_KEY);
    const sample = typeof SAMPLE_ACTIVE_CASES !== 'undefined' ? SAMPLE_ACTIVE_CASES : [];
    const sampleIds = new Set(sample.map(c => c.id));
    return [...sample, ...saved.filter(c => !sampleIds.has(c.id))];
  },

  createActiveCase(proposal, support) {
    const problem = this.getProblems().find(p => p.id === proposal.problemId);
    const c = {
      id: CivicUtils.generateId('AC'), problemId: proposal.problemId,
      problemTitle: proposal.problemTitle || (problem ? problem.title : ''),
      location: problem ? problem.location : '',
      proposalId: proposal.id, proposalTitle: proposal.solutionTitle,
      team: proposal.student + ' (' + proposal.university + ')',
      studentTeam: proposal.student + ' (' + proposal.university + ')',
      supportId: support.id, partner: support.organization,
      partnerOrg: support.organization, supportType: support.supportType,
      stage: 'In Progress', stageIndex: 3,
      lastUpdated: CivicUtils.formatDate(), summary: 'Case created. Implementation starting.',
      createdAt: new Date().toISOString()
    };
    const arr = this._load(this.CASES_KEY); arr.push(c); this._save(this.CASES_KEY, arr);
    return c;
  },

  getSupportForProposal(proposalId) {
    return this.getSupportOffers().find(s => s.proposalId === proposalId) || null;
  }
};
