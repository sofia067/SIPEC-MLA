import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPLICATION_DOCUMENT_TYPES,
  applicationDocumentsSchema,
  getApplicationDocumentLabel,
} from '../src/services/application-documents.js';

test('accepts distinct supported application document requirements', () => {
  const result = applicationDocumentsSchema.safeParse([
    { type: 'professional_title', required: true },
    { type: 'experience_certificate', required: false },
  ]);

  assert.equal(result.success, true);
});

test('rejects duplicate or unsupported application document requirements', () => {
  assert.equal(applicationDocumentsSchema.safeParse([
    { type: 'professional_title', required: true },
    { type: 'professional_title', required: false },
  ]).success, false);
  assert.equal(applicationDocumentsSchema.safeParse([
    { type: 'unverified_document', required: true },
  ]).success, false);
});

test('limits requirement configuration to supported document categories', () => {
  assert.equal(APPLICATION_DOCUMENT_TYPES.length, 4);
  assert.equal(getApplicationDocumentLabel('professional_title'), 'Título profesional');
  assert.equal(getApplicationDocumentLabel('unknown'), undefined);
});
