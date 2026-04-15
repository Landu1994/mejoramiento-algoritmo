/**
 * Ejemplos de uso de los modelos Convocatoria y Postulado
 * 
 * Este archivo muestra cÃ³mo crear convocatorias e importar postulados asociados
 */

const { connect, disconnect } = require('./connection');
const Convocatoria = require('./Convocatoria');
const Postulado = require('./Postulado');

/**
 * Ejemplo 1: Crear una convocatoria
 */
async function crearConvocatoria() {
  try {
    const convocatoria = new Convocatoria({
      nombre: 'Mejoramiento de Vivienda Antioquia 2026',
      fechaInicio: new Date('2026-04-01'),
      fechaCierre: new Date('2026-05-31'),
      estado: 'ABIERTA',
      municipios: ['MEDELLIN', 'ENVIGADO', 'ITAGUI', 'BELLO', 'SABANETA'],
      presupuestoTotal: 50000000000 // 50 mil millones
    });

    const resultado = await convocatoria.save();
    console.log('âœ… Convocatoria creada:', resultado._id);
    console.log(`   Nombre: ${resultado.nombre}`);
    console.log(`   Fechas: ${resultado.fechaInicio.toLocaleDateString()} - ${resultado.fechaCierre.toLocaleDateString()}`);
    console.log(`   Estado: ${resultado.estado}`);
    console.log(`   Municipios: ${resultado.municipios.join(', ')}`);
    return resultado;

  } catch (error) {
    console.error('âŒ Error creando convocatoria:', error.message);
    throw error;
  }
}

/**
 * Ejemplo 2: Asociar postulados a una convocatoria
 */
async function asociarPostuladosAConvocatoria(convocatoriaId, datosPostulados) {
  try {
    // Buscar la convocatoria para obtener sus datos
    const convocatoria = await Convocatoria.findById(convocatoriaId);
    if (!convocatoria) {
      throw new Error(`Convocatoria con ID ${convocatoriaId} no encontrada`);
    }
    
    // Crear objeto embebido con datos de la convocatoria
    const convocatoriaData = {
      _id: convocatoria._id,
      nombre: convocatoria.nombre,
      fechaInicio: convocatoria.fechaInicio,
      fechaCierre: convocatoria.fechaCierre,
      estado: convocatoria.estado,
      municipios: convocatoria.municipios || [],
      presupuestoTotal: convocatoria.presupuestoTotal
    };
    
    const resultados = [];
    
    for (const datos of datosPostulados) {
      // Agregar objeto de convocatoria embebido
      datos.convocatoria = convocatoriaData;
      datos.estadoPostulacion = 'REGISTRADO';
      datos.fechaPostulacion = new Date();
      
      const postulado = new Postulado(datos);
      const resultado = await postulado.save();
      resultados.push(resultado);
    }
    
    console.log(`âœ… ${resultados.length} postulados asociados a convocatoria: ${convocatoria.nombre}`);
    return resultados;

  } catch (error) {
    console.error('âŒ Error asociando postulados:', error.message);
    throw error;
  }
}

/**
 * Ejemplo 3: Importar desde archivo Excel y asociar a convocatoria
 */
async function importarPostuladosDesdeExcel(archivoJSON, convocatoriaId) {
  try {
    const fs = require('fs');
    
    // Buscar la convocatoria para obtener sus datos
    const convocatoria = await Convocatoria.findById(convocatoriaId);
    if (!convocatoria) {
      throw new Error(`Convocatoria con ID ${convocatoriaId} no encontrada`);
    }
    
    // Crear objeto embebido con datos de la convocatoria
    const convocatoriaData = {
      _id: convocatoria._id,
      nombre: convocatoria.nombre,
      fechaInicio: convocatoria.fechaInicio,
      fechaCierre: convocatoria.fechaCierre,
      estado: convocatoria.estado,
      municipios: convocatoria.municipios || [],
      presupuestoTotal: convocatoria.presupuestoTotal
    };
    
    // Leer archivo JSON generado por el procesador de Excel
    const datos = JSON.parse(fs.readFileSync(archivoJSON, 'utf-8'));
    
    console.log(`ðŸ“„ Importando ${datos.length} postulados a convocatoria: ${convocatoria.nombre}`);
    console.log(`   Estado: ${convocatoria.estado}`);
    
    let importados = 0;
    let errores = 0;
    
    for (const dato of datos) {
      try {
        const postulado = new Postulado({
          ...dato,
          convocatoria: convocatoriaData, // Objeto embebido completo
          estadoPostulacion: 'REGISTRADO',
          fechaPostulacion: new Date(),
          metadata: {
            archivoOrigen: archivoJSON,
            fechaImportacion: new Date()
          }
        });
        
        await postulado.save();
        importados++;
        
      } catch (error) {
        errores++;
        console.error(`Error en postulado ${dato.numeroDocumento}:`, error.message);
      }
    }
    
    console.log(`\nâœ… ImportaciÃ³n completada:`);
    console.log(`   Importados: ${importados}`);
    console.log(`   Errores: ${errores}`);
    
    return { importados, errores };

  } catch (error) {
    console.error('âŒ Error en importaciÃ³n:', error.message);
    throw error;
  }
}

