/**
 * Punto de entrada principal del sistema de procesamiento de Excel
 * Implementa los Requerimientos Funcionales (RF01-RF11)
 */

const ExcelProcessor = require('./processors/excelProcessor');
const Logger = require('./utils/logger');
const excelConfig = require('./config/excel.config');
const path = require('path');
const fs = require('fs');

/**
 * Funcion principal
 */
async function main() {
  const logger = new Logger(excelConfig);

  console.log('\n' + '='.repeat(80));
  console.log('SISTEMA DE PROCESAMIENTO DE ARCHIVOS EXCEL');
  console.log('='.repeat(80) + '\n');

  try {
    const args = process.argv.slice(2);
    const filePath = args.find(arg => !arg.startsWith('--'));
    const showHelp = args.includes('--help') || args.includes('-h');

    if (showHelp) {
      console.log('Uso: node src/index.js <archivo.xlsx>\n');
      console.log('Opciones:');
      console.log('  --help, -h           Mostrar esta ayuda\n');
      console.log('La estructura de columnas se define en src/config/excel.config.js\n');
      console.log('Ejemplos:');
      console.log('  node src/index.js ./data/archivo.xlsx\n');
      process.exit(0);
    }

    if (!filePath) {
      console.error('Error: Debe proporcionar la ruta del archivo Excel');
      console.log('\nUso: node src/index.js <ruta-al-archivo.xlsx>');
      console.log('Ayuda: node src/index.js --help\n');
      process.exit(1);
    }

    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      console.error(`Error: Archivo no encontrado: ${absolutePath}`);
      process.exit(1);
    }

    const config = excelConfig;

    console.log('CONFIGURACION:');
    console.log(`   - Fila de encabezados: ${config.HEADER_ROW}`);
    console.log(`   - Columnas esperadas: ${config.EXPECTED_COLUMNS?.length || 0}`);
    console.log(`   - Tamano de lote: ${config.BATCH_SIZE}`);
    console.log(`   - Ajuste dinamico: ${config.DYNAMIC_BATCH_SIZING ? 'Si' : 'No'}`);
    console.log(`   - Conteo de filas: ${config.COUNT_ROWS !== false ? 'Si' : 'No'}`);
    console.log('');

    const processor = new ExcelProcessor(config, logger);

    console.log(`Archivo: ${absolutePath}\n`);
    const result = await processor.processFile(absolutePath);

    if (result.success) {
      console.log('\nProcesamiento completado exitosamente\n');

      const outputPath = path.join(
        path.dirname(absolutePath),
        `${path.basename(absolutePath, path.extname(absolutePath))}_output.json`
      );

      fs.writeFileSync(
        outputPath,
        JSON.stringify(result.documents, null, 2),
        'utf-8'
      );

      console.log(`Documentos guardados en: ${outputPath}`);

      const reportPath = path.join(
        path.dirname(absolutePath),
        `${path.basename(absolutePath, path.extname(absolutePath))}_report.json`
      );

      fs.writeFileSync(
        reportPath,
        JSON.stringify(result.report, null, 2),
        'utf-8'
      );

      console.log(`Reporte guardado en: ${reportPath}\n`);
    } else {
      console.log('\nEl procesamiento finalizo con errores\n');
      console.error('Error:', result.error);
      process.exit(1);
    }
  } catch (error) {
    logger.error('Error fatal en el sistema', {
      error: error.message,
      stack: error.stack
    });

    console.error('\nError fatal:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error no controlado:', error);
  process.exit(1);
});
