function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function documentIdentityFindings(text, candidate) {
  const findings = [];
  const normalizedText = normalizeText(text);
  if (!normalizedText) return findings;
  const normalizedName = normalizeText(candidate.full_name);
  const nameParts = normalizedName.split(' ').filter((part) => part.length >= 3);
  if (nameParts.length && !nameParts.every((part) => normalizedText.includes(part))) {
    findings.push({
      code: 'applicant_name_not_found',
      severity: 'review',
      message: 'No se pudieron reconocer todos los nombres del postulante en el texto del documento.',
    });
  }

  const applicantNumber = normalizeText(candidate.document_number).replace(/\s/g, '');
  const applicantNumberDigitsOnly = /^\d{6,12}$/u.test(applicantNumber);
  const possibleNumbers = [...normalizedText.matchAll(/(?:^|\s)(\d{6,12})(?=\s|$)/gu)]
    .map((match) => match[1]);
  if (applicantNumberDigitsOnly && possibleNumbers.length && !possibleNumbers.includes(applicantNumber)) {
    findings.push({
      code: 'applicant_document_number_not_found',
      severity: 'review',
      message: 'El documento contiene un número que podría ser identificatorio, pero no coincide con el registrado para el postulante.',
    });
  } else if (applicantNumber && applicantNumber.length >= 6
    && (!applicantNumberDigitsOnly || !possibleNumbers.length)
    && !normalizedText.replace(/\s/g, '').includes(applicantNumber)) {
    findings.push({
      code: 'applicant_document_number_not_found',
      severity: 'review',
      message: 'No se pudo confirmar en el texto extraído el número de documento del postulante.',
    });
  }
  return findings;
}

export function assessDocumentReview({ text, candidate, duplicates = [], pdfMetadata = {} }) {
  const findings = candidate ? documentIdentityFindings(text, candidate) : [];
  if (duplicates.length) {
    findings.push({
      code: 'exact_duplicate_file',
      severity: 'review',
      message: 'El archivo es idéntico, byte por byte, a otro documento adjuntado por postulantes.',
      references: duplicates.map(({ applicationCode, documentType }) => ({
        applicationCode,
        documentType,
      })),
    });
  }

  const now = Date.now();
  for (const [field, label] of [
    ['creationDate', 'creación'],
    ['modificationDate', 'modificación'],
  ]) {
    const date = pdfMetadata[field] ? new Date(pdfMetadata[field]) : null;
    if (date && !Number.isNaN(date.getTime()) && date.getTime() > now + 24 * 60 * 60 * 1000) {
      findings.push({
        code: `pdf_${field}_in_future`,
        severity: 'review',
        message: `Los metadatos indican una fecha de ${label} futura. Verifica el archivo; el reloj o los metadatos podrían ser incorrectos.`,
      });
    }
  }

  return findings;
}
