/**
 * Funciones de limpieza y normalización de datos
 * Limpia datos sucios del Excel antes de validar
 */

class DataSanitizers {
  /**
   * Limpiar email
   * - Agrega el punto faltante en dominios comunes
   * - Convierte valores inválidos (NA, NO TIENE) a null
   * - Normaliza formato
   */
  static cleanEmail(value) {
    if (!value) return null;
    
    const str = value.toString().trim();
    
    // Valores que significan "sin email"
    const invalidEmails = ['N/A', 'NA', 'N.A', 'NO TIENE', 'SIN EMAIL', 'NO', '-', ''];
    if (invalidEmails.includes(str.toUpperCase())) {
      return null;
    }
    
    // Convertir a minúsculas
    let cleaned = str.toLowerCase();
    
    // Corregir dominios comunes sin punto
    const domainFixes = {
      '@gmailcom': '@gmail.com',
      '@hotmailcom': '@hotmail.com',
      '@outlookcom': '@outlook.com',
      '@yahoocom': '@yahoo.com',
      '@live com': '@live.com',
      '@hotmail com': '@hotmail.com',
      '@gmail com': '@gmail.com'
    };
    
    for (const [wrong, correct] of Object.entries(domainFixes)) {
      if (cleaned.includes(wrong)) {
        cleaned = cleaned.replace(wrong, correct);
      }
    }
    
    // Remover espacios
    cleaned = cleaned.replace(/\s+/g, '');
    
    // Validar formato básico
    if (!cleaned.includes('@') || !cleaned.includes('.')) {
      return null;
    }
    
    // Si tiene formato válido, retornar
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      return cleaned;
    }
    
    return null;
  }

  /**
   * Limpiar número/ingreso
   * - Remueve símbolos de moneda ($, pesos, etc.)
   * - Remueve espacios extras
   * - Convierte texto descriptivo a null o valores estimados
   * - Maneja separadores de miles
   */
  static cleanNumber(value) {
    if (value === null || value === undefined) return null;
    
    const str = value.toString().trim();
    
    // Valores vacíos o inválidos
    const invalidNumbers = [
      'N/A', 'NA', 'N.A', 'NO TIENE', 'SIN INGRESOS', 
      '-', '', 'NO', 'NINGUNO', 'NO TIENE TRABAJO',
      'MENOS DEL MINIMO', 'MENOS DEL MÍNIMO'
    ];
    
    if (invalidNumbers.includes(str.toUpperCase())) {
      return null;
    }
    
    // Detectar texto descriptivo de salarios
    const salarioMinimoRegex = /(\d+)\s*(salario|salarios)\s*(minimo|mínimo)/i;
    const match = str.match(salarioMinimoRegex);
    
    if (match) {
      const cantidad = parseInt(match[1]);
      const salarioMinimo = 1300000; // Ajusta según el año
      return cantidad * salarioMinimo;
    }
    
    // Remover símbolos de moneda y separadores
    let cleaned = str
      .replace(/[$]/g, '') // Remover $
      .replace(/\s+/g, '')  // Remover todos los espacios
      .replace(/[,]/g, '')  // Remover comas
      .replace(/[´']/g, ''); // Remover apóstrofes/comillas raras
    
    // Intentar parsear como número
    const parsed = parseFloat(cleaned);
    
    if (isNaN(parsed)) {
      return null;
    }
    
    return parsed;
  }

  /**
   * Limpiar string general
   * - Remueve espacios extras
   * - Normaliza valores vacíos a null
   */
  static cleanString(value) {
    if (!value) return null;
    
    const str = value.toString().trim();
    
    // Valores que significan "vacío"
    const emptyValues = ['N/A', 'NA', 'N.A', '-', '', 'NO', 'NINGUNO'];
    if (emptyValues.includes(str.toUpperCase())) {
      return null;
    }
    
    // Remover espacios múltiples
    return str.replace(/\s+/g, ' ').trim();
  }

  /**
   * Limpiar teléfono
   * - Remueve caracteres especiales
   * - Mantiene solo dígitos
   */
  static cleanPhone(value) {
    if (!value) return null;
    
    const str = value.toString().trim();
    
    const invalidPhones = ['N/A', 'NA', 'NO TIENE', '-', ''];
    if (invalidPhones.includes(str.toUpperCase())) {
      return null;
    }
    
    // Remover todo excepto dígitos y +
    const cleaned = str.replace(/[^\d+]/g, '');
    
    return cleaned || null;
  }

  /**
   * Normalizar booleano/Si/No
   */
  static cleanBoolean(value) {
    if (!value) return null;
    
    const str = value.toString().trim().toUpperCase();
    
    const yesValues = ['SI', 'SÍ', 'YES', 'Y', 'S', '1', 'TRUE'];
    const noValues = ['NO', 'N', '0', 'FALSE'];
    
    if (yesValues.includes(str)) return 'Sí';
    if (noValues.includes(str)) return 'No';
    
    return null;
  }

  /**
   * Limpiar fecha
   * - Normaliza diferentes formatos
   */
  static cleanDate(value) {
    if (!value) return null;
    
    // Excel dates son números seriales
    if (typeof value === 'number') {
      // Convertir serial de Excel a fecha
      const date = new Date((value - 25569) * 86400 * 1000);
      return date;
    }
    
    if (value instanceof Date) {
      return value;
    }
    
    const str = value.toString().trim();
    const invalidDates = ['N/A', 'NA', '-', ''];
    
    if (invalidDates.includes(str.toUpperCase())) {
      return null;
    }
    
    try {
      const date = new Date(str);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  /**
   * Aplicar limpieza según tipo de campo
   */
  static clean(value, type) {
    switch (type) {
      case 'email':
        return this.cleanEmail(value);
      case 'number':
        return this.cleanNumber(value);
      case 'phone':
        return this.cleanPhone(value);
      case 'boolean':
        return this.cleanBoolean(value);
      case 'date':
        return this.cleanDate(value);
      case 'string':
      default:
        return this.cleanString(value);
    }
  }
}

module.exports = DataSanitizers;
