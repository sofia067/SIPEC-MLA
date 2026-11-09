import { z } from 'zod';

export const APPLICATION_DOCUMENT_TYPES = [
  { type: 'professional_title', label: 'Título profesional' },
  { type: 'experience_certificate', label: 'Certificado de experiencia laboral' },
  { type: 'training_certificate', label: 'Certificado de capacitación' },
  { type: 'other_certificate', label: 'Otro certificado solicitado' },
];

const applicationDocumentType = z.enum(APPLICATION_DOCUMENT_TYPES.map(({ type }) => type));

export const applicationDocumentsSchema = z.array(z.object({
  type: applicationDocumentType,
  required: z.boolean(),
})).max(APPLICATION_DOCUMENT_TYPES.length).superRefine((documents, context) => {
  const types = documents.map(({ type }) => type);
  if (new Set(types).size !== types.length) {
    context.addIssue({
      code: 'custom',
      message: 'No se puede repetir un tipo de documento solicitado.',
    });
  }
});

export function getApplicationDocumentLabel(type) {
  return APPLICATION_DOCUMENT_TYPES.find((document) => document.type === type)?.label;
}
