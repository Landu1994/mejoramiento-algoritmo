/**
 * Script para importar datos procesados a MongoDB
 * Lee el archivo JSON generado por el algoritmo y lo inserta en la base de datos
 */

const fs = require('fs');
const path = require('path');
const { connect, disconnect } = require('./connection');
const Beneficiario = require('./BeneficiarioMejoramiento');

/**
 * Importar datos desde archivo JSON
 */
async function importarDatos(archivoJSON, opciones = {}) {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('IMPORTACIÓN DE DATOS A MONGODB');
    console.log('='.repeat(80) + '\n');

    // Conectar a MongoDB
    await connect();

    // Leer archivo JSON
    console.log(`📄 Leyendo archivo: ${archivoJSON}`);
    const contenido = fs.readFileSync(archivoJSON, 'utf-8');
    const datos = JSON.parse(contenido);

    if (!Array.isArray(datos)) {
      throw new Error('El archivo JSON debe contener un array de documentos');
    }

    console.log(`   Total de registros: ${datos.length}\n`);

    // Opciones de importación
    const {
      limpiarAntes = false,      // Limpiar colección antes de importar
      actualizar = false,         // Actualizar si existe (upsert)
      lote = 500,                // Tamaño de lote para inserción
      validar = true             // Validar antes de insertar
    } = opciones;

    // Limpiar colección si se solicita
    if (limpiarAntes) {
      console.log('🗑️  Limpiando colección...');
      const resultado = await Beneficiario.deleteMany({});
      console.log(`   Eliminados: ${resultado.deletedCount} registros\n`);
    }

    // Estadísticas
    let insertados = 0;
    let actualizados = 0;
    let errores = 0;
    const erroresDetalle = [];

    // Procesar en lotes
    console.log('💾 Importando datos...\n');
    const totalLotes = Math.ceil(datos.length / lote);

    for (let i = 0; i < datos.length; i += lote) {
      const loteActual = Math.floor(i / lote) + 1;
      const loteDatos = datos.slice(i, i + lote);
      
      console.log(`   Procesando lote ${loteActual}/${totalLotes} (${loteDatos.length} registros)...`);

      // Procesar cada documento del lote
      for (const doc of loteDatos) {
        try {
          if (actualizar) {
            // Actualizar o insertar (upsert)
            const resultado = await Beneficiario.updateOne(
              { numeroDocumento: doc.numeroDocumento },
              { $set: doc },
              { upsert: true, runValidators: validar }
            );

            if (resultado.upsertedCount > 0) {
              insertados++;
            } else if (resultado.modifiedCount > 0) {
              actualizados++;
            }
          } else {
            // Solo insertar
            await Beneficiario.create(doc);
            insertados++;
          }
        } catch (error) {
          errores++;
          erroresDetalle.push({
            documento: doc.numeroDocumento,
            nombre: doc.nombreCompleto,
            error: error.message
          });

          // Si hay demasiados errores, detener
          if (errores > 100) {
            console.error('\n❌ Demasiados errores. Deteniendo importación.');
            break;
          }
        }
      }
    }

    // Resumen
    console.log('\n' + '='.repeat(80));
    console.log('RESUMEN DE IMPORTACIÓN');
    console.log('='.repeat(80));
    console.log(`✅ Insertados:   ${insertados}`);
    if (actualizar) {
      console.log(`🔄 Actualizados: ${actualizados}`);
    }
    console.log(`❌ Errores:      ${errores}`);
    console.log(`📊 Total:        ${insertados + actualizados + errores}`);
    console.log('='.repeat(80) + '\n');

    // Mostrar primeros errores si los hay
    if (erroresDetalle.length > 0) {
      console.log('⚠️  PRIMEROS ERRORES:');
      erroresDetalle.slice(0, 5).forEach((e, idx) => {
        console.log(`\n${idx + 1}. Documento: ${e.documento}`);
        console.log(`   Nombre: ${e.nombre}`);
        console.log(`   Error: ${e.error}`);
      });
      console.log('');

      // Guardar errores en archivo
      const archivoErrores = archivoJSON.replace('.json', '_errores.json');
      fs.writeFileSync(archivoErrores, JSON.stringify(erroresDetalle, null, 2));
      console.log(`💾 Errores guardados en: ${archivoErrores}\n`);
    }

    // Verificar total en base de datos
    const totalDB = await Beneficiario.countDocuments();
    console.log(`📊 Total de registros en base de datos: ${totalDB}\n`);

    return {
      success: errores === 0,
      insertados,
      actualizados,
      errores,
      erroresDetalle,
      totalDB
    };

  } catch (error) {
    console.error('\n❌ Error en importación:', error.message);
    throw error;
  } finally {
    await disconnect();
  }
}

/**
 * Uso desde línea de comandos
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log('\nUso: node importarDatos.js <archivo.json> [opciones]\n');
    console.log('Opciones:');
    console.log('  --limpiar          Limpiar colección antes de importar');
    console.log('  --actualizar       Actualizar registros existentes (upsert)');
    console.log('  --lote=<numero>    Tamaño de lote (default: 500)');
    console.log('  --no-validar       No validar datos antes de insertar\n');
    console.log('Ejemplos:');
    console.log('  node importarDatos.js ../data/libro_prueba_output.json');
    console.log('  node importarDatos.js ../data/datos.json --limpiar --actualizar');
    console.log('  node importarDatos.js ../data/datos.json --lote=1000\n');
    process.exit(0);
  }

  const archivoJSON = args.find(arg => !arg.startsWith('--'));
  
  if (!archivoJSON) {
    console.error('Error: Debe especificar un archivo JSON');
    process.exit(1);
  }

  const opciones = {
    limpiarAntes: args.includes('--limpiar'),
    actualizar: args.includes('--actualizar'),
    validar: !args.includes('--no-validar'),
    lote: parseInt(args.find(arg => arg.startsWith('--lote='))?.split('=')[1]) || 500
  };

  importarDatos(archivoJSON, opciones)
    .then(resultado => {
      if (resultado.success) {
        console.log('✅ Importación completada exitosamente\n');
        process.exit(0);
      } else {
        console.log('⚠️  Importación completada con errores\n');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { importarDatos };
