/**
 * Barra de progreso para visualizar el avance del procesamiento
 * Implementa RF09 - Indicador de progreso
 */

const cliProgress = require('cli-progress');

class ProgressBar {
  constructor() {
    this.bar = null;
    this.startTime = null;
    this.currentSheet = '';
  }

  /**
   * Inicializar barra de progreso
   * @param {number} total - Total de elementos a procesar
   * @param {string} sheetName - Nombre de la hoja actual
   */
  start(total, sheetName = '') {
    this.currentSheet = sheetName;
    this.startTime = Date.now();
    
    this.bar = new cliProgress.SingleBar({
      format: `Procesando ${sheetName} | {bar} | {percentage}% | {value}/{total} registros | Tiempo: {duration_formatted} | ETA: {eta_formatted}`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    this.bar.start(total, 0);
  }

  /**
   * Actualizar progreso
   * @param {number} current - Número actual de elementos procesados
   */
  update(current) {
    if (this.bar) {
      this.bar.update(current);
    }
  }

  /**
   * Incrementar progreso en una unidad
   */
  increment() {
    if (this.bar) {
      this.bar.increment();
    }
  }

  /**
   * Finalizar barra de progreso
   */
  stop() {
    if (this.bar) {
      this.bar.stop();
    }
  }

  /**
   * Obtener tiempo transcurrido en segundos
   * @returns {number}
   */
  getElapsedTime() {
    if (this.startTime) {
      return (Date.now() - this.startTime) / 1000;
    }
    return 0;
  }

  /**
   * Calcular tiempo estimado restante
   * @param {number} current - Registros procesados
   * @param {number} total - Total de registros
   * @returns {number} - Segundos estimados restantes
   */
  getETA(current, total) {
    if (current === 0) return 0;
    const elapsed = this.getElapsedTime();
    const rate = current / elapsed;
    const remaining = total - current;
    return remaining / rate;
  }

  /**
   * Mostrar mensaje sin interrumpir la barra de progreso
   * @param {string} message 
   */
  log(message) {
    if (this.bar) {
      this.bar.stop();
      console.log(message);
      this.bar.start(this.bar.getTotal(), this.bar.value);
    } else {
      console.log(message);
    }
  }
}

module.exports = ProgressBar;
