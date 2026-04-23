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

// ========== HELPERS PARA PRESERVAR VALORES EXISTENTES ==========
const PLACEHOLDER_VALUES = new Set(['SI', 'SÍ', 'NO', 'N/A', 'NA', 'N.D.', 'X']);

function isEmptyValue(value) {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

function normalizeToken(value) {
  return String(value || '').trim().toUpperCase();
}

function looksLikeStoredPath(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim().toLowerCase();
  return (
    v.includes('uploads/') ||
    v.includes('http://') ||
    v.includes('https://') ||
    v.includes('s3://') ||
    v.includes('gs://')
  );
}

function shouldKeepExisting(field, incomingValue, existingValue) {
  const hasExisting = !isEmptyValue(existingValue);
  if (!hasExisting) return false;

  // Si Excel trae vacío/null, conserva lo que hay en Mongo
  if (isEmptyValue(incomingValue)) return true;

  // Si Excel trae un marcador (SI/NO/N.D.), conserva lo que hay en Mongo
  if (typeof incomingValue === 'string') {
    const token = normalizeToken(incomingValue);
    if (PLACEHOLDER_VALUES.has(token)) return true;
  }

  return false;
}

function buildSafeSet(existingDoc, incomingDoc) {
  const safeSet = {};
  for (const [field, incomingValue] of Object.entries(incomingDoc)) {
    const existingValue = existingDoc ? existingDoc[field] : undefined;
    if (shouldKeepExisting(field, incomingValue, existingValue)) {
      continue; // No incluir en $set, deja el valor existente
    }
    safeSet[field] = incomingValue;
  }
  return safeSet;
}

// ========== HELPERS PARA AGRUPACIÓN TITULAR/FAMILIARES ==========

function normalizeFilaRef(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().replace(',', '.');
}

function getGrupoFamiliarKey(dato) {
  const municipio = getMunicipioKey(dato);
  const fila = normalizeFilaRef(dato?.numeroFila);

  if (!fila) {
    return `${municipio}|DOC:${dato?.numeroDocumento || 'SIN_DOC'}`;
  }

  const parteEntera = fila.split('.')[0];
  return `${municipio}|${parteEntera}`;
}

function normalizeParentesco(value) {
  return String(value || '').trim().toUpperCase();
}

function isTitular(dato) {
  return normalizeParentesco(dato?.parentesco) === 'TITULAR';
}

function toDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildFamiliarFromRow(dato) {
  return {
    numeroFilaFamiliar: normalizeFilaRef(dato?.numeroFila) || null,
    parentescoFamiliar: dato?.parentesco || null,
    nombreFamiliar: dato?.nombreCompleto || [
      dato?.primerNombre,
      dato?.segundoNombre,
      dato?.primerApellido,
      dato?.segundoApellido
    ].filter(Boolean).join(' ') || null,
    tipoDocumentoFamiliar: dato?.tipoDocumento || null,
    numeroDocumentoFamiliar: dato?.numeroDocumento || null,
    fechaNacimientoFamiliar: toDateOrNull(dato?.fechaNacimiento),
    edadFamiliar: dato?.edad || null,
    generoFamiliar: dato?.genero || null
  };
}

function getMunicipioKey(dato) {
  return dato?._metadata?.sourceSheet || dato?.municipio || 'SIN_MUNICIPIO';
}

function ensureMunicipioStats(statsMap, municipio) {
  if (!statsMap[municipio]) {
    statsMap[municipio] = {
      municipio,
      totalFilasHoja: 0,
      totalValidosHoja: 0,
      erroresValidacionPrevia: 0,
      totalValidosParaInyeccion: 0,
      yaEnDB: 0,
      nuevosInsertados: 0,
      actualizados: 0,
      existentesConError: 0,
      nuevosConError: 0,
      erroresInyeccion: 0
    };
  }

  return statsMap[municipio];
}

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

    // ========== AGRUPACIÓN POR TITULAR/FAMILIARES ==========
    console.log(`\n⏳ Agrupando por titular y familiares...\n`);

    const gruposFamiliares = new Map();

    for (const dato of resultado.documents) {
      const key = getGrupoFamiliarKey(dato);
      if (!gruposFamiliares.has(key)) {
        gruposFamiliares.set(key, {
          titular: null,
          familiares: [],
          rows: []
        });
      }

      const grupo = gruposFamiliares.get(key);
      grupo.rows.push(dato);

      if (isTitular(dato)) {
        grupo.titular = dato;
      } else {
        grupo.familiares.push(dato);
      }
    }

    const documentosParaInyeccion = [];
    const erroresAgrupacion = [];

    for (const [key, grupo] of gruposFamiliares.entries()) {
      if (!grupo.titular) {
        const fallback = grupo.rows[0];
        erroresAgrupacion.push({
          municipio: getMunicipioKey(fallback),
          documento: fallback?.numeroDocumento || null,
          nombre: fallback?.nombreCompleto || null,
          error: `No se encontró TITULAR para grupo ${key}`
        });
        continue;
      }

      const titularDoc = { ...grupo.titular };
      titularDoc.familiares = grupo.familiares.map(buildFamiliarFromRow);

      // Si el titular no trae municipio pero un familiar sí, hereda
      if (!titularDoc.municipio) {
        const famConMunicipio = grupo.familiares.find(f => f?.municipio);
        if (famConMunicipio?.municipio) {
          titularDoc.municipio = famConMunicipio.municipio;
        }
      }

      documentosParaInyeccion.push(titularDoc);
    }

    console.log(`✅ ${gruposFamiliares.size} grupos familiares detectados`);
    console.log(`   - Titulares: ${documentosParaInyeccion.length}`);
    console.log(`   - Grupos sin titular: ${erroresAgrupacion.length}\n`);

    console.log(`⏳ Importando ${documentosParaInyeccion.length} titulares (con familiares agrupados)...\n`);

    let importados = 0;
    let errores = erroresAgrupacion.length;
    const erroresDetalle = [...erroresAgrupacion];
    const municipiosStats = {};
    const resumenInyeccion = {
      totalValidosParaInyeccion: documentosParaInyeccion.length,
      yaExistianEnMongo: 0,
      nuevosDetectados: 0,
      insertadosNuevos: 0,
      actualizadosExistentes: 0,
      rechazadosTotal: erroresAgrupacion.length,
      rechazadosExistentes: 0,
      rechazadosNuevos: erroresAgrupacion.length
    };

    if (resultado?.report?.sheetDetails) {
      for (const sheetDetail of resultado.report.sheetDetails) {
        const municipioStats = ensureMunicipioStats(municipiosStats, sheetDetail.name || 'SIN_MUNICIPIO');
        municipioStats.totalFilasHoja = sheetDetail.rowsProcessed || 0;
        municipioStats.totalValidosHoja = sheetDetail.validDocuments || 0;
        municipioStats.erroresValidacionPrevia = sheetDetail.invalidDocuments || 0;
      }
    }

    for (const dato of documentosParaInyeccion) {
      const municipio = getMunicipioKey(dato);
      const municipioStats = ensureMunicipioStats(municipiosStats, municipio);
      municipioStats.totalValidosParaInyeccion++;

      try {
        const postuladoFields = { ...dato };
        delete postuladoFields._metadata;

        // Obtener documento existente para comparar valores
        const existingDoc = await Postulado.findOne({
          numeroDocumento: dato.numeroDocumento
        }).lean();

        if (existingDoc) {
          municipioStats.yaEnDB++;
          resumenInyeccion.yaExistianEnMongo++;
        } else {
          resumenInyeccion.nuevosDetectados++;
        }

        // Construir set seguro: solo actualiza campos con valores reales
        // Preserva valores existentes cuando Excel trae null, vacío o SI/NO
        const safeFieldsToSet = buildSafeSet(existingDoc, postuladoFields);

        await Postulado.updateOne(
          { numeroDocumento: dato.numeroDocumento },
          {
            $set: {
              ...safeFieldsToSet,
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

        if (existingDoc) {
          municipioStats.actualizados++;
          resumenInyeccion.actualizadosExistentes++;
        } else {
          municipioStats.nuevosInsertados++;
          resumenInyeccion.insertadosNuevos++;
        }

        importados++;

        if (importados % 100 === 0) {
          process.stdout.write(`   Importados: ${importados}/${documentosParaInyeccion.length}\r`);
        }
      } catch (error) {
        errores++;
        resumenInyeccion.rechazadosTotal++;
        municipioStats.erroresInyeccion++;

        if (dato && dato.numeroDocumento) {
          const existingForError = await Postulado.findOne({ numeroDocumento: dato.numeroDocumento })
            .select('_id')
            .lean();
          if (existingForError) {
            municipioStats.existentesConError++;
            resumenInyeccion.rechazadosExistentes++;
          } else {
            municipioStats.nuevosConError++;
            resumenInyeccion.rechazadosNuevos++;
          }
        }

        erroresDetalle.push({
          municipio,
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
    console.log('\n📌 Resumen de inyección en MongoDB:');
    console.log(`   - Ya existían en Mongo: ${resumenInyeccion.yaExistianEnMongo}`);
    console.log(`   - Nuevos detectados: ${resumenInyeccion.nuevosDetectados}`);
    console.log(`   - Actualizados (existentes): ${resumenInyeccion.actualizadosExistentes}`);
    console.log(`   - Insertados nuevos: ${resumenInyeccion.insertadosNuevos}`);
    console.log(`   - Rechazados total: ${resumenInyeccion.rechazadosTotal}`);
    console.log(`   - Rechazados existentes: ${resumenInyeccion.rechazadosExistentes}`);
    console.log(`   - Rechazados nuevos: ${resumenInyeccion.rechazadosNuevos}`);

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

    const resumenMunicipios = Object.values(municipiosStats)
      .map((m) => {
        const exitosos = m.nuevosInsertados + m.actualizados;
        return {
          ...m,
          exitososInyeccion: exitosos,
          porcentajeExitoInyeccion:
            m.totalValidosParaInyeccion > 0
              ? ((exitosos / m.totalValidosParaInyeccion) * 100).toFixed(2) + '%'
              : '0.00%'
        };
      })
      .sort((a, b) => a.municipio.localeCompare(b.municipio));

    const reporte = {
      convocatoria: {
        _id: convocatoria._id.toString(),
        nombre: convocatoria.nombre
      },
      procesamiento: {
        archivoOrigen: path.basename(filePath),
        fechaProcesamiento: new Date(),
        totalDocumentos: documentosParaInyeccion.length,
        documentosImportados: importados,
        documentosConError: errores,
        porcentajeExito: documentosParaInyeccion.length > 0 ? ((importados / documentosParaInyeccion.length) * 100).toFixed(2) + '%' : '0.00%',
        gruposFamiliares: gruposFamiliares.size,
        filasOriginales: resultado.documents.length
      },
      resumenInyeccion,
      municipios: resumenMunicipios,
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
