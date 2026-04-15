/**
 * Configuración para el procesamiento de archivos Excel
 * Implementa RF01 y RF02
 * 
 * NOTA: La configuración real está centralizada en src/constants/convo-mv-1.ts
 * Este archivo la importa y re-exporta para mantener compatibilidad con el resto del sistema.
 * 
 * Para que TypeScript funcione con require(), necesitas instalar: pnpm add -D typescript ts-node
 * O alternativamente, este archivo puede importar una versión compilada .js
 */

let excelConfig;

try {
  // Intentar cargar directamente el archivo TypeScript
  // Nota: Esto requiere ts-node o que el archivo esté pre-compilado
  excelConfig = require('../constants/convo-mv-1.ts');
} catch (error) {
  if (error.code === 'ERR_UNKNOWN_FILE_EXTENSION') {
    console.error('\n⚠️  Para usar archivos TypeScript con require(), instala ts-node:');
    console.error('   pnpm add -D typescript ts-node\n');
    console.error('   O compila el archivo .ts a .js primero.\n');
  }
  throw error;
}

module.exports = excelConfig;
