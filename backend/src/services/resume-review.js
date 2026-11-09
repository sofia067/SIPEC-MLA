const MASK = '[DATO PERSONAL OCULTO]';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceKnownIdentifier(text, value) {
  const identifier = String(value ?? '').trim();
  if (identifier.length < 3) return { text, count: 0 };
  const flexibleWhitespace = escapeRegex(identifier).replace(/\s+/g, '\\s+');
  const expression = new RegExp(flexibleWhitespace, 'giu');
  let count = 0;
  const redacted = text.replace(expression, () => {
    count += 1;
    return MASK;
  });
  return { text: redacted, count };
}

export function redactResumeIdentifiers(text, candidate) {
  let redactedText = String(text ?? '');
  const maskedItems = { applicantDetails: 0, emails: 0, phoneNumbers: 0 };

  for (const identifier of [candidate.full_name, candidate.document_number]) {
    const result = replaceKnownIdentifier(redactedText, identifier);
    redactedText = result.text;
    maskedItems.applicantDetails += result.count;
  }

  for (const [identifier, category] of [
    [candidate.email, 'emails'],
    [candidate.phone, 'phoneNumbers'],
  ]) {
    const result = replaceKnownIdentifier(redactedText, identifier);
    redactedText = result.text;
    maskedItems[category] += result.count;
  }

  redactedText = redactedText.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, () => {
    maskedItems.emails += 1;
    return MASK;
  });
  redactedText = redactedText.replace(/(?<!\p{L})\+?\d(?:[\d\s().-]{6,}\d)(?!\p{L})/gu, (value) => {
    if (value.replace(/\D/g, '').length < 8) return value;
    maskedItems.phoneNumbers += 1;
    return MASK;
  });

  return { text: redactedText, maskedItems };
}

export function redactCandidateDocumentText(text, candidate, findings = []) {
  const identityMismatch = findings.some(({ code }) => (
    code === 'applicant_name_not_found'
    || code === 'applicant_document_number_not_found'
  ));
  if (identityMismatch) {
    return { text: null, identityMismatch: true };
  }

  return {
    ...redactResumeIdentifiers(text, candidate),
    identityMismatch: false,
  };
}

export function assessResumeTextQuality(text) {
  const source = String(text ?? '');
  const visibleText = source.replace(/\s/g, '');
  const words = source.match(/[\p{L}\p{N}]+/gu) ?? [];
  const replacementCharacters = (source.match(/\uFFFD/gu) ?? []).length;
  const controlCharacters = (source.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/gu) ?? []).length;
  const suspiciousCharacters = replacementCharacters + controlCharacters;
  const quality = visibleText.length < 100 || words.length < 20
    ? 'insufficient'
    : visibleText.length < 500 || words.length < 80 || suspiciousCharacters > 0
      ? 'review'
      : 'readable';

  return {
    quality,
    characterCount: visibleText.length,
    wordCount: words.length,
    suspiciousCharacterCount: suspiciousCharacters,
  };
}
