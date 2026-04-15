/**
 * Transformador de filas Excel a objetos JSON
 * Implementa RF07 - Transformación a estructura JSON
 * Implementa RF08 - Manejo de errores por registro
 */

const DataSanitizers = require('../utils/dataSanitizers');

class JsonTransformer {
  constructor(config, logger, schema = null) {
    this.config = config;
    this.logger = logger;
    this.schema = schema;
    this.seenValues = new Map(); // Para validar unicidad
    
    // Crear mapa de tipos de campos desde el schema
    this.fieldTypes = new Map();
    if (schema && schema.columns) {
      schema.columns.forEach(col => {
        this.fieldTypes.set(col.jsonField, col.type || 'string');
      });
    }
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
    // Obtener tipo de campo del schema
    const fieldType = this.fieldTypes.get(fieldName);
    
    // Aplicar sanitización según el tipo de campo
    if (fieldType) {
      switch (fieldType) {
        case 'email':
          return DataSanitizers.cleanEmail(value);
        case 'number':
          return DataSanitizers.cleanNumber(value);
        case 'phone':
          return DataSanitizers.cleanPhone(value);
        case 'date':
          return DataSanitizers.cleanDate(value);
        case 'boolean':
          return DataSanitizers.cleanBoolean(value);
        case 'string':
        default:
          return DataSanitizers.cleanString(value);
      }
    }
    
    // Fallback: lógica original si no hay schema
    // Si el valor es null o undefined
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Normalizar fechas
    if (this.config.VALIDATIONS?.dateFields?.includes(fieldName)) {
      return this.parseDate(value);
    }

    // Normalizar números
    if (typeof value === 'number') {
      return value;
    }

    // Normalizar strings
    if (typeof value === 'string') {
      return value.trim();
    }

    // Booleanos
    if (typeof value === 'boolean') {
      return value;
    }

    return value;
  }

  /**
   * Parsear fecha desde Excel
   * @param {*} value - Valor de fecha
   * @returns {Date|null}
   */
  parseDate(value) {
    try {
      // Excel almacena fechas como números (días desde 1900-01-01)
      if (typeof value === 'number') {
        const date = new Date((value - 25569) * 86400 * 1000);
        return isNaN(date.getTime()) ? null : date;
      }

      // Si es string, intentar parsear
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      }

      // Si ya es una fecha
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
      }

      return null;
    } catch (error) {
      return null;
    }
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
