/**
 * Generador de archivo Excel de prueba
 * Crea un archivo con datos de municipios de Antioquia
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Municipios de Antioquia por subregión (muestra)
const MUNICIPIOS = {
  'Valle de Aburrá': ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Sabaneta', 'La Estrella'],
  'Oriente': ['Rionegro', 'El Retiro', 'Marinilla', 'Guarne', 'San Vicente'],
  'Suroeste': ['Andes', 'Ciudad Bolívar', 'Concordia', 'Fredonia'],
  'Norte': ['Yarumal', 'Santa Rosa de Osos', 'Don Matías', 'Entrerríos'],
  'Urabá': ['Apartadó', 'Turbo', 'Carepa', 'Chigorodó'],
  'Occidente': ['Santa Fe de Antioquia', 'Sopetrán', 'San Jerónimo'],
  'Nordeste': ['Segovia', 'Remedios', 'Yolombó'],
  'Magdalena Medio': ['Puerto Berrío', 'Puerto Nare', 'Maceo'],
  'Bajo Cauca': ['Caucasia', 'Nechí', 'Zaragoza']
};

const NOMBRES_1 = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Pedro', 'Sofia', 'Jorge', 'Camila'];
const NOMBRES_2 = ['José', 'Isabel', 'Antonio', 'Fernanda', 'Manuel', 'Victoria', 'Andrés', 'Valentina'];
const APELLIDOS_1 = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez'];
const APELLIDOS_2 = ['Gómez', 'Díaz', 'Torres', 'Vargas', 'Ruiz', 'Castro', 'Ortiz', 'Morales'];
const PARENTESCOS = ['Jefe de hogar', 'Cónyuge', 'Hijo(a)', 'Padre/Madre', 'Hermano(a)', 'Otro'];
const TIPOS_DOCUMENTO = ['CC', 'TI', 'RC', 'CE'];
const GENEROS = ['Masculino', 'Femenino'];
const ENFOQUES = ['Ninguno', 'Víctima', 'Desplazado', 'Indígena', 'Afrocolombiano', 'LGBTIQ+', 'Discapacidad'];
const ZONAS = ['Urbana', 'Rural'];
const TIPOLOGIAS = ['Mejoramiento de vivienda', 'Construcción nueva', 'Ampliación', 'Saneamiento básico'];
const VIABILIDADES = ['Viable', 'No viable', 'En revisión', 'Pendiente'];

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomDate(startYear, endYear) {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateTestData(municipio, subregion, numRows) {
  const data = [];
  
  // Encabezados
  data.push([
    'SUBREGIÓN',
    'MUNICIPIO',
    '#',
    'PARENTESCO',
    'NOMBRE 1',
    'NOMBRE 2',
    'APELLIDO 1',
    'APELLIDO 2',
    'NOMBRE COMPLETO',
    'TIPO DE DOCUMENTO',
    'DOCUMENTO DE IDENTIDAD',
    'FECHA DE NACIMIENTO',
    'EDAD',
    'GENERO',
    'NUMERO DE CONTACTO',
    'CORREO ELECTRONICO',
    'INGRESOS FAMILIARES',
    'ENFOQUE DIFERENCIAL',
    'ZONA INTERVENCION',
    'DIRECCION O PUNTO DE REFERENCIA',
    'TIPOLOGIA DE INTERVENCIÓN',
    'SUBSIDIOS OTORGADOS EXTERNOS',
    'SUBSIDIOS OTORGADOS VIVA',
    'MATRICULA CATASTRAL',
    'VIABILIDAD',
    'VALOR DE MEJORAMIENTO',
    'DOCUMENTO POSTULADO',
    'DOCUMENTOS GRUPO FAMILIAR',
    'TTO DE DATOS',
    'SOPORTE TENENCIA',
    'SERVICIOS PÚBLICOS',
    'ZONA DE RIESGO',
    'FICHA SISBEN',
    'FCSDT',
    'REGISTRO FOTOGRÁFICO',
    'OBSRVACIONES CRUCE VUR',
    'OBSERVACIONES',
    'VIABILIDAD ETAPA 1'
  ]);

  // Generar filas de datos
  for (let i = 1; i <= numRows; i++) {
    const nombre1 = randomElement(NOMBRES_1);
    const nombre2 = randomElement(NOMBRES_2);
    const apellido1 = randomElement(APELLIDOS_1);
    const apellido2 = randomElement(APELLIDOS_2);
    const nombreCompleto = `${nombre1} ${nombre2} ${apellido1} ${apellido2}`;
    const tipoDoc = randomElement(TIPOS_DOCUMENTO);
    const documento = randomInt(10000000, 99999999).toString();
    const fechaNac = generateRandomDate(1950, 2010);
    const edad = 2024 - fechaNac.getFullYear();
    const genero = randomElement(GENEROS);
    const telefono = `300${randomInt(1000000, 9999999)}`;
    const email = Math.random() > 0.3 ? `${nombre1.toLowerCase()}${i}@ejemplo.com` : '';
    const ingresos = randomInt(500000, 5000000);
    const enfoque = randomElement(ENFOQUES);
    const zona = randomElement(ZONAS);
    const direccion = `Calle ${randomInt(1, 100)} # ${randomInt(1, 50)}-${randomInt(1, 99)}`;
    const tipologia = randomElement(TIPOLOGIAS);
    const subsidioExt = Math.random() > 0.5 ? 'Sí' : 'No';
    const subsidioViva = Math.random() > 0.5 ? 'Sí' : 'No';
    const matricula = `${randomInt(10, 99)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`;
    const viabilidad = randomElement(VIABILIDADES);
    const valorMejor = randomInt(5000000, 30000000);
    const docPostulado = Math.random() > 0.2 ? 'Sí' : 'No';
    const docFamiliar = Math.random() > 0.2 ? 'Sí' : 'No';
    const ttoDatos = Math.random() > 0.1 ? 'Sí' : 'No';
    const soporteTen = Math.random() > 0.3 ? 'Sí' : 'No';
    const servicios = 'Agua, Luz, Gas';
    const zonaRiesgo = Math.random() > 0.7 ? 'Sí' : 'No';
    const sisben = randomElement(['A1', 'A2', 'A3', 'B1', 'B2', 'C1']);
    const fcsdt = Math.random() > 0.5 ? 'Sí' : 'No';
    const regFoto = Math.random() > 0.2 ? 'Sí' : 'No';
    const obsVur = '';
    const obs = i % 10 === 0 ? 'Requiere seguimiento' : '';
    const viabilidadE1 = randomElement(VIABILIDADES);

    data.push([
      subregion,
      municipio,
      randomElement(PARENTESCOS),
      nombre1,
      nombre2,
      apellido1,
      apellido2,
      nombreCompleto,
      tipoDoc,
      documento,
      fechaNac,
      edad,
      genero,
      telefono,
      email,
      ingresos,
      enfoque,
      zona,
      direccion,
      tipologia,
      subsidioExt,
      subsidioViva,
      matricula,
      viabilidad,
      valorMejor,
      docPostulado,
      docFamiliar,
      ttoDatos,
      soporteTen,
      servicios,
      zonaRiesgo,
      sisben,
      fcsdt,
      regFoto,
      obsVur,
      obs,
      viabilidadE1
    ]);
  }

  return data;
}

function generateTestDataWithErrors(municipio, subregion, numRows) {
  const data = [];
  
  // Encabezados
  data.push([
    'SUBREGIÓN',
    'MUNICIPIO',
    'PARENTESCO',
    'NOMBRE 1',
    'NOMBRE 2',
    'APELLIDO 1',
    'APELLIDO 2',
    'NOMBRE COMPLETO',
    'TIPO DE DOCUMENTO',
    'DOCUMENTO DE IDENTIDAD',
    'FECHA DE NACIMIENTO',
    'EDAD',
    'GENERO',
    'NUMERO DE CONTACTO',
    'CORREO ELECTRONICO',
    'INGRESOS FAMILIARES',
    'ENFOQUE DIFERENCIAL',
    'ZONA INTERVENCION',
    'DIRECCION O PUNTO DE REFERENCIA',
    'TIPOLOGIA DE INTERVENCIÓN',
    'SUBSIDIOS OTORGADOS EXTERNOS (fecha entidad otorgante valor)',
    'SUBSIDIOS OTORGADOS VIVA (fecha entidad otorgante valor)',
    'MINISTERIO DE VIVIENDA CIUDAD Y TERRITORIO: MATRICULA CATASTRAL',
    'VIABILIDAD',
    'VALOR DE MEJORAMIENTO',
    'DOCUMENTO POSTULADO',
    'DOCUMENTOS GRUPO FAMILIAR',
    'TTO DE DATOS',
    'SOPORTE TENENCIA',
    'SERVICIOS PÚBLICOS',
    'ZONA DE RIESGO',
    'FICHA SISBEN',
    'FCSDT',
    'REGISTRO FOTOGRÁFICO',
    'OBSERVACIONES CRUCE VUR',
    'OBSERVACIONES',
    'VIABILIDAD ETAPA 1'
  ]);

  // Generar filas con algunos errores intencionados
  for (let i = 1; i <= numRows; i++) {
    const nombre1 = randomElement(NOMBRES_1);
    const nombre2 = randomElement(NOMBRES_2);
    const apellido1 = randomElement(APELLIDOS_1);
    const apellido2 = randomElement(APELLIDOS_2);
    
    let nombreCompleto = `${nombre1} ${nombre2} ${apellido1} ${apellido2}`;
    let documento = randomInt(10000000, 99999999).toString();
    let email = `${nombre1.toLowerCase()}${i}@ejemplo.com`;
    
    // Introducir errores
    if (i % 10 === 0) {
      // Email inválido
      email = 'email-sin-formato';
    } else if (i % 15 === 0) {
      // Nombre completo vacío (campo requerido)
      nombreCompleto = '';
    } else if (i % 20 === 0) {
      // Documento duplicado
      documento = '12345678';
    }

    data.push([
      subregion,
      municipio,
      randomElement(PARENTESCOS),
      nombre1,
      nombre2,
      apellido1,
      apellido2,
      nombreCompleto,
      randomElement(TIPOS_DOCUMENTO),
      documento,
      generateRandomDate(1950, 2010),
      randomInt(18, 80),
      randomElement(GENEROS),
      `300${randomInt(1000000, 9999999)}`,
      email,
      randomInt(500000, 5000000),
      randomElement(ENFOQUES),
      randomElement(ZONAS),
      `Calle ${randomInt(1, 100)} # ${randomInt(1, 50)}-${randomInt(1, 99)}`,
      randomElement(TIPOLOGIAS),
      randomElement(['Sí', 'No']),
      randomElement(['Sí', 'No']),
      `${randomInt(10, 99)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
      randomElement(VIABILIDADES),
      randomInt(5000000, 30000000),
      'Sí',
      'Sí',
      'Sí',
      'Sí',
      'Agua, Luz',
      'No',
      randomElement(['A1', 'A2', 'B1']),
      'Sí',
      'Sí',
      '',
      '',
      randomElement(VIABILIDADES)
    ]);
  }

  return data;
}

function generateInvalidSheet() {
  // Hoja con estructura incorrecta (columnas faltantes)
  const data = [];
  data.push(['SUBREGIÓN', 'MUNICIPIO', 'NOMBRE COMPLETO']); // Faltan muchas columnas
  
  for (let i = 1; i <= 10; i++) {
    data.push([
      'Valle de Aburrá',
      'Medellín',
      `Persona ${i}`
    ]);
  }

  return data;
}

function main() {
  console.log('Generando archivo Excel de prueba con datos de municipios de Antioquia...\n');

  const workbook = XLSX.utils.book_new();

  // Hoja 1: Medellín (Valle de Aburrá) - 50 registros válidos
  console.log('1. Creando hoja "Medellín" con 50 registros válidos...');
  const sheet1 = XLSX.utils.aoa_to_sheet(generateTestData('Medellín', 'Valle de Aburrá', 50));
  XLSX.utils.book_append_sheet(workbook, sheet1, 'Medellín');

  // Hoja 2: Rionegro (Oriente) - 30 registros con algunos errores
  console.log('2. Creando hoja "Rionegro" con 30 registros (con errores intencionados)...');
  const sheet2 = XLSX.utils.aoa_to_sheet(generateTestDataWithErrors('Rionegro', 'Oriente', 30));
  XLSX.utils.book_append_sheet(workbook, sheet2, 'Rionegro');

  // Hoja 3: Estructura inválida
  console.log('3. Creando hoja "Hoja_Invalida" con estructura incorrecta...');
  const sheet3 = XLSX.utils.aoa_to_sheet(generateInvalidSheet());
  XLSX.utils.book_append_sheet(workbook, sheet3, 'Hoja_Invalida');

  // Hoja 4: Apartadó (Urabá) - 100 registros para probar volumen
  console.log('4. Creando hoja "Apartadó" con 100 registros...');
  const sheet4 = XLSX.utils.aoa_to_sheet(generateTestData('Apartadó', 'Urabá', 100));
  XLSX.utils.book_append_sheet(workbook, sheet4, 'Apartadó');

  // Hoja 5: Yarumal (Norte) - 40 registros válidos
  console.log('5. Creando hoja "Yarumal" con 40 registros válidos...');
  const sheet5 = XLSX.utils.aoa_to_sheet(generateTestData('Yarumal', 'Norte', 40));
  XLSX.utils.book_append_sheet(workbook, sheet5, 'Yarumal');

  // Crear carpeta data si no existe
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Guardar archivo
  const outputPath = path.join(dataDir, 'municipios_antioquia.xlsx');
  XLSX.writeFile(workbook, outputPath);

  console.log('\n✅ Archivo generado exitosamente!');
  console.log(`📁 Ubicación: ${outputPath}`);
  console.log('\n📋 Resumen:');
  console.log('   - Hoja 1: "Medellín" (50 registros válidos)');
  console.log('   - Hoja 2: "Rionegro" (30 registros con errores)');
  console.log('   - Hoja 3: "Hoja_Invalida" (estructura incorrecta)');
  console.log('   - Hoja 4: "Apartadó" (100 registros)');
  console.log('   - Hoja 5: "Yarumal" (40 registros)');
  console.log('   - TOTAL: 220 registros de datos + 5 hojas');
  
  console.log('\n🚀 Para procesar el archivo, ejecuta:');
  console.log(`   node src/index.js ${outputPath}`);
  console.log('   o');
  console.log(`   pnpm start ${outputPath}\n`);
}

main();
