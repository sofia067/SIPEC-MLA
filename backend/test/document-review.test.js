import test from 'node:test';
import assert from 'node:assert/strict';
import { assessDocumentReview } from '../src/services/document-review.js';

const candidate = {
  full_name: 'María Sofía Pérez',
  document_number: '12345678',
};

test('reports no identity mismatch when the applicant name and number are present', () => {
  const findings = assessDocumentReview({
    text: 'CERTIFICADO otorgado a Maria Sofia Perez, documento 12345678.',
    candidate,
  });

  assert.deepEqual(findings, []);
});

test('flags a possible different numeric identity as a manual review finding', () => {
  const findings = assessDocumentReview({
    text: 'Certificado otorgado a Maria Sofia Perez, documento 87654321.',
    candidate,
  });

  assert.equal(findings.length, 1);
  assert.equal(findings[0].code, 'applicant_document_number_not_found');
  assert.equal(findings[0].severity, 'review');
});

test('handles alphanumeric document numbers without misclassifying unrelated numeric text', () => {
  const findings = assessDocumentReview({
    text: 'Certificado otorgado a Maria Sofia Perez, registro 87654321.',
    candidate: { ...candidate, document_number: 'AB123456' },
  });

  assert.equal(findings.some(({ code }) => code === 'applicant_document_number_not_found'), true);
});

test('flags a name that OCR could not confirm without declaring fraud', () => {
  const findings = assessDocumentReview({
    text: 'Certificado de estudios concluido en administración pública.',
    candidate,
  });

  assert.equal(findings.some(({ code }) => code === 'applicant_name_not_found'), true);
  assert.equal(findings.every(({ severity }) => severity === 'review'), true);
});

test('does not report missing identity fields when OCR returns no text', () => {
  assert.deepEqual(assessDocumentReview({ text: '', candidate }), []);
});

test('reports byte-identical copies with anonymous candidate references', () => {
  const findings = assessDocumentReview({
    text: 'Texto del certificado',
    candidate,
    duplicates: [{ applicationCode: 'PC-00042', documentType: 'Título profesional' }],
  });

  assert.deepEqual(findings.at(-1), {
    code: 'exact_duplicate_file',
    severity: 'review',
    message: 'El archivo es idéntico, byte por byte, a otro documento adjuntado por postulantes.',
    references: [{ applicationCode: 'PC-00042', documentType: 'Título profesional' }],
  });
});

test('flags future PDF metadata dates only as a review signal', () => {
  const findings = assessDocumentReview({
    text: 'Texto del certificado',
    pdfMetadata: { creationDate: '2999-01-01T00:00:00.000Z' },
  });

  assert.equal(findings[0].code, 'pdf_creationDate_in_future');
  assert.equal(findings[0].severity, 'review');
  assert.match(findings[0].message, /podrían ser incorrectos/u);
});

test('does not infer fraud when PDF metadata dates are absent', () => {
  const findings = assessDocumentReview({ text: 'Texto del certificado' });

  assert.deepEqual(findings, []);
});
