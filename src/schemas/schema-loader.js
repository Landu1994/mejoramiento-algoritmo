/**
 * Cargador de schemas
 * Permite cargar y validar diferentes schemas de configuración
 */

const fs = require('fs');
const path = require('path');

class SchemaLoader {
  constructor() {
    this.schemas = new Map();
    this.loadAllSchemas();
  }

  /**
   * Cargar todos los schemas disponibles
   */
  loadAllSchemas() {
    const schemasDir = __dirname;
    const files = fs.readdirSync(schemasDir);

    files.forEach(file => {
      if (file.endsWith('.schema.js') && file !== 'schema-loader.js') {
        try {
          const schema = require(path.join(schemasDir, file));
          if (this.validateSchema(schema)) {
            this.schemas.set(schema.id, schema);
          }
        } catch (error) {
          console.error(`Error cargando schema ${file}:`, error.message);
        }
      }
    });
  }

  /**
   * Validar estructura del schema
   * @param {Object} schema - Schema a validar
   * @returns {boolean}
   */
  validateSchema(schema) {
    const requiredFields = ['id', 'name', 'columns', 'headerConfig'];
    
    for (const field of requiredFields) {
      if (!schema[field]) {
        console.error(`Schema inválido: falta campo '${field}'`);
        return false;
      }
    }

    if (!Array.isArray(schema.columns) || schema.columns.length === 0) {
      console.error('Schema inválido: columns debe ser un array no vacío');
      return false;
    }

    return true;
  }

  /**
   * Obtener un schema por ID
   * @param {string} schemaId - ID del schema
   * @returns {Object|null}
   */
  getSchema(schemaId) {
    return this.schemas.get(schemaId) || null;
  }

  /**
   * Obtener schema por defecto (el primero cargado)
   * @returns {Object|null}
   */
  getDefaultSchema() {
    const firstSchema = this.schemas.values().next().value;
    return firstSchema || null;
  }

  /**
   * Listar todos los schemas disponibles
   * @returns {Array}
   */
  listSchemas() {
    return Array.from(this.schemas.values()).map(schema => ({
      id: schema.id,
      name: schema.name,
      description: schema.description,
      version: schema.version,
      columnsCount: schema.columns.length
    }));
  }

  /**
   * Convertir schema a configuración legacy (para compatibilidad)
   * @param {Object} schema - Schema a convertir
   * @returns {Object}
   */
  convertToLegacyConfig(schema) {
    const config = {
      HEADER_ROW: schema.headerConfig.headerRow,
      EXPECTED_COLUMNS: schema.columns.map(col => col.name),
      COLUMN_MAPPING: {},
      BATCH_SIZE: schema.processing?.batchSize || 1000,
      DYNAMIC_BATCH_SIZING: schema.processing?.dynamicBatchSizing !== false,
      BATCH_SIZE_THRESHOLDS: schema.processing?.batchSizeThresholds || {
        small: { maxRows: 10000, batchSize: 1000 },
        medium: { maxRows: 50000, batchSize: 500 },
        large: { maxRows: Infinity, batchSize: 250 }
      },
      COUNT_ROWS: true,
      LOG_LEVEL: 'info',
      LOG_TO_FILE: true,
      LOG_FILE_PATH: './logs/excel-processing.log',
      VALIDATIONS: {
        required: [],
        uniqueFields: [],
        emailFields: [],
        dateFields: [],
        numericFields: []
      },
      MEMORY_MANAGEMENT: {
        forceGC: true,
        memoryCheckInterval: 100
      }
    };

    // Construir COLUMN_MAPPING
    schema.columns.forEach(col => {
      config.COLUMN_MAPPING[col.name] = col.jsonField;
    });

    // Construir VALIDATIONS
    schema.columns.forEach(col => {
      if (col.required) {
        config.VALIDATIONS.required.push(col.name);
      }
      if (col.unique) {
        config.VALIDATIONS.uniqueFields.push(col.name);
      }
      if (col.type === 'email') {
        config.VALIDATIONS.emailFields.push(col.name);
      }
      if (col.type === 'date') {
        config.VALIDATIONS.dateFields.push(col.name);
      }
      if (col.type === 'number') {
        config.VALIDATIONS.numericFields.push(col.name);
      }
    });

    return config;
  }

  /**
   * Encontrar columna por nombre o alias
   * @param {Object} schema - Schema a usar
   * @param {string} columnName - Nombre de la columna a buscar
   * @returns {Object|null}
   */
  findColumn(schema, columnName) {
    const normalized = columnName.trim();
    
    return schema.columns.find(col => {
      // Coincidencia exacta
      if (col.name === normalized) return true;
      
      // Coincidencia con aliases
      if (col.aliases && col.aliases.includes(normalized)) return true;
      
      // Si el schema permite ignorar mayúsculas
      if (schema.headerConfig.normalize?.ignoreCase) {
        if (col.name.toLowerCase() === normalized.toLowerCase()) return true;
        if (col.aliases) {
          return col.aliases.some(alias => 
            alias.toLowerCase() === normalized.toLowerCase()
          );
        }
      }
      
      return false;
    });
  }

  /**
   * Validar que un archivo tenga las columnas requeridas según el schema
   * @param {Object} schema - Schema a usar
   * @param {Array} headers - Encabezados del archivo
   * @returns {Object}
   */
  validateHeaders(schema, headers) {
    const result = {
      valid: true,
      missingRequired: [],
      unrecognized: [],
      mapping: new Map()
    };

    // Verificar columnas requeridas
    const requiredColumns = schema.columns.filter(col => col.required);
    requiredColumns.forEach(col => {
      const found = this.findColumn(schema, col.name) !== null;
      if (!found) {
        const foundInHeaders = headers.some(header => {
          const column = this.findColumn(schema, header);
          return column && column.name === col.name;
        });
        
        if (!foundInHeaders) {
          result.valid = false;
          result.missingRequired.push(col.name);
        }
      }
    });

    // Crear mapeo de posiciones
    headers.forEach((header, index) => {
      const column = this.findColumn(schema, header);
      if (column) {
        result.mapping.set(index, column);
      } else {
        result.unrecognized.push(header);
      }
    });

    return result;
  }
}

// Exportar instancia singleton
module.exports = new SchemaLoader();
