import test from 'node:test';
import assert from 'node:assert/strict';
import { MATCH_THRESHOLD, scoreResumeMatch } from '../src/services/match-scoring.js';

test('scores resume keywords against the requirements and reports the 80% threshold', () => {
  const result = scoreResumeMatch({
    education: 'Título profesional en administración pública',
    general_experience: 'Experiencia laboral en gestión pública',
    specific_experience: '',
    technical_knowledge: 'Manejo de presupuesto y contrataciones',
    principal_requirements: '',
    competencies: [{ name: 'Planificación estratégica' }],
  }, 'Título profesional en administración pública. Experiencia laboral en gestión pública. Manejo de presupuesto y contrataciones. Planificación estratégica.');

  assert.equal(result.status, 'calculated');
  assert.equal(result.score, 100);
  assert.equal(result.threshold, MATCH_THRESHOLD);
  assert.equal(MATCH_THRESHOLD, 80);
  assert.equal(result.breakdown.length, 4);
});

test('returns an insufficient-data status when the resume has too little text', () => {
  const result = scoreResumeMatch({
    education: 'Título profesional',
  }, 'CV');

  assert.deepEqual(result, { status: 'insufficient_data', score: null, breakdown: [] });
});

test('returns exactly 80% when four of five profile terms are found', () => {
  const result = scoreResumeMatch({
    technical_knowledge: 'JavaScript PostgreSQL React Node testing',
  }, 'JavaScript PostgreSQL React Node experiencia profesional con varios años laborales.');

  assert.equal(result.score, 80);
  assert.equal(result.threshold, 80);
  assert.equal(result.breakdown[0].matchedTerms.length, 4);
});

test('returns an insufficient-data status when the position has no criteria', () => {
  const result = scoreResumeMatch({}, 'Currículum vitae con información extensa de experiencia y formación profesional.');

  assert.deepEqual(result, { status: 'insufficient_data', score: null, breakdown: [] });
});
