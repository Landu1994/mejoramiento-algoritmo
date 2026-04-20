/**
 * Transformador de filas Excel a objetos JSON
 * Implementa RF07 - Transformación a estructura JSON
 * Implementa RF08 - Manejo de errores por registro
 */

const DataSanitizers = require('../utils/dataSanitizers');

class JsonTransformer {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.seenValues = new Map(); // Para validar unicidad
  }

  /**
   * Transformar un lote de filas a objetos JSON
   * @param {Array} rows - Filas a transformar
   * @param {Map} columnMapping - Mapeo de columnas
   * @param {string} sheetName - Nombre de la hoja
   * @param {number} startRowIndex - Índice de inicio para tracking
   * @returns {Object} - { documents, errors }
   */
  transformBatch(rows, columnMapping, sheetName, startRowIndex = 0) {
    const documents = [];
    const errors = [];

    rows.forEach((row, index) => {
      const rowNumber = startRowIndex + index + 1;
      
      try {
        const doc = this.transformRow(row, columnMapping, sheetName, rowNumber);
        
        if (doc.valid) {
          documents.push(doc.data);
        } else {
          errors.push({
            row: rowNumber,
            sheet: sheetName,
            errors: doc.errors
          });
          
          // RF08 - Registrar error sin detener el procesamiento
          this.logger.warn(`Error en fila ${rowNumber} de "${sheetName}"`, {
            errors: doc.errors
          });
        }
      } catch (error) {
        errors.push({
          row: rowNumber,
          sheet: sheetName,
          errors: [{
            type: 'TRANSFORM_ERROR',
            message: error.message
          }]
        });
        
        this.logger.error(`Error al transformar fila ${rowNumber} de "${sheetName}"`, {
          error: error.message
        });
      }
    });

    return { documents, errors };
  }

  /**
   * Transformar una fila individual a documento JSON
   * @param {Array} row - Fila de datos
   * @param {Map} columnMapping - Mapeo de columnas
   * @param {string} sheetName - Nombre de la hoja
   * @param {number} rowNumber - Número de fila
   * @returns {Object} - { valid, data, errors }
   */
  transformRow(row, columnMapping, sheetName, rowNumber) {
    const result = {
      valid: true,
      data: {},
      errors: []
    };

    // Construir objeto base
    columnMapping.forEach((fieldName, columnIndex) => {
      const value = row[columnIndex];
      result.data[fieldName] = this.normalizeValue(value, fieldName);
    });

    // Aplicar validaciones
    const validationResult = this.validateDocument(result.data, sheetName, rowNumber);
    
    if (!validationResult.valid) {
      result.valid = false;
      result.errors = validationResult.errors;
    }

    // Agregar metadatos
    if (result.valid) {
      result.data._metadata = {
        sourceSheet: sheetName,
        sourceRow: rowNumber,
        processedAt: new Date().toISOString()
      };
    }

    return result;
  }

  /**
   * Normalizar valor según tipo de campo
   * @param {*} value - Valor a normalizar
   * @param {string} fieldName - Nombre del campo
   * @returns {*} - Valor normalizado
   */
  normalizeValue(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const validations = this.config.VALIDATIONS || {};

    if (validations.emailFields) {
      const match = validations.emailFields.find(f => this.getMappedFieldName(f) === fieldName);
      if (match) {
        return DataSanitizers.cleanEmail(value);
      }
    }

    if (validations.numericFields) {
      const match = validations.numericFields.find(f => this.getMappedFieldName(f) === fieldName);
      if (match) {
        return DataSanitizers.cleanNumber(value);
      }
    }

    if (fieldName === 'telefono') {
      return DataSanitizers.cleanPhone(value);
    }

    if (validations.dateFields) {
      const match = validations.dateFields.find(f => this.getMappedFieldName(f) === fieldName);
      if (match) {
        return DataSanitizers.cleanDate(value);
      }
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'boolean') {
      return value;
    }

    return value;
  }

  /**
   * Validar documento
   * @param {Object} doc - Documento a validar
   * @param {string} sheetName - Nombre de la hoja
   * @param {number} rowNumber - Número de fila
   * @returns {Object} - { valid, errors }
   */
  validateDocument(doc, sheetName, rowNumber) {
    const result = {
      valid: true,
      errors: []
    };

    const validations = this.config.VALIDATIONS || {};

    // Validar campos requeridos
    if (validations.required) {
      validations.required.forEach(field => {
        const mappedField = this.getMappedFieldName(field);
        if (!doc[mappedField] || doc[mappedField] === null) {
          result.valid = false;
          result.errors.push({
            type: 'REQUIRED_FIELD',
            field: mappedField,
            message: `Campo requerido "${field}" está vacío`
          });
        }
      });
    }

    // Validar formato de email
    if (validations.emailFields) {
      validations.emailFields.forEach(field => {
        const mappedField = this.getMappedFieldName(field);
        const value = doc[mappedField];
        
        if (value && !this.isValidEmail(value)) {
          result.valid = false;
          result.errors.push({
            type: 'INVALID_EMAIL',
            field: mappedField,
            message: `Email inválido: "${value}"`
          });
        }
      });
    }

    // Validar campos numéricos
    if (validations.numericFields) {
      validations.numericFields.forEach(field => {
        const mappedField = this.getMappedFieldName(field);
        const value = doc[mappedField];
        
        if (value !== null && value !== undefined && value !== '' && isNaN(value)) {
          result.valid = false;
          result.errors.push({
            type: 'INVALID_NUMBER',
            field: mappedField,
            message: `Valor no numérico: "${value}"`
          });
        }
      });
    }

    // Validar unicidad (dentro del procesamiento actual)
    if (validations.uniqueFields) {
      validations.uniqueFields.forEach(field => {
        const mappedField = this.getMappedFieldName(field);
        const value = doc[mappedField];
        
        if (value) {
          const key = `${mappedField}:${value}`;
          if (this.seenValues.has(key)) {
            result.valid = false;
            result.errors.push({
              type: 'DUPLICATE_VALUE',
              field: mappedField,
              message: `Valor duplicado "${value}" en campo "${field}"`,
              previousOccurrence: this.seenValues.get(key)
            });
          } else {
            this.seenValues.set(key, { sheet: sheetName, row: rowNumber });
          }
        }
      });
    }

    return result;
  }

  /**
   * Obtener nombre de campo mapeado
   * @param {string} originalField - Nombre original del campo
   * @returns {string} - Nombre mapeado
   */
  getMappedFieldName(originalField) {
    if (this.config.COLUMN_MAPPING) {
      return this.config.COLUMN_MAPPING[originalField] || originalField;
    }
    return originalField;
  }

  /**
   * Validar formato de email
   * @param {string} email - Email a validar
   * @returns {boolean}
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Resetear cache de unicidad
   */
  resetUniqueCache() {
    this.seenValues.clear();
  }
}

module.exports = JsonTransformer;
