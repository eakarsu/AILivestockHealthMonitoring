'use strict';
function evaluate(input = {}) {
  const errors = [], animal = input.animal || {}, observations = input.observations || [],
    decisions = input.decisions || [], followUps = input.followUps || [];
  if (!animal.id || !animal.herdId || !animal.species || !animal.ownerConsent?.version || animal.ownerConsent?.revokedAt) errors.push('identified animal, herd, species, and active owner consent required');
  const seen = new Set();
  for (const observation of observations) {
    if (!observation.id || seen.has(String(observation.id)) || !observation.observedAt || !observation.sourceType || !observation.sourceVersion || !observation.unit || !Number.isFinite(Number(observation.value))) errors.push(`observation ${observation.id || '?'} lacks validated value/source/unit`);
    seen.add(String(observation.id));
    if (observation.deviceRef && !observation.deviceCalibrationAt) errors.push(`observation ${observation.id} device calibration missing`);
  }
  for (const decision of decisions) {
    if (!decision.id || !decision.ownerVeterinarianId || !decision.modelVersion || !decision.uncertaintyNote ||
        !Array.isArray(decision.observationIds) || decision.observationIds.some((id) => !seen.has(String(id)))) errors.push(`decision ${decision.id || '?'} lacks veterinarian ownership/evidence/uncertainty`);
    if (!Number.isFinite(Number(decision.confidence)) || decision.confidence < 0 || decision.confidence > 1) errors.push(`decision ${decision.id || '?'} confidence invalid`);
    if (decision.diagnosis || decision.autonomousTreatment) errors.push(`decision ${decision.id || '?'} crosses non-diagnostic boundary`);
    if (decision.urgency === 'emergency' && !decision.escalationAt) errors.push(`decision ${decision.id || '?'} emergency lacks escalation`);
    if ((decision.medicationSuggestions || []).some((m) => !m.withdrawalRuleVersion || !m.contraindicationChecked)) errors.push(`decision ${decision.id || '?'} medication safety incomplete`);
  }
  const decisionIds = new Set(decisions.map((item) => String(item.id)));
  for (const followUp of followUps) {
    if (!followUp.id || !decisionIds.has(String(followUp.decisionId)) || !followUp.ownerId ||
        Number.isNaN(Date.parse(followUp.dueAt)) || !['scheduled','completed','escalated'].includes(followUp.status)) {
      errors.push(`follow-up ${followUp.id || '?'} lacks decision, owner, due date, or state`);
    }
  }
  const missing = input.requiredObservationTypes || [];
  const present = new Set(observations.map((o) => o.type));
  const missingTypes = missing.filter((type) => !present.has(type));
  if (missingTypes.length && !input.missingDataDisposition) errors.push('missing-data disposition required');
  const validation = input.validation || {};
  if (!validation.datasetVersion || !Number.isFinite(Number(validation.calibrationError)) ||
      !Number.isFinite(Number(validation.falseNegativeRate)) || !validation.biasStrataReviewed ||
      validation.contraindicationCasesPassed !== true || validation.missingDataCasesPassed !== true ||
      validation.escalationCasesPassed !== true) errors.push('versioned calibration, bias, contraindication, missing-data, and escalation validation required');
  return { errors, result: { observationCount: observations.length, decisionCount: decisions.length, missingTypes,
    followUpCount: followUps.length, escalationCount: decisions.filter((d) => d.escalationAt).length, validation,
    decision: errors.length ? 'revise' : 'reviewable' },
    assumptions: ['observations are veterinary records, not human EHR/FHIR records'],
    uncertainty: { licensedVeterinarianApprovalRequired: true, fieldDeviceConnectivityUnverified: true, nonDiagnostic: true } };
}
module.exports = { evaluate };
