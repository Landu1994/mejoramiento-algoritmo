/**
 * Example: build Excel files with the same logical columns in different column order.
 * Headers must match names in src/config/excel.config.js (case-insensitive).
 */

const XLSX = require('xlsx');
const path = require('path');

console.log('🔄 Generando archivos de ejemplo con columnas en diferente orden...\n');

// Datos de ejemplo
const datosEjemplo = [
  {
    subregion: 'Valle de Aburrá',
    municipio: 'Medellín',
    nombreCompleto: 'Juan Pérez García',
    tipoDocumento: 'CC',
    numeroDocumento: '12345678',
    edad: 35,
    genero: 'Masculino',
    email: 'juan.perez@ejemplo.com',
    telefono: '3001234567'
  },
  {
    subregion: 'Oriente',
    municipio: 'Rionegro',
    nombreCompleto: 'María López Ramírez',
    tipoDocumento: 'CC',
    numeroDocumento: '87654321',
    edad: 28,
    genero: 'Femenino',
    email: 'maria.lopez@ejemplo.com',
    telefono: '3009876543'
  },
  {
    subregion: 'Urabá',
    municipio: 'Apartadó',
    nombreCompleto: 'Carlos Gómez Torres',
    tipoDocumento: 'CC',
    numeroDocumento: '11223344',
    edad: 42,
    genero: 'Masculino',
    email: 'carlos.gomez@ejemplo.com',
    telefono: '3005556677'
  }
];

// === ARCHIVO 1: Orden Original ===
const orden1 = [
  ['SUBREGIÓN', 'MUNICIPIO', 'NOMBRE COMPLETO', 'TIPO DE DOCUMENTO', 'DOCUMENTO DE IDENTIDAD', 'EDAD', 'GENERO', 'CORREO ELECTRONICO', 'NUMERO DE CONTACTO']
];

datosEjemplo.forEach(d => {
  orden1.push([
    d.subregion,
    d.municipio,
    d.nombreCompleto,
    d.tipoDocumento,
    d.numeroDocumento,
    d.edad,
    d.genero,
    d.email,
    d.telefono
  ]);
});

const wb1 = XLSX.utils.book_new();
const ws1 = XLSX.utils.aoa_to_sheet(orden1);
XLSX.utils.book_append_sheet(wb1, ws1, 'Datos');
const path1 = path.join(__dirname, '..', 'data', 'ejemplo_orden_1.xlsx');
XLSX.writeFile(wb1, path1);
console.log('✅ Archivo 1 generado (Orden Original):');
console.log('   Columnas: SUBREGIÓN → MUNICIPIO → NOMBRE COMPLETO → ...');
console.log(`   Ruta: ${path1}\n`);

// === ARCHIVO 2: Orden Invertido ===
const orden2 = [
  ['NUMERO DE CONTACTO', 'CORREO ELECTRONICO', 'GENERO', 'EDAD', 'DOCUMENTO DE IDENTIDAD', 'TIPO DE DOCUMENTO', 'NOMBRE COMPLETO', 'MUNICIPIO', 'SUBREGIÓN']
];

datosEjemplo.forEach(d => {
  orden2.push([
    d.telefono,
    d.email,
    d.genero,
    d.edad,
    d.numeroDocumento,
    d.tipoDocumento,
    d.nombreCompleto,
    d.municipio,
    d.subregion
  ]);
});

const wb2 = XLSX.utils.book_new();
const ws2 = XLSX.utils.aoa_to_sheet(orden2);
XLSX.utils.book_append_sheet(wb2, ws2, 'Datos');
const path2 = path.join(__dirname, '..', 'data', 'ejemplo_orden_2.xlsx');
XLSX.writeFile(wb2, path2);
console.log('✅ Archivo 2 generado (Orden Invertido):');
console.log('   Columnas: NUMERO DE CONTACTO → CORREO ELECTRONICO → GENERO → ...');
console.log(`   Ruta: ${path2}\n`);

// === ARCHIVO 3: Orden Aleatorio ===
const orden3 = [
  ['EDAD', 'NOMBRE COMPLETO', 'SUBREGIÓN', 'CORREO ELECTRONICO', 'TIPO DE DOCUMENTO', 'MUNICIPIO', 'DOCUMENTO DE IDENTIDAD', 'NUMERO DE CONTACTO', 'GENERO']
];

datosEjemplo.forEach(d => {
  orden3.push([
    d.edad,
    d.nombreCompleto,
    d.subregion,
    d.email,
    d.tipoDocumento,
    d.municipio,
    d.numeroDocumento,
    d.telefono,
    d.genero
  ]);
});

const wb3 = XLSX.utils.book_new();
const ws3 = XLSX.utils.aoa_to_sheet(orden3);
XLSX.utils.book_append_sheet(wb3, ws3, 'Datos');
const path3 = path.join(__dirname, '..', 'data', 'ejemplo_orden_3.xlsx');
XLSX.writeFile(wb3, path3);
console.log('✅ Archivo 3 generado (Orden Aleatorio):');
console.log('   Columnas: EDAD → NOMBRE COMPLETO → SUBREGIÓN → ...');
console.log(`   Ruta: ${path3}\n`);

console.log('=' .repeat(80));
console.log('🎉 ¡Todos los archivos generados exitosamente!\n');
console.log('💡 Para procesar cualquiera de estos archivos:');
console.log('   node src/index.js data/ejemplo_orden_1.xlsx');
console.log('   node src/index.js data/ejemplo_orden_2.xlsx');
console.log('   node src/index.js data/ejemplo_orden_3.xlsx\n');
console.log('✅ Los tres archivos deben producir el mismo JSON de salida (mismas filas, mismo mapeo).');
console.log('=' .repeat(80) + '\n');
