const camposLegibles = [
  'name',
  'description',
  'title',
  'label',
  'value',
  'text',
  'requirement',
  'certificate',
  'certificado',
  'certification',
  'certifications',
  'certificacion',
  'certificación',
  'certificaciones',
  'conocimiento',
  'conocimientos',
  'technicalKnowledge',
  'technical_knowledge',
];

export function convertirListaLegible(valor) {
  if (Array.isArray(valor)) {
    return valor.flatMap(convertirListaLegible).filter(Boolean);
  }

  if (valor && typeof valor === 'object') {
    const valoresLegibles = camposLegibles
      .map((campo) => valor[campo])
      .filter((campo) => campo !== undefined && campo !== null && campo !== '');
    const valores = valoresLegibles.length ? valoresLegibles : Object.values(valor);
    const texto = valores
      .flatMap(convertirListaLegible)
      .filter(Boolean)
      .join(' — ');
    return texto ? [texto] : [];
  }

  if (typeof valor === 'string') {
    const texto = valor.trim();
    if (!texto) return [];
    try {
      const convertido = JSON.parse(texto);
      if (convertido !== valor) return convertirListaLegible(convertido);
    } catch {
      return [texto];
    }
    return [texto];
  }

  return typeof valor === 'number' ? [String(valor)] : [];
}
