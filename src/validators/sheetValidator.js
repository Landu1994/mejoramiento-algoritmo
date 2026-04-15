/**
 * Validador de estructura de hojas Excel
 * Implementa RF04 - Validación de estructura por hoja
 * Soporta schemas flexibles con aliases
 */

class SheetValidator {
  constructor(config, logger, schema = null) {
    this.config = config;
    this.logger = logger;
    this.schema = schema; // Schema opcional con aliases
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
      if (this.schema) {
        // Usar schema flexible con aliases
        const validation = this.validateWithSchema(headerRow, sheetName);
        result.valid = validation.valid;
        result.errors.push(...validation.errors);
        result.warnings.push(...validation.warnings);
      } else if (this.config.EXPECTED_COLUMNS) {
        // Usar validación legacy
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
    const expectedColumns = this.config.EXPECTED_COLUMNS;
    const headerSet = new Set(headers.map(h => h?.toString().toLowerCase().trim()));

    // Verificar columnas faltantes
    const missingColumns = expectedColumns.filter(col => 
      !headerSet.has(col.toLowerCase())
    );

    if (missingColumns.length > 0) {
      result.valid = false;
      result.errors.push({
        type: 'MISSING_COLUMNS',
        message: `Columnas faltantes: ${missingColumns.join(', ')}`,
        sheetName,
        missingColumns
      });
    }

    // Verificar columnas extra (advertencia, no error)
    const extraColumns = headers.filter(header => {
      const normalized = header?.toString().toLowerCase().trim();
      return !expectedColumns.some(col => col.toLowerCase() === normalized);
    });

    if (extraColumns.length > 0) {
      result.warnings.push({
        type: 'EXTRA_COLUMNS',
        message: `Columnas adicionales no esperadas: ${extraColumns.join(', ')}`,
        sheetName,
        extraColumns
      });
    }

    return result;
  }

  /**
   * Validar con schema flexible (reconoce aliases)
   * @param {Array} headers - Encabezados encontrados
   * @param {string} sheetName - Nombre de la hoja
   * @returns {Object} - Resultado de validación
   */
  validateWithSchema(headers, sheetName) {
    const result = { valid: true, errors: [], warnings: [] };
    
    // Normalizar headers
    const normalizedHeaders = headers.map(h => {
      if (!h) return null;
      let normalized = h.toString().trim();
      if (this.schema.headerConfig?.normalize?.ignoreCase) {
        normalized = normalized.toUpperCase();
      }
      return normalized;
    }).filter(h => h !== null);

    // Obtener columnas requeridas del schema
    const requiredColumns = this.schema.columns.filter(col => col.required);
    const allColumns = this.schema.columns;

    // Función para buscar columna en headers (considerando aliases)
    const findColumn = (columnDef) => {
      const namesToCheck = [columnDef.name, ...(columnDef.aliases || [])];
      
      for (const name of namesToCheck) {
        const normalizedName = this.schema.headerConfig?.normalize?.ignoreCase 
          ? name.toUpperCase() 
          : name;
        
        if (normalizedHeaders.includes(normalizedName)) {
          return true;
        }
      }
      return false;
    };

    // Verificar columnas requeridas
    const missingRequired = requiredColumns.filter(col => !findColumn(col));
    
    if (missingRequired.length > 0) {
      // Solo marcar como error si son columnas realmente críticas
      const criticalMissing = missingRequired.filter(col => 
        ['MUNICIPIO', 'NOMBRE COMPLETO', 'TIPO DE DOCUMENTO'].includes(col.name)
      );
      
      if (criticalMissing.length > 0) {
        result.valid = false;
        result.errors.push({
          type: 'MISSING_REQUIRED_COLUMNS',
          message: `Columnas requeridas faltantes: ${criticalMissing.map(c => c.name).join(', ')}`,
          sheetName,
          missingColumns: criticalMissing.map(c => c.name)
        });
      } else if (missingRequired.length > 0) {
        // Columnas requeridas pero no críticas - solo advertencia
        result.warnings.push({
          type: 'MISSING_OPTIONAL_REQUIRED',
          message: `Columnas opcionales no encontradas: ${missingRequired.map(c => c.name).join(', ')}`,
          sheetName,
          missingColumns: missingRequired.map(c => c.name)
        });
      }
    }

    // Verificar columnas no reconocidas
    const recognizedHeaders = [];
    normalizedHeaders.forEach(header => {
      const isRecognized = allColumns.some(col => {
        const namesToCheck = [col.name, ...(col.aliases || [])];
        return namesToCheck.some(name => {
          const normalized = this.schema.headerConfig?.normalize?.ignoreCase 
            ? name.toUpperCase() 
            : name;
          return normalized === header;
        });
      });
      
      if (!isRecognized) {
        recognizedHeaders.push(header);
      }
    });

    if (recognizedHeaders.length > 0) {
      result.warnings.push({
        type: 'UNRECOGNIZED_COLUMNS',
        message: `Columnas no reconocidas (se ignorarán): ${recognizedHeaders.join(', ')}`,
        sheetName,
        unrecognizedColumns: recognizedHeaders
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
    
    if (this.schema) {
      // Usar schema con aliases para mapeo flexible
      headers.forEach((header, index) => {
        if (!header) return;
        
        const normalizedHeader = this.schema.headerConfig?.normalize?.ignoreCase 
          ? header.toString().trim().toUpperCase()
          : header.toString().trim();
        
        // Buscar columna en el schema (incluyendo aliases)
        const columnDef = this.schema.columns.find(col => {
          const namesToCheck = [col.name, ...(col.aliases || [])];
          return namesToCheck.some(name => {
            const normalizedName = this.schema.headerConfig?.normalize?.ignoreCase 
              ? name.toUpperCase()
              : name;
            return normalizedName === normalizedHeader;
          });
        });
        
        if (columnDef) {
          mapping.set(index, columnDef.jsonField);
        }
      });
    } else if (this.config.COLUMN_MAPPING) {
      // Mapeo legacy (sin schema)
      headers.forEach((header, index) => {
        const normalizedHeader = header?.toString().trim();
        
        // Buscar en COLUMN_MAPPING (case-insensitive)
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
