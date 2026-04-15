/**
 * Sistema de logging para auditoría y depuración
 * Implementa RF11 - Registrar logs de ejecución
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(config = {}) {
    this.logLevel = config.LOG_LEVEL || 'info';
    this.logToFile = config.LOG_TO_FILE || false;
    this.logFilePath = config.LOG_FILE_PATH || './logs/app.log';
    this.levels = { error: 0, warn: 1, info: 2, debug: 3 };
    
    if (this.logToFile) {
      this.ensureLogDirectory();
    }

    this.errors = [];
    this.warnings = [];
    this.startTime = null;
  }

  ensureLogDirectory() {
    const dir = path.dirname(this.logFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}`;
  }

  log(level, message, meta = {}) {
    if (this.levels[level] > this.levels[this.logLevel]) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, meta);

    // Consola con colores
    console.log(formattedMessage);

    // Archivo
    if (this.logToFile) {
      fs.appendFileSync(this.logFilePath, formattedMessage + '\n');
    }

    // Almacenar errores y warnings para reporte final
    if (level === 'error') {
      this.errors.push({ message, meta, timestamp: new Date() });
    } else if (level === 'warn') {
      this.warnings.push({ message, meta, timestamp: new Date() });
    }
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  startTimer() {
    this.startTime = Date.now();
    this.info('Proceso iniciado');
  }

  endTimer() {
    if (this.startTime) {
      const elapsed = Date.now() - this.startTime;
      const seconds = (elapsed / 1000).toFixed(2);
      this.info(`Proceso completado en ${seconds}s`);
      return elapsed;
    }
    return 0;
  }

  getStats() {
    return {
      errors: this.errors.length,
      warnings: this.warnings.length,
      errorDetails: this.errors,
      warningDetails: this.warnings
    };
  }

  printSummary() {
    const stats = this.getStats();
    console.log('\n' + '='.repeat(60));
    console.log('RESUMEN DE EJECUCIÓN');
    console.log('='.repeat(60));
    console.log(`Errores: ${stats.errors}`);
    console.log(`Advertencias: ${stats.warnings}`);
    
    if (stats.errors > 0) {
      console.log('\nDETALLE DE ERRORES:');
      stats.errorDetails.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err.message}`, err.meta);
      });
    }

    if (stats.warnings > 0) {
      console.log('\nDETALLE DE ADVERTENCIAS:');
      stats.warningDetails.forEach((warn, idx) => {
        console.log(`  ${idx + 1}. ${warn.message}`, warn.meta);
      });
    }
    console.log('='.repeat(60) + '\n');
  }
}

module.exports = Logger;
