const MATCH_THRESHOLD = 80;

const criteria = [
  { key: 'education', label: 'Formación académica', weight: 20 },
  { key: 'general_experience', label: 'Experiencia general', weight: 20 },
  { key: 'specific_experience', label: 'Experiencia específica', weight: 25 },
  { key: 'technical_knowledge', label: 'Conocimientos técnicos', weight: 20 },
  { key: 'principal_requirements', label: 'Requisitos principales', weight: 10 },
  { key: 'competencies', label: 'Competencias', weight: 5 },
];

const ignoredTerms = new Set([
  'para', 'con', 'por', 'una', 'uno', 'unos', 'unas', 'del', 'los', 'las', 'que',
  'como', 'desde', 'hasta', 'sobre', 'entre', 'segun', 'debe', 'tener', 'contar',
  'minimo', 'minima', 'minimos', 'minimas', 'deseable', 'deseables', 'requisito',
  'requisitos', 'experiencia', 'general', 'especifica', 'especifico', 'academica',
  'academico', 'conocimiento', 'conocimientos', 'competencia', 'competencias',
  'formacion', 'estudios', 'laboral', 'anos', 'ano', 'meses', 'mes',
]);

function tokenize(value) {
  return new Set(
    String(value ?? '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLocaleLowerCase('es')
      .match(/[\p{L}\p{N}]+/gu)
      ?.filter((term) => (term.length >= 4 || /^\d+$/.test(term)) && !ignoredTerms.has(term)) ?? [],
  );
}

function criteriaText(profile, key) {
  if (key === 'competencies') {
    return (profile.competencies ?? [])
      .flatMap((competency) => [competency.name, competency.description])
      .filter(Boolean)
      .join(' ');
  }
  return profile[key] ?? '';
}

export function scoreResumeMatch(profile, resumeText) {
  const resumeTerms = tokenize(resumeText);
  if (resumeTerms.size < 5) {
    return { status: 'insufficient_data', score: null, breakdown: [] };
  }

  const evaluatedCriteria = criteria
    .map((criterion) => {
      const requiredTerms = tokenize(criteriaText(profile, criterion.key));
      if (!requiredTerms.size) return null;
      const matchedTerms = [...requiredTerms].filter((term) => resumeTerms.has(term)).sort();
      return {
        key: criterion.key,
        label: criterion.label,
        weight: criterion.weight,
        score: Math.round((matchedTerms.length / requiredTerms.size) * 100),
        matchedTerms,
        requiredTermCount: requiredTerms.size,
      };
    })
    .filter(Boolean);

  if (!evaluatedCriteria.length) {
    return { status: 'insufficient_data', score: null, breakdown: [] };
  }

  const totalWeight = evaluatedCriteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  const score = Math.round(
    evaluatedCriteria.reduce(
      (sum, criterion) => sum + criterion.score * criterion.weight,
      0,
    ) / totalWeight,
  );

  return { status: 'calculated', score, threshold: MATCH_THRESHOLD, breakdown: evaluatedCriteria };
}

export { MATCH_THRESHOLD };
