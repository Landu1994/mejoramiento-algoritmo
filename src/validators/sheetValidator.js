/**
 * Validador de estructura de hojas Excel
 * Implementa RF04 - Validación de estructura por hoja
 */

class SheetValidator {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Validar la estructura de una hoja
   * RF04 - Evaluar cada hoja de forma independiente
   * @param {Object} sheet - Hoja de Excel
   * @param {string} sheetName - Nombre de la hoja
   * @returns {Object} - Resultado de validación { valid, errors, headers }
   */
  validateSheet(sheet, sheetName) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      headers: [],
      sheetName
    };

    try {
      // Obtener la fila de encabezados según configuración (RF01)
      const headerRow = sheet[this.config.HEADER_ROW];
      
      if (!headerRow || headerRow.length === 0) {
        result.valid = false;
        result.errors.push({
          type: 'MISSING_HEADERS',
          message: `No se encontraron encabezados en la fila ${this.config.HEADER_ROW}`,
          sheetName
        });
        return result;
      }

      result.headers = headerRow;

      // RF02 - Validar estructura de columnas
      if (this.config.EXPECTED_COLUMNS) {
        const validation = this.validateByColumnNames(headerRow, sheetName);
        result.valid = validation.valid;
        result.errors.push(...validation.errors);
        result.warnings.push(...validation.warnings);
      } else if (this.config.COLUMN_INDICES) {
        const validation = this.validateByIndices(headerRow, sheetName);
        result.valid = validation.valid;
        result.errors.push(...validation.errors);
      }

      // Log de resultados
      if (result.valid) {
        this.logger.info(`✓ Hoja "${sheetName}" validada correctamente`);
      } else {
        this.logger.error(`✗ Hoja "${sheetName}" contiene errores de estructura`, {
          errors: result.errors
        });
      }

      if (result.warnings.length > 0) {
        this.logger.warn(`Advertencias en hoja "${sheetName}"`, {
          warnings: result.warnings
        });
      }

    } catch (error) {
      result.valid = false;
      result.errors.push({
        type: 'VALIDATION_ERROR',
        message: `Error al validar hoja: ${error.message}`,
        sheetName
      });
      this.logger.error(`Error al validar hoja "${sheetName}"`, { error: error.message });
    }

    return result;
  }

  /**
   * Validar por nombres de columnas
   * @param {Array} headers - Encabezados encontrados
   * @param {string} sheetName - Nombre de la hoja
   * @returns {Object} - Resultado de validación
   */
  validateByColumnNames(headers, sheetName) {
    const result = { valid: true, errors: [], warnings: [] };
    const expectedColumns = this.config.EXPECTED_COLUMNS || [];
    const headerSet = new Set(
      headers.map(h => h?.toString().toLowerCase().trim()).filter(Boolean)
    );

    const requiredExcel = this.config.VALIDATIONS?.required || [];
    const missingRequired = requiredExcel.filter(
      col => !headerSet.has(col.toLowerCase())
    );

    if (missingRequired.length > 0) {
      result.valid = false;
      result.errors.push({
        type: 'MISSING_REQUIRED_COLUMNS',
        message: `Faltan columnas obligatorias: ${missingRequired.join(', ')}`,
        sheetName,
        missingColumns: missingRequired
      });
    }

    const missingExpected = expectedColumns.filter(
      col => !headerSet.has(col.toLowerCase())
    );

    if (missingExpected.length > 0) {
      result.warnings.push({
        type: 'MISSING_EXPECTED_COLUMNS',
        message: `Faltan columnas del formato completo (${missingExpected.length}); se omitirán en el mapeo`,
        sheetName,
        missingColumns: missingExpected
      });
    }

    const extraColumns = headers.filter(header => {
      const normalized = header?.toString().toLowerCase().trim();
      if (!normalized) return false;
      return !expectedColumns.some(col => col.toLowerCase() === normalized);
    });

    if (extraColumns.length > 0) {
      result.warnings.push({
        type: 'EXTRA_COLUMNS',
        message: `Columnas no listadas en EXPECTED_COLUMNS: ${extraColumns.join(', ')}`,
        sheetName,
        extraColumns
      });
    }

    return result;
  }

  /**
   * Validar por índices de columnas
   * @param {Array} headers - Encabezados encontrados
   * @param {string} sheetName - Nombre de la hoja
   * @returns {Object} - Resultado de validación
   */
  validateByIndices(headers, sheetName) {
    const result = { valid: true, errors: [] };
    const expectedIndices = this.config.COLUMN_INDICES;

    // Verificar que existan las columnas en los índices esperados
    const missingIndices = expectedIndices.filter(idx => 
      idx >= headers.length || !headers[idx]
    );

    if (missingIndices.length > 0) {
      result.valid = false;
      result.errors.push({
        type: 'MISSING_INDICES',
        message: `Faltan columnas en los índices: ${missingIndices.join(', ')}`,
        sheetName,
        missingIndices
      });
    }

    return result;
  }

  /**
   * Obtener mapeo de columnas para transformación
   * @param {Array} headers - Encabezados de la hoja
   * @returns {Map} - Mapa de índice a nombre de campo
   */
  getColumnMapping(headers) {
    const mapping = new Map();

    if (this.config.COLUMN_MAPPING) {
      headers.forEach((header, index) => {
        const normalizedHeader = header?.toString().trim();

        const targetField = Object.keys(this.config.COLUMN_MAPPING).find(key =>
          key.toLowerCase() === normalizedHeader.toLowerCase()
        );

        if (targetField) {
          mapping.set(index, this.config.COLUMN_MAPPING[targetField]);
        }
      });
    } else {
      // Mapeo directo si no hay COLUMN_MAPPING definido
      headers.forEach((header, index) => {
        if (header) {
          mapping.set(index, header.toString().trim());
        }
      });
    }

    return mapping;
  }
}

module.exports = SheetValidator;
