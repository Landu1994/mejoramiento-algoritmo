/**
 * Punto de entrada principal del sistema de procesamiento de Excel
 * Implementa todos los Requerimientos Funcionales (RF01-RF11)
 * Soporte para schemas flexibles con columnas en cualquier orden
 */

const ExcelProcessor = require('./processors/excelProcessor');
const Logger = require('./utils/logger');
const excelConfig = require('./config/excel.config');
const schemaLoader = require('./schemas/schema-loader');
const path = require('path');
const fs = require('fs');

/**
 * Funcion principal
 */
async function main() {
  // Inicial izar logger
  const logger = new Logger(excelConfig);
  
  console.log('\n' + '='.repeat(80));
  console.log('SISTEMA DE PROCESAMIENTO DE ARCHIVOS EXCEL');
  console.log('='.repeat(80) + '\n');

  try {
    // Parsear argumentos de linea de comandos
    const args = process.argv.slice(2);
    const filePath = args.find(arg => !arg.startsWith('--'));
    const schemaArg = args.find(arg => arg.startsWith('--schema='));
    const listSchemas = args.includes('--list-schemas');
    const showHelp = args.includes('--help') || args.includes('-h');

    // Comando: Listar schemas
    if (listSchemas) {
      console.log('Schemas disponibles:\n');
      const schemas = schemaLoader.listSchemas();
      schemas.forEach(schema => {
        console.log(`   ${schema.id}`);
        console.log(`      Nombre: ${schema.name}`);
        console.log(`      Descripcion: ${schema.description || 'N/A'}`);
        console.log(`      Version: ${schema.version || 'N/A'}`);
        console.log(`      Columnas: ${schema.columnsCount}`);
        console.log('');
      });
      process.exit(0);
    }

    // Comando: Ayuda
    if (showHelp) {
      console.log('Uso: node src/index.js <archivo.xlsx> [opciones]\n');
      console.log('Opciones:');
      console.log('  --schema=<id>        Usar un schema especifico');
      console.log('  --list-schemas       Listar schemas disponibles');
      console.log('  --help, -h           Mostrar esta ayuda\n');
      console.log('Ejemplos:');
      console.log('  node src/index.js ./data/archivo.xlsx');
      console.log('  node src/index.js ./data/archivo.xlsx --schema=antioquia-municipios-v1');
      console.log('  node src/index.js --list-schemas\n');
      process.exit(0);
    }

    if (!filePath) {
      console.error('Error: Debe proporcionar la ruta del archivo Excel');
      console.log('\nUso: node src/index.js <ruta-al-archivo.xlsx> [--schema=<id>]');
      console.log('Ayuda: node src/index.js --help\n');
      process.exit(1);
    }

    // Resolver ruta absoluta
    const absolutePath = path.resolve(filePath);

    // Verificar que el archivo existe
    if (!fs.existsSync(absolutePath)) {
      console.error(`Error: Archivo no encontrado: ${absolutePath}`);
      process.exit(1);
    }

    // Determinar que configuracion usar: schema o config legacy
    let config = excelConfig;
    let usingSchema = false;
    let activeSchema = null; // Mantener referencia al schema
    
    if (schemaArg) {
      const schemaId = schemaArg.split('=')[1];
      const schema = schemaLoader.getSchema(schemaId);
      
      if (!schema) {
        console.error(`Error: Schema '${schemaId}' no encontrado`);
        console.log('\nSchemas disponibles:');
        schemaLoader.listSchemas().forEach(s => console.log(`   - ${s.id}`));
        process.exit(1);
      }
      
      activeSchema = schema; // Guardar schema
      config = schemaLoader.convertToLegacyConfig(schema);
      usingSchema = true;
      
      console.log('USANDO SCHEMA:');
      console.log(`   - ID: ${schema.id}`);
      console.log(`   - Nombre: ${schema.name}`);
      console.log(`   - Version: ${schema.version}`);
      console.log(`   - Columnas: ${schema.columns.length}`);
      console.log(`   - Orden flexible: ${schema.headerConfig.flexibleOrder ? 'Si' : 'No'}`);
    } else {
      // Intentar cargar schema por defecto
      const defaultSchema = schemaLoader.getDefaultSchema();
      if (defaultSchema) {
        activeSchema = defaultSchema; // Guardar schema
        config = schemaLoader.convertToLegacyConfig(defaultSchema);
        usingSchema = true;
        
        console.log('USANDO SCHEMA POR DEFECTO:');
        console.log(`   - ID: ${defaultSchema.id}`);
        console.log(`   - Nombre: ${defaultSchema.name}`);
        console.log(`   - Columnas: ${defaultSchema.columns.length}`);
        console.log(`   - Orden flexible: ${defaultSchema.headerConfig.flexibleOrder ? 'Si' : 'No'}`);
      } else {
        console.log('CONFIGURACION LEGACY:');
        console.log(`   - Fila de encabezados: ${config.HEADER_ROW}`);
        console.log(`   - Columnas esperadas: ${config.EXPECTED_COLUMNS?.length || 0}`);
      }
    }
    
    console.log(`   - Tamano de lote: ${config.BATCH_SIZE}`);
    console.log(`   - Ajuste dinamico: ${config.DYNAMIC_BATCH_SIZING ? 'Si' : 'No'}`);
    console.log(`   - Conteo de filas: ${config.COUNT_ROWS !== false ? 'Si' : 'No'}`);
    console.log('');

    // Crear procesador con schema si está disponible
    const processor = new ExcelProcessor(config, logger, activeSchema);

    // Procesar archivo
    console.log(`Archivo: ${absolutePath}\n`);
    const result = await processor.processFile(absolutePath);

    if (result.success) {
      console.log('\nProcesamiento completado exitosamente\n');

      // Guardar documentos en archivo JSON
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

      // Guardar reporte
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

// Ejecutar funcion principal
main().catch(error => {
  console.error('Error no controlado:', error);
  process.exit(1);
});
