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
   * Limpiar formatos de moneda y convertir a número
   * @param {*} valor - Valor de entrada
   * @returns {number|null} - Número convertido o null si viene vacío
   */
  limpiarMoneda(valor) {
    if (valor === null || valor === undefined || valor === '') {
      return null;
    }

    if (typeof valor === 'number') {
      return Number.isNaN(valor) ? NaN : valor;
    }

    return Number(
      valor
        .toString()
        .replace(/\$/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '.')
    );
  }

  /**
   * Limpiar campos numéricos flexibles.
   * Tokens no numéricos frecuentes se convierten a null para evitar cast en Mongo.
   * @param {*} valor
   * @returns {number|null}
   */
  limpiarNumeroFlexible(valor) {
    if (valor === null || valor === undefined || valor === '') {
      return null;
    }

    if (typeof valor === 'number') {
      return Number.isNaN(valor) ? NaN : valor;
    }

    const texto = valor.toString().trim();
    const token = texto.toUpperCase();
    const tokensNulos = new Set([
      'FAVORABLE',
      'NO FAVORABLE',
      'SI',
      'S',
      'NO',
      'FALLECIDA',
      'N/A',
      'NA',
      'N.A.',
      '-',
      ''
    ]);

    if (tokensNulos.has(token)) {
      return null;
    }

    return this.limpiarMoneda(texto);
  }

  removeDiacritics(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  buildValidDate(day, month, year) {
    if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return NaN;
    if (year < 1900 || year > 2100) return NaN;
    if (month < 1 || month > 12) return NaN;
    if (day < 1 || day > 31) return NaN;

    const date = new Date(year, month - 1, day);
    const valid =
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;

    return valid ? date : NaN;
  }

  normalizeFecha(valor) {
    if (valor === null || valor === undefined || valor === '') {
      return null;
    }

    if (valor instanceof Date) {
      return Number.isNaN(valor.getTime()) ? NaN : valor;
    }

    if (typeof valor === 'number') {
      const parsedExcelDate = DataSanitizers.cleanDate(valor);
      if (!parsedExcelDate || Number.isNaN(parsedExcelDate.getTime())) {
        return NaN;
      }
      return parsedExcelDate;
    }

    let raw = valor.toString().trim();
    if (!raw) return null;

    raw = raw
      .replace(/\\\\/g, '/')
      .replace(/\s+/g, ' ')
      .trim();

    const normalized = this.removeDiacritics(raw).toUpperCase();

    const monthMap = {
      ENERO: 1,
      FEBRERO: 2,
      MARZO: 3,
      ABRIL: 4,
      MAYO: 5,
      JUNIO: 6,
      JULIO: 7,
      AGOSTO: 8,
      SEPTIEMBRE: 9,
      SETIEMBRE: 9,
      OCTUBRE: 10,
      NOVIEMBRE: 11,
      DICIEMBRE: 12
    };

    // Ej: 29 de abril de 1986 / 29 abril 1986
    const textDate = normalized.match(/^(\d{1,2})\s*(?:DE\s+)?([A-Z]+)\s*(?:DE\s+|DEL\s+)?(\d{4})$/);
    if (textDate) {
      const day = parseInt(textDate[1], 10);
      const month = monthMap[textDate[2]];
      const year = parseInt(textDate[3], 10);
      if (month) {
        return this.buildValidDate(day, month, year);
      }
    }

    // Ej: 24/03/1992 o 24-03-1992
    const dmy = normalized.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
    if (dmy) {
      const day = parseInt(dmy[1], 10);
      const month = parseInt(dmy[2], 10);
      let year = parseInt(dmy[3], 10);
      if (year < 100) year += 2000;
      return this.buildValidDate(day, month, year);
    }

    // Ej: 24/011992, 20/112000, 6/101983
    const dmYYYY = normalized.match(/^(\d{1,2})[\/-](\d{1,2})(\d{4})$/);
    if (dmYYYY) {
      const day = parseInt(dmYYYY[1], 10);
      const month = parseInt(dmYYYY[2], 10);
      const year = parseInt(dmYYYY[3], 10);
      return this.buildValidDate(day, month, year);
    }

    // Fallback al parser nativo por si ya viene en formato estándar
    const fallback = DataSanitizers.cleanDate(raw);
    if (fallback && !Number.isNaN(fallback.getTime())) {
      return fallback;
    }

    return NaN;
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

    // Normalizar numeroFila: 4,1 → 4.1, mantener como String
    if (fieldName === 'numeroFila') {
      return String(value).trim().replace(',', '.');
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
   * ÚNICA VALIDACIÓN: numeroDocumento requerido y único en el archivo
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

    // ÚNICA VALIDACIÓN REQUERIDA: numeroDocumento debe existir
    if (!doc.numeroDocumento || doc.numeroDocumento === null || doc.numeroDocumento === '') {
      result.valid = false;
      result.errors.push({
        type: 'REQUIRED_FIELD',
        field: 'numeroDocumento',
        message: 'Campo requerido "DOCUMENTO DE IDENTIDAD" está vacío'
      });
      return result;
    }

    // Normalizar números antes de insertar en Mongo
    const numericFields = ['ingresosFamiliares', 'valorMejoramiento', 'edad'];
    for (const field of numericFields) {
      if (doc[field] === null || doc[field] === undefined || doc[field] === '') {
        continue;
      }

      const valorOriginal = doc[field];
      const valorConvertido = this.limpiarNumeroFlexible(valorOriginal);

      if (Number.isNaN(valorConvertido)) {
        result.valid = false;
        result.errors.push({
          type: 'INVALID_NUMBER',
          field,
          value: valorOriginal,
          message: 'No se pudo convertir a número'
        });
      } else {
        doc[field] = valorConvertido;
      }
    }

    // Normalizar fecha antes de insertar en Mongo
    if (doc.fechaNacimiento !== null && doc.fechaNacimiento !== undefined && doc.fechaNacimiento !== '') {
      const valorOriginalFecha = doc.fechaNacimiento;
      const fechaNormalizada = this.normalizeFecha(valorOriginalFecha);

      if (Number.isNaN(fechaNormalizada)) {
        result.valid = false;
        result.errors.push({
          type: 'INVALID_DATE',
          field: 'fechaNacimiento',
          value: valorOriginalFecha,
          message: 'No se pudo normalizar la fecha antes de guardar'
        });
      } else {
        doc.fechaNacimiento = fechaNormalizada;
      }
    }

    // Validar unicidad dentro del archivo (evitar duplicados en el Excel)
    const key = `numeroDocumento:${doc.numeroDocumento}`;
    if (this.seenValues.has(key)) {
      result.valid = false;
      result.errors.push({
        type: 'DUPLICATE_VALUE',
        field: 'numeroDocumento',
        message: `Documento "${doc.numeroDocumento}" está duplicado en el archivo`,
        previousOccurrence: this.seenValues.get(key)
      });
    } else {
      this.seenValues.set(key, { sheet: sheetName, row: rowNumber });
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