/**
 * Ejemplo 4: Consultar postulados de una convocatoria
 */
async function consultarPostuladosConvocatoria(convocatoriaId) {
  try {
    // Buscar convocatoria
    const convocatoria = await Convocatoria.findById(convocatoriaId);
    if (!convocatoria) {
      throw new Error('Convocatoria no encontrada');
    }
    
    console.log(`\nðŸ“‹ Convocatoria: ${convocatoria.nombre}`);
    console.log(`   Estado: ${convocatoria.estado}`);
    console.log(`   Fechas: ${convocatoria.fechaInicio.toLocaleDateString()} - ${convocatoria.fechaCierre.toLocaleDateString()}`);
    
    // Contar postulados por estado
    const estadisticas = await Postulado.contarPorEstado(convocatoriaId);
    console.log('\nðŸ“Š EstadÃ­sticas de postulaciÃ³n:');
    estadisticas.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.total}`);
    });
    
    // Listar postulados
    const postulados = await Postulado.buscarPorConvocatoria(convocatoriaId);
    console.log(`\nðŸ‘¥ Total de postulados: ${postulados.length}`);
    
    return { convocatoria, postulados, estadisticas };

  } catch (error) {
    console.error('âŒ Error consultando postulados:', error.message);
    throw error;
  }
}

/**
 * Ejemplo 5: Aprobar/Rechazar postulados
 */
async function procesarPostulados(convocatoriaId) {
  try {
    // Buscar postulados en revisiÃ³n
    const postulados = await Postulado.buscarPorConvocatoria(convocatoriaId, {
      estado: 'EN_REVISION'
    });
    
    console.log(`\nðŸ” Procesando ${postulados.length} postulados en revisiÃ³n...`);
    
    for (const postulado of postulados) {
      // Ejemplo de lÃ³gica de aprobaciÃ³n
      if (postulado.edad >= 18 && postulado.edad <= 80) {
        await postulado.aprobar('Sistema', 'Cumple requisitos de edad');
        console.log(`âœ… Aprobado: ${postulado.nombreCompleto}`);
      } else {
        await postulado.rechazar('No cumple requisito de edad', 'Sistema');
        console.log(`âŒ Rechazado: ${postulado.nombreCompleto}`);
      }
    }

  } catch (error) {
    console.error('âŒ Error procesando postulados:', error.message);
    throw error;
  }
}

/**
 * FunciÃ³n principal de demostraciÃ³n
 */
async function main() {
  try {
    await connect();
    
    console.log('\n' + '='.repeat(80));
    console.log('EJEMPLOS DE USO - CONVOCATORIAS Y POSTULADOS');
    console.log('='.repeat(80) + '\n');
    
    // Descomentar los ejemplos que desees ejecutar:
    
    // 1. Crear convocatoria
    //const convocatoria = await crearConvocatoria();
    
    // 2. Importar postulados desde Excel
    //await importarPostuladosDesdeExcel(
      //'./data/libro_prueba_output.json',
      //convocatoria._id
    // );
    
    // 3. Consultar postulados
    //await consultarPostuladosConvocatoria(convocatoria._id);
    
    console.log('\nâœ… Operaciones completadas\n');

  } catch (error) {
    console.error('\nâŒ Error:', error);
  } finally {
    await disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

// Exportar funciones
module.exports = {
  crearConvocatoria,
  asociarPostuladosAConvocatoria,
  importarPostuladosDesdeExcel,
  consultarPostuladosConvocatoria,
  procesarPostulados
};

