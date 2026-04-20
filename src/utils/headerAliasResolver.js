/**
 * Normalizes Excel header text for alias lookup (trim, collapse spaces, lower case).
 * @param {string|null|undefined} header
 * @returns {string}
 */
function normalizeHeaderKey(header) {
  if (header === null || header === undefined) return '';
  return header
    .toString()
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Default header typos / variants seen in Antioquia matrices → canonical names
 * (must match keys in COLUMN_MAPPING / EXPECTED_COLUMNS).
 * Keys are normalized with normalizeHeaderKey.
 */
const DEFAULT_HEADER_ALIASES = {
  'documendo de identidad': 'DOCUMENTO DE IDENTIDAD',
  'subsidios otorgados externos (fecha entidad otorgante valor)':
    'SUBSIDIOS OTORGADOS EXTERNOS (fecha entidad otorgante valor)',
  'subsidios otorgados viva (fecha entidad otorgante valor)':
    'SUBSIDIOS OTORGADOS VIVA (fecha entidad otorgante valor)',
  'subsidios otorgados viva (fecha, entidad otorgante, valor)':
    'SUBSIDIOS OTORGADOS VIVA (fecha entidad otorgante valor)',
  'subsidios otorgados externos (fecha, entidad otorgante, valor)':
    'SUBSIDIOS OTORGADOS EXTERNOS (fecha entidad otorgante valor)',
  'ministerio de vivienda cuidad y territorio: matricula catastral':
    'MINISTERIO DE VIVIENDA CIUDAD Y TERRITORIO: MATRICULA CATASTRAL',
  'ministerio de vivienda, cuidad y territorio: matricula catastral':
    'MINISTERIO DE VIVIENDA CIUDAD Y TERRITORIO: MATRICULA CATASTRAL',
  'ministerio de vivienda , cuidad y territorio: matricula catastral':
    'MINISTERIO DE VIVIENDA CIUDAD Y TERRITORIO: MATRICULA CATASTRAL',
  'obsrvaciones cruce vur': 'OBSERVACIONES CRUCE VUR',
  'observaciones cruce ': 'OBSERVACIONES CRUCE VUR',
  'observaciones cruce': 'OBSERVACIONES CRUCE VUR',
  'obsrvaciones cruce vur ': 'OBSERVACIONES CRUCE VUR',
  'obsrvaciones cruce vur': 'OBSERVACIONES CRUCE VUR',
  'obsrvaciones crue vur': 'OBSERVACIONES CRUCE VUR',
  'observaciones curce vur': 'OBSERVACIONES CRUCE VUR',
  'obsrvaciones vur': 'OBSERVACIONES CRUCE VUR',
  'cruce vur': 'OBSERVACIONES CRUCE VUR',
  'cruce vur observaciones ': 'OBSERVACIONES CRUCE VUR',
  'obsrvaciones ': 'OBSERVACIONES',
  'obesrvaciones cruce vur': 'OBSERVACIONES CRUCE VUR',
  'obesrvaciones ': 'OBSERVACIONES',
  'viabilidad cruce': 'VIABILIDAD',
  'viabilidad cruce ': 'VIABILIDAD',
  'viabilidad curce': 'VIABILIDAD',
  'viabilidad curce ': 'VIABILIDAD',
  'fcha sisben': 'FICHA SISBEN',
  'ficha de sisben': 'FICHA SISBEN',
  'fichas sisben': 'FICHA SISBEN',
  'ficha sisben': 'FICHA SISBEN',
  'sisben': 'FICHA SISBEN',
  'subregion': 'SUBREGIÓN',
  'santuario': 'SUBREGIÓN',
  'email': 'CORREO ELECTRONICO',
  'correo': 'CORREO ELECTRONICO',
  'cedula': 'DOCUMENTO DE IDENTIDAD',
  'telefono': 'NUMERO DE CONTACTO',
  'tipo documento': 'TIPO DE DOCUMENTO',
  'nombres completos': 'NOMBRE COMPLETO',
  'sexo': 'GENERO',
  'f,c,s,d,t': 'FCSDT'
};

/**
 * Merges config.HEADER_ALIASES (normalized keys → exact canonical names).
 * @param {Record<string, string>} [configAliases]
 * @returns {Record<string, string>}
 */
function mergeAliases(configAliases = {}) {
  const merged = { ...DEFAULT_HEADER_ALIASES };
  for (const [k, v] of Object.entries(configAliases)) {
    merged[normalizeHeaderKey(k)] = v;
  }
  return merged;
}

/**
 * Resolves a raw Excel header to the canonical column title used in COLUMN_MAPPING.
 * @param {string|null|undefined} header
 * @param {{ EXPECTED_COLUMNS?: string[], HEADER_ALIASES?: Record<string, string> }} config
 * @returns {string} Canonical title or whitespace-collapsed original if unknown
 */
function resolveCanonicalHeader(header, config) {
  const raw = header?.toString();
  if (!raw) return '';

  const collapsed = raw.trim().replace(/\s+/g, ' ');
  const key = normalizeHeaderKey(collapsed);
  if (!key) return '';

  const aliases = mergeAliases(config.HEADER_ALIASES);
  if (aliases[key]) {
    return aliases[key];
  }

  const expected = config.EXPECTED_COLUMNS || [];
  for (const col of expected) {
    if (normalizeHeaderKey(col) === key) {
      return col;
    }
  }

  const mappingKeys = Object.keys(config.COLUMN_MAPPING || {});
  for (const col of mappingKeys) {
    if (normalizeHeaderKey(col) === key) {
      return col;
    }
  }

  return collapsed;
}

module.exports = {
  normalizeHeaderKey,
  resolveCanonicalHeader,
  mergeAliases,
  DEFAULT_HEADER_ALIASES
};
