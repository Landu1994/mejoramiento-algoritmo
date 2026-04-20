/**
 * Procesador principal de archivos Excel
 * Integra todos los RFs del sistema
 */

const XLSX = require('xlsx');
const fs = require('fs');
const SheetValidator = require('../validators/sheetValidator');
const JsonTransformer = require('../transformers/jsonTransformer');
const ProgressBar = require('../utils/progressBar');

class ExcelProcessor {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.validator = new SheetValidator(config, logger);
    this.transformer = new JsonTransformer(config, logger);
    this.progressBar = new ProgressBar();
    
    this.stats = {
      totalSheets: 0,
      processedSheets: 0,
      validSheets: 0,
      invalidSheets: 0,
      totalRows: 0,
      processedRows: 0,
      validDocuments: 0,
      invalidDocuments: 0,
      errors: []
    };
  }

  /**
   * Procesar archivo Excel completo
   * @param {string} filePath - Ruta al archivo Excel
   * @returns {Promise<Object>} - Resultado del procesamiento
   */
  async processFile(filePath) {
    this.logger.startTimer();
    this.logger.info(`Iniciando procesamiento de archivo: ${filePath}`);

    try {
      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        throw new Error(`Archivo no encontrado: ${filePath}`);
      }

      // Leer el archivo Excel
      this.logger.info('Leyendo archivo Excel...');
      const workbook = XLSX.readFile(filePath);

      // RF03 - Identificación de hojas del archivo
      this.stats.totalSheets = workbook.SheetNames.length;
      this.logger.info(`Archivo contiene ${this.stats.totalSheets} hoja(s)`);

      const allDocuments = [];
      const sheetResults = [];

      // Procesar cada hoja
      for (let i = 0; i < workbook.SheetNames.length; i++) {
        const sheetName = workbook.SheetNames[i];
        
        this.logger.info(`\nProcesando hoja ${i + 1}/${this.stats.totalSheets}: "${sheetName}"`);
        
        try {
          const result = await this.processSheet(workbook, sheetName);
          sheetResults.push(result);
          
          if (result.valid) {
            this.stats.validSheets++;
            allDocuments.push(...result.documents);
            this.stats.validDocuments += result.documents.length;
          } else {
            this.stats.invalidSheets++;
          }

          this.stats.processedSheets++;
          this.stats.processedRows += result.rowsProcessed;

          // RF06 - Liberar memoria después de cada hoja
          if (this.config.MEMORY_MANAGEMENT?.forceGC && global.gc) {
            global.gc();
          }

        } catch (error) {
          // RF11 - Continuidad del proceso: error en una hoja no detiene el proceso
          this.logger.error(`Error al procesar hoja "${sheetName}"`, {
            error: error.message,
            stack: error.stack
          });
          
          this.stats.invalidSheets++;
          this.stats.errors.push({
            sheet: sheetName,
            error: error.message
          });

          sheetResults.push({
            sheetName,
            valid: false,
            error: error.message
          });

          // Continuar con la siguiente hoja
          continue;
        }
      }

      const elapsed = this.logger.endTimer();

      // Generar reporte final
      const report = this.generateReport(sheetResults, allDocuments, elapsed);
      
      return {
        success: true,
        documents: allDocuments,
        report
      };

    } catch (error) {
      this.logger.error('Error fatal al procesar archivo', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        documents: [],
        report: null
      };
    } finally {
      this.logger.printSummary();
    }
  }

  /**
   * Procesar una hoja individual
   * @param {Object} workbook - Workbook de Excel
   * @param {string} sheetName - Nombre de la hoja
   * @returns {Promise<Object>} - Resultado del procesamiento de la hoja
   */
  async processSheet(workbook, sheetName) {
    const sheet = workbook.Sheets[sheetName];
    
    // Convertir hoja a array de arrays
    const rawData = XLSX.utils.sheet_to_json(sheet, { 
      header: 1,
      defval: null,
      blankrows: false
    });

    // RF04 - Validación de estructura por hoja
    const validation = this.validator.validateSheet(rawData, sheetName);
    
    if (!validation.valid) {
      // Reportar errores pero continuar con otras hojas
      return {
        sheetName,
        valid: false,
        validationErrors: validation.errors,
        documents: [],
        rowsProcessed: 0
      };
    }

    // Obtener mapeo de columnas
    const columnMapping = this.validator.getColumnMapping(validation.headers);

    // Obtener filas de datos (después de encabezados)
    const dataRows = rawData.slice(this.config.HEADER_ROW + 1);
    
    // RF05 - Conteo de filas de datos
    const totalRows = dataRows.length;
    if (this.config.COUNT_ROWS) {
      this.logger.info(`Hoja "${sheetName}" contiene ${totalRows} filas de datos`);
    }

    // RF10 - Estimación de rendimiento: Ajustar tamaño de lote dinámicamente
    const batchSize = this.calculateBatchSize(totalRows);
    this.logger.info(`Procesando en lotes de ${batchSize} registros`);

    // Procesar por lotes
    const allDocuments = [];
    const allErrors = [];

    // RF09 - Iniciar indicador de progreso
    this.progressBar.start(totalRows, sheetName);

    for (let i = 0; i < dataRows.length; i += batchSize) {
      const batch = dataRows.slice(i, i + batchSize);
      
      // RF07 - Transformación a estructura JSON
      const batchResult = this.transformer.transformBatch(
        batch,
        columnMapping,
        sheetName,
        this.config.HEADER_ROW + 1 + i
      );

      allDocuments.push(...batchResult.documents);
      allErrors.push(...batchResult.errors);

      // RF09 - Actualizar progreso
      this.progressBar.update(Math.min(i + batchSize, totalRows));

      // RF06 - Liberar memoria después de cada lote
      if (this.config.MEMORY_MANAGEMENT?.forceGC && global.gc) {
        global.gc();
      }

      // Pequeña pausa para no saturar el CPU
      await this.sleep(1);
    }

    this.progressBar.stop();

    // Registrar errores de validación (RF08)
    if (allErrors.length > 0) {
      this.logger.warn(`Se encontraron ${allErrors.length} registros con errores en "${sheetName}"`);
      this.stats.invalidDocuments += allErrors.length;
    }

    return {
      sheetName,
      valid: true,
      documents: allDocuments,
      errors: allErrors,
      rowsProcessed: totalRows,
      validDocuments: allDocuments.length,
      invalidDocuments: allErrors.length
    };
  }

  /**
   * RF10 - Calcular tamaño de lote óptimo según volumen de datos
   * @param {number} totalRows - Total de filas a procesar
   * @returns {number} - Tamaño de lote recomendado
   */
  calculateBatchSize(totalRows) {
    if (!this.config.DYNAMIC_BATCH_SIZING) {
      return this.config.BATCH_SIZE;
    }

    const thresholds = this.config.BATCH_SIZE_THRESHOLDS;

    if (totalRows <= thresholds.small.maxRows) {
      return thresholds.small.batchSize;
    } else if (totalRows <= thresholds.medium.maxRows) {
      return thresholds.medium.batchSize;
    } else {
      return thresholds.large.batchSize;
    }
  }

  /**
   * Generar reporte final del procesamiento
   * @param {Array} sheetResults - Resultados por hoja
   * @param {Array} documents - Documentos procesados
   * @param {number} elapsed - Tiempo transcurrido
   * @returns {Object} - Reporte completo
   */
  generateReport(sheetResults, documents, elapsed) {
    const report = {
      summary: {
        totalSheets: this.stats.totalSheets,
        processedSheets: this.stats.processedSheets,
        validSheets: this.stats.validSheets,
        invalidSheets: this.stats.invalidSheets,
        totalRowsProcessed: this.stats.processedRows,
        validDocuments: this.stats.validDocuments,
        invalidDocuments: this.stats.invalidDocuments,
        successRate: ((this.stats.validDocuments / this.stats.processedRows) * 100).toFixed(2) + '%',
        executionTime: `${(elapsed / 1000).toFixed(2)}s`,
        recordsPerSecond: (this.stats.processedRows / (elapsed / 1000)).toFixed(2)
      },
      sheetDetails: sheetResults.map(result => ({
        name: result.sheetName,
        valid: result.valid,
        rowsProcessed: result.rowsProcessed || 0,
        validDocuments: result.validDocuments || 0,
        invalidDocuments: result.invalidDocuments || 0,
        errors: result.validationErrors || result.errors || []
      })),
      globalErrors: this.stats.errors
    };

    // Imprimir reporte en consola
    console.log('\n' + '='.repeat(80));
    console.log('REPORTE FINAL DE PROCESAMIENTO');
    console.log('='.repeat(80));
    console.log(`Total hojas: ${report.summary.totalSheets}`);
    console.log(`Hojas válidas: ${report.summary.validSheets}`);
    console.log(`Hojas inválidas: ${report.summary.invalidSheets}`);
    console.log(`Filas procesadas: ${report.summary.totalRowsProcessed}`);
    console.log(`Documentos válidos: ${report.summary.validDocuments}`);
    console.log(`Documentos inválidos: ${report.summary.invalidDocuments}`);
    console.log(`Tasa de éxito: ${report.summary.successRate}`);
    console.log(`Tiempo de ejecución: ${report.summary.executionTime}`);
    console.log(`Velocidad: ${report.summary.recordsPerSecond} registros/segundo`);
    console.log('='.repeat(80) + '\n');

    return report;
  }

  /**
   * Utilidad para pausas asíncronas
   * @param {number} ms - Milisegundos a esperar
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtener estadísticas del procesamiento
   * @returns {Object}
   */
  getStats() {
    return { ...this.stats };
  }
}

module.exports = ExcelProcessor;
