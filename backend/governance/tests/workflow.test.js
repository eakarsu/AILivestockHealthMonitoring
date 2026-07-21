'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluate } = require('../domain');

test('domain workflow accepts a grounded reviewable case', () => {
  const evaluation = evaluate({
  animal: { id: 'cow1', herdId: 'h1', species: 'bovine', ownerConsent: { version: 'c1', grantedAt: '2026-01-01' } },
  observations: [{ id: 'o1', type: 'temperature', observedAt: '2026-07-18T10:00:00Z', sourceType: 'vet',
    sourceVersion: 'v1', unit: 'C', value: 39.1 }],
  decisions: [{ id: 'd1', ownerVeterinarianId: 'vet1', modelVersion: 'm1', observationIds: ['o1'],
    confidence: 0.7, uncertaintyNote: 'single observation; examination required', urgency: 'review',
    diagnosis: false, autonomousTreatment: false, medicationSuggestions: [] }],
  followUps: [{ id: 'f1', decisionId: 'd1', ownerId: 'vet1', dueAt: '2026-07-19T10:00:00Z', status: 'scheduled' }],
  requiredObservationTypes: ['temperature'],
  validation: { datasetVersion: 'vd1', calibrationError: 0.05, falseNegativeRate: 0.08,
    biasStrataReviewed: true, contraindicationCasesPassed: true, missingDataCasesPassed: true,
    escalationCasesPassed: true }
});
  assert.deepEqual(evaluation.errors, []);
  assert.equal(evaluation.result.decision, 'reviewable');
  assert.ok(Array.isArray(evaluation.assumptions));
  assert.equal(typeof evaluation.uncertainty, 'object');
});

test('domain workflow fails closed on incomplete or unsafe input', () => {
  const evaluation = evaluate({ animal: {}, observations: [], decisions: [{ id: 'd', diagnosis: true }], requiredObservationTypes: ['temperature'], validation: {} });
  assert.ok(evaluation.errors.length > 0);
  assert.notEqual(evaluation.result.decision, 'reviewable');
});
