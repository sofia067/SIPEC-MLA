import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assessResumeTextQuality,
  redactCandidateDocumentText,
  redactResumeIdentifiers,
} from '../src/services/resume-review.js';

test('redacts known applicant details, emails, and phone numbers without returning originals', () => {
  const result = redactResumeIdentifiers(
    'María Sofía Pérez, documento AB123456, maria@example.test, +593 99 123 4567. Otro correo: hr@example.test.',
    {
      full_name: 'María Sofía Pérez',
      document_number: 'AB123456',
      email: 'maria@example.test',
      phone: '+593 99 123 4567',
    },
  );

  assert.equal(result.text.includes('María Sofía Pérez'), false);
  assert.equal(result.text.includes('AB123456'), false);
  assert.equal(result.text.includes('maria@example.test'), false);
  assert.equal(result.text.includes('hr@example.test'), false);
  assert.equal(result.text.includes('+593 99 123 4567'), false);
  assert.equal(result.maskedItems.applicantDetails, 2);
  assert.equal(result.maskedItems.emails, 2);
  assert.equal(result.maskedItems.phoneNumbers, 1);
});

test('does not mask short identifiers that could commonly appear in CV text', () => {
  const result = redactResumeIdentifiers('Ana lideró el equipo durante 2024.', {
    full_name: 'Ana',
    document_number: '',
    email: '',
    phone: '',
  });

  assert.equal(result.text, 'Ana lideró el equipo durante 2024.');
});

test('hides all OCR text from blind review when identity checks do not match', () => {
  const result = redactCandidateDocumentText(
    'Nombre distinto, DNI 12345678, correo: persona@example.test',
    { full_name: 'Postulante de prueba', document_number: '87654321' },
    [{ code: 'applicant_document_number_not_found' }],
  );

  assert.equal(result.text, null);
  assert.equal(result.identityMismatch, true);
});

test('flags short or sparse extracted text as insufficient', () => {
  assert.deepEqual(assessResumeTextQuality('CV'), {
    quality: 'insufficient',
    characterCount: 2,
    wordCount: 1,
    suspiciousCharacterCount: 0,
  });
});

test('marks text with sufficient content but suspicious extraction characters for review', () => {
  const text = `${'experiencia profesional '.repeat(30)}�`;
  const result = assessResumeTextQuality(text);

  assert.equal(result.quality, 'review');
  assert.equal(result.suspiciousCharacterCount, 1);
});

test('recognizes longer clean extracted text as readable', () => {
  const result = assessResumeTextQuality('experiencia profesional '.repeat(50));

  assert.equal(result.quality, 'readable');
  assert.ok(result.wordCount >= 80);
  assert.ok(result.characterCount >= 500);
});
