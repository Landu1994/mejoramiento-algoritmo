/**
 * Script para procesar Excel e importar directamente a MongoDB
 * Uso: node src/importarExcelAMongo.js <archivo.xlsx> --schema=<schema-id> [--convocatoria=<id>]
 */

const ExcelProcessor = require('./processors/excelProcessor');
const Logger = require('./utils/logger');
const schemaLoader = require('./schemas/schema-loader');
const { connect, disconnect } = require('./model/connection');
const Convocatoria = require('./model/Convocatoria');
const Postulado = require('./model/BeneficiarioMejoramiento');
const path = require('path');
const fs = require('fs');

async function main() {
  try {
    // Parsear argumentos
    const args = process.argv.slice(2);
    const filePath = args.find(arg => !arg.startsWith('--'));
    const schemaArg = args.find(arg => arg.startsWith('--schema='));
    const convocatoriaArg = args.find(arg => arg.startsWith('--convocatoria='));
    const nombreConvArg = args.find(arg => arg.startsWith('--nombre='));
    
    if (!filePath || !schemaArg) {
      console.error('\n❌ Error: Argumentos insuficientes\n');
      console.log('Uso: node src/importarExcelAMongo.js <archivo.xlsx> --schema=<schema-id> [opciones]\n');
      console.log('Opciones:');
      console.log('  --schema=<id>            Schema a usar (requerido)');
      console.log('  --convocatoria=<id>      ID de convocatoria existente (opcional)');
      console.log('  --nombre=<nombre>        Nombre de convocatoria (busca existente o crea nueva)\n');
      console.log('Ejemplos:');
      console.log('  # Buscar convocatoria por nombre o crear si no existe');
      console.log('  node src/importarExcelAMongo.js data/libro.xlsx --schema=antioquia-municipios-v1 --nombre="Convocatoria 2026-1"\n');
      console.log('  # Importar a convocatoria existente por ID');
      console.log('  node src/importarExcelAMongo.js data/libro.xlsx --schema=antioquia-municipios-v1 --convocatoria=69dd28fb6fe8ed61007d62e7\n');
      process.exit(1);
    }

    console.log('\n' + '='.repeat(80));
    console.log('PROCESAMIENTO E IMPORTACIÓN DIRECTA A MONGODB');
    console.log('='.repeat(80) + '\n');

    // Verificar archivo
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      console.error(`❌ Archivo no encontrado: ${absolutePath}`);
      process.exit(1);
    }

    // Cargar schema
    const schemaId = schemaArg.split('=')[1];
    const schema = schemaLoader.getSchema(schemaId);
    if (!schema) {
      console.error(`❌ Schema '${schemaId}' no encontrado`);
      process.exit(1);
    }

    console.log(`📄 Archivo: ${path.basename(filePath)}`);
    console.log(`📋 Schema: ${schema.name}\n`);

    // PASO 1: Procesar Excel
    console.log('⏳ Procesando archivo Excel...\n');
    const config = schemaLoader.convertToLegacyConfig(schema);
    const logger = new Logger(config);
    const processor = new ExcelProcessor(config, logger, schema);
    const resultado = await processor.processFile(absolutePath);

    console.log('📊 Resultado del procesamiento:');
    console.log(`   - Documentos válidos: ${resultado?.documents?.length || 0}`);
    console.log(`   - Total procesados: ${resultado?.totalProcessed || 0}`);
    console.log(`   - Éxito: ${resultado?.success ? 'Sí' : 'No'}\n`);

    if (!resultado || !resultado.success || !resultado.documents || resultado.documents.length === 0) {
      console.error('❌ No se pudieron procesar documentos válidos\n');
      process.exit(1);
    }

    console.log(`✅ Procesados ${resultado.documents.length} documentos válidos\n`);

    // Guardar archivo JSON de salida
    const outputPath = path.join(
      path.dirname(absolutePath),
      `${path.basename(absolutePath, path.extname(absolutePath))}_output.json`
    );
    
    fs.writeFileSync(
      outputPath,
      JSON.stringify(resultado.documents, null, 2),
      'utf-8'
    );
    
    console.log(`💾 Archivo JSON guardado: ${path.basename(outputPath)}\n`);

    // PASO 2: Conectar a MongoDB
    console.log('⏳ Conectando a MongoDB...');
    await connect();

    // PASO 3: Obtener o crear convocatoria
    let convocatoria;
    let convocatoriaId = convocatoriaArg ? convocatoriaArg.split('=')[1] : null;

    if (convocatoriaId) {
      // Opción 1: Buscar por ID
      console.log(`\n🔍 Buscando convocatoria por ID: ${convocatoriaId}`);
      convocatoria = await Convocatoria.findById(convocatoriaId);
      
      if (!convocatoria) {
        console.error(`❌ Convocatoria ${convocatoriaId} no encontrada`);
        process.exit(1);
      }
      
      console.log(`✅ Convocatoria encontrada: ${convocatoria.nombre}`);
    } else if (nombreConvArg) {
      // Opción 2: Buscar por nombre o crear nueva
      const nombreConv = nombreConvArg.split('=')[1];
      
      console.log(`\n🔍 Buscando convocatoria por nombre: ${nombreConv}`);
      convocatoria = await Convocatoria.findOne({ nombre: nombreConv });
      
      if (convocatoria) {
        console.log(`✅ Convocatoria existente encontrada:`);
        console.log(`   - ID: ${convocatoria._id}`);
        console.log(`   - Estado: ${convocatoria.estado}`);
        console.log(`   - Fecha inicio: ${convocatoria.fechaInicio.toISOString().split('T')[0]}`);
        console.log(`   - Fecha cierre: ${convocatoria.fechaCierre.toISOString().split('T')[0]}`);
      } else {
        console.log(`📝 No existe, creando nueva convocatoria: ${nombreConv}`);
        
        convocatoria = new Convocatoria({
          nombre: nombreConv,
          fechaInicio: new Date(),
          fechaCierre: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          estado: 'ABIERTA',
          municipios: [...new Set(resultado.documents.map(d => d.municipio).filter(Boolean))],
          presupuestoTotal: 0
        });
        
        await convocatoria.save();
        console.log(`✅ Convocatoria creada: ${convocatoria._id}`);
      }
    } else {
      // Opción 3: Crear con nombre por defecto
      const nombreConv = 'VIVA MI CASA Mejoradas para ellas';
      
      console.log(`\n📝 Creando convocatoria con nombre por defecto: ${nombreConv}`);
      
      convocatoria = new Convocatoria({
        nombre: nombreConv,
        fechaInicio: new Date(),
        fechaCierre: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        estado: 'ABIERTA',
        municipios: [...new Set(resultado.documents.map(d => d.municipio).filter(Boolean))],
        presupuestoTotal: 0
      });
      
      await convocatoria.save();
      console.log(`✅ Convocatoria creada: ${convocatoria._id}`);
    }

    // PASO 4: Crear objeto embebido de convocatoria
    const convocatoriaData = {
      _id: convocatoria._id,
      nombre: convocatoria.nombre,
      fechaInicio: convocatoria.fechaInicio,
      fechaCierre: convocatoria.fechaCierre,
      estado: convocatoria.estado,
      municipios: convocatoria.municipios || [],
      presupuestoTotal: convocatoria.presupuestoTotal
    };

    // PASO 5: Importar postulados
    console.log(`\n⏳ Importando ${resultado.documents.length} postulados...\n`);
    
    let importados = 0;
    let errores = 0;
    const erroresDetalle = [];

    for (const dato of resultado.documents) {
      try {
        const postulado = new Postulado({
          ...dato,
          convocatoria: convocatoriaData,
          estadoPostulacion: 'REGISTRADO',
          fechaPostulacion: new Date(),
          metadata: {
            archivoOrigen: path.basename(filePath),
            fechaImportacion: new Date()
          }
        });
        
        await postulado.save();
        importados++;
        
        if (importados % 100 === 0) {
          process.stdout.write(`   Importados: ${importados}/${resultado.documents.length}\r`);
        }
      } catch (error) {
        errores++;
        erroresDetalle.push({
          documento: dato.numeroDocumento,
          nombre: dato.nombreCompleto,
          error: error.message
        });
      }
    }

    console.log('\n');
    console.log('='.repeat(80));
    console.log('✅ IMPORTACIÓN COMPLETADA');
    console.log('='.repeat(80));
    console.log(`   Convocatoria: ${convocatoria.nombre}`);
    console.log(`   ID: ${convocatoria._id}`);
    console.log(`   Importados: ${importados}`);
    console.log(`   Errores: ${errores}`);
    
    if (errores > 0 && errores <= 10) {
      console.log('\n❌ Errores encontrados:');
      erroresDetalle.forEach(e => {
        console.log(`   - ${e.nombre} (${e.documento}): ${e.error}`);
      });
    } else if (errores > 10) {
      console.log(`\n❌ Se encontraron ${errores} errores (mostrando primeros 10):`);
      erroresDetalle.slice(0, 10).forEach(e => {
        console.log(`   - ${e.nombre} (${e.documento}): ${e.error}`);
      });
    }
    
    // Guardar reporte de importación
    const reportePath = path.join(
      path.dirname(absolutePath),
      `${path.basename(absolutePath, path.extname(absolutePath))}_reporte_importacion.json`
    );
    
    const reporte = {
      convocatoria: {
        _id: convocatoria._id.toString(),
        nombre: convocatoria.nombre,
        fechaInicio: convocatoria.fechaInicio,
        fechaCierre: convocatoria.fechaCierre,
        estado: convocatoria.estado,
        municipios: convocatoria.municipios,
        presupuestoTotal: convocatoria.presupuestoTotal
      },
      procesamiento: {
        archivoOrigen: path.basename(filePath),
        fechaProcesamiento: new Date(),
        totalDocumentos: resultado.documents.length,
        documentosImportados: importados,
        documentosConError: errores,
        porcentajeExito: ((importados / resultado.documents.length) * 100).toFixed(2) + '%'
      },
      errores: erroresDetalle
    };
    
    fs.writeFileSync(
      reportePath,
      JSON.stringify(reporte, null, 2),
      'utf-8'
    );
    
    console.log(`\n💾 Reporte de importación guardado: ${path.basename(reportePath)}`);
    console.log(`💾 Datos procesados guardados: ${path.basename(outputPath)}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
