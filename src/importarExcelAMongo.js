/**
 * Script para procesar Excel e importar directamente a MongoDB
 * Uso: node src/importarExcelAMongo.js <archivo.xlsx> [--convocatoria=<id>] [--nombre=<nombre>]
 */

const ExcelProcessor = require('./processors/excelProcessor');
const Logger = require('./utils/logger');
const excelConfig = require('./config/excel.config');
const { connect, disconnect } = require('./model/connection');
const Convocatoria = require('./model/Convocatoria');
const Postulado = require('./model/BeneficiarioMejoramiento');
const path = require('path');
const fs = require('fs');

async function main() {
  try {
    const args = process.argv.slice(2);
    const filePath = args.find(arg => !arg.startsWith('--'));
    const convocatoriaArg = args.find(arg => arg.startsWith('--convocatoria='));
    const nombreConvArg = args.find(arg => arg.startsWith('--nombre='));

    if (!filePath) {
      console.error('\n❌ Error: Debe indicar la ruta del archivo Excel\n');
      console.log('Uso: node src/importarExcelAMongo.js <archivo.xlsx> [opciones]\n');
      console.log('Opciones:');
      console.log('  --convocatoria=<id>      ID de convocatoria existente (opcional)');
      console.log('  --nombre=<nombre>        Nombre de convocatoria (busca existente o crea nueva)\n');
      console.log('La estructura de columnas se define en src/config/excel.config.js\n');
      console.log('Ejemplos:');
      console.log('  node src/importarExcelAMongo.js data/libro.xlsx --nombre="Convocatoria 2026-1"\n');
      console.log('  node src/importarExcelAMongo.js data/libro.xlsx --convocatoria=69dd28fb6fe8ed61007d62e7\n');
      process.exit(1);
    }

    console.log('\n' + '='.repeat(80));
    console.log('PROCESAMIENTO E IMPORTACIÓN DIRECTA A MONGODB');
    console.log('='.repeat(80) + '\n');

    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      console.error(`❌ Archivo no encontrado: ${absolutePath}`);
      process.exit(1);
    }

    console.log(`📄 Archivo: ${path.basename(filePath)}`);
    console.log('📋 Configuración: src/config/excel.config.js\n');

    console.log('⏳ Procesando archivo Excel...\n');
    const config = excelConfig;
    const logger = new Logger(config);
    const processor = new ExcelProcessor(config, logger);
    const resultado = await processor.processFile(absolutePath);

    console.log('📊 Resultado del procesamiento:');
    console.log(`   - Documentos válidos: ${resultado?.documents?.length || 0}`);
    console.log(`   - Éxito: ${resultado?.success ? 'Sí' : 'No'}\n`);

    if (!resultado || !resultado.success || !resultado.documents || resultado.documents.length === 0) {
      console.error('❌ No se pudieron procesar documentos válidos\n');
      process.exit(1);
    }

    console.log(`✅ Procesados ${resultado.documents.length} documentos válidos\n`);

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

    console.log('⏳ Conectando a MongoDB...');
    await connect();

    let convocatoria;
    let convocatoriaId = convocatoriaArg ? convocatoriaArg.split('=')[1] : null;

    if (convocatoriaId) {
      console.log(`\n🔍 Buscando convocatoria por ID: ${convocatoriaId}`);
      convocatoria = await Convocatoria.findById(convocatoriaId);

      if (!convocatoria) {
        console.error(`❌ Convocatoria ${convocatoriaId} no encontrada`);
        process.exit(1);
      }

      console.log(`✅ Convocatoria encontrada: ${convocatoria.nombre}`);
    } else if (nombreConvArg) {
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

    const convocatoriaData = {
      _id: convocatoria._id,
      nombre: convocatoria.nombre
    };

    console.log(`\n⏳ Importando ${resultado.documents.length} postulados...\n`);

    let importados = 0;
    let errores = 0;
    const erroresDetalle = [];

    for (const dato of resultado.documents) {
      try {
        const postuladoFields = { ...dato };
        delete postuladoFields._metadata;

        await Postulado.updateOne(
          { numeroDocumento: dato.numeroDocumento },
          {
            $set: {
              ...postuladoFields,
              convocatoria: convocatoriaData,
              estadoPostulacion: 'REGISTRADO',
              fechaPostulacion: new Date(),
              metadata: {
                archivoOrigen: path.basename(filePath),
                fechaImportacion: new Date(),
                ...(dato._metadata && {
                  hojaOrigen: dato._metadata.sourceSheet,
                  filaOrigen: dato._metadata.sourceRow
                })
              }
            }
          },
          {
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true
          }
        );

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

    const reportePath = path.join(
      path.dirname(absolutePath),
      `${path.basename(absolutePath, path.extname(absolutePath))}_reporte_importacion.json`
    );

    const reporte = {
      convocatoria: {
        _id: convocatoria._id.toString(),
        nombre: convocatoria.nombre
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
