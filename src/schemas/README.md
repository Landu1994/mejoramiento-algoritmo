# 📁 Schemas - Configuraciones de Estructuras Excel

Esta carpeta contiene las definiciones de schemas (estructuras) para diferentes tipos de archivos Excel que el sistema puede procesar.

## 🎯 ¿Qué es un Schema?

Un **schema** es una definición completa de la estructura esperada de un archivo Excel, que incluye:

- Nombres de columnas esperadas
- Aliases (nombres alternativos) para cada columna
- Tipos de datos
- Campos requeridos vs opcionales
- Validaciones personalizadas
- Mapeo a nombres JSON
- Configuración de procesamiento

## ✨ Ventajas de usar Schemas

1. **✅ Orden flexible** - Las columnas pueden estar en cualquier orden
2. **✅ Múltiples nombres** - Soporta aliases (ej: "EMAIL", "CORREO", "CORREO ELECTRONICO")
3. **✅ Reutilizable** - Un schema puede usarse para múltiples archivos
4. **✅ Versionado** - Permite mantener versiones de estructuras
5. **✅ Documentado** - Cada campo tiene descripción

## 📋 Schemas Disponibles

### 1. `antioquia-municipios.schema.js`

**ID**: `antioquia-municipios-v1`  
**Uso**: Datos de beneficiarios de mejoramiento de vivienda en Antioquia  
**Columnas**: 37 campos  
**Versión**: 1.0.0

## 🔧 Cómo Usar un Schema

### Opción 1: Usar schema por defecto (automático)

```bash
node src/index.js ./data/archivo.xlsx
```

### Opción 2: Especificar un schema

```bash
node src/index.js ./data/archivo.xlsx --schema=antioquia-municipios-v1
```

### Opción 3: Listar schemas disponibles

```bash
node src/index.js --list-schemas
```

## 📝 Crear un Nuevo Schema

Para crear un nuevo schema, crea un archivo con el formato: `nombre-descriptivo.schema.js`

### Estructura Base:

```javascript
const miSchema = {
  // ID único del schema
  id: 'mi-schema-v1',
  
  // Nombre descriptivo
  name: 'Mi Schema Descriptivo',
  
  // Descripción
  description: 'Descripción de qué tipo de datos procesa',
  
  // Versión
  version: '1.0.0',
  
  // Configuración de encabezados
  headerConfig: {
    headerRow: 0,              // Fila de encabezados (base 0)
    flexibleOrder: true,       // Permitir columnas en cualquier orden
    normalize: {
      ignoreCase: true,        // Ignorar mayús/minús
      trimSpaces: true         // Eliminar espacios
    }
  },
  
  // Definición de columnas
  columns: [
    {
      name: 'NOMBRE COLUMNA',           // Nombre exacto en Excel
      required: true,                   // ¿Es obligatoria?
      type: 'string',                   // Tipo: string, number, date, email
      aliases: ['NOMBRE_ALT', 'OTRO'],  // Nombres alternativos
      jsonField: 'nombreCampo',         // Nombre en JSON
      description: 'Descripción',       // Descripción del campo
      unique: false                     // ¿Debe ser único?
    },
    // ... más columnas
  ],
  
  // Configuración de procesamiento
  processing: {
    batchSize: 1000,
    dynamicBatchSizing: true
  }
};

module.exports = miSchema;
```

## 🔍 Ejemplos de Columnas

### Columna Simple

```javascript
{
  name: 'MUNICIPIO',
  required: true,
  type: 'string',
  jsonField: 'municipio',
  description: 'Nombre del municipio'
}
```

### Columna con Aliases

```javascript
{
  name: 'CORREO ELECTRONICO',
  required: false,
  type: 'email',
  aliases: ['EMAIL', 'CORREO', 'E-MAIL'],
  jsonField: 'email',
  description: 'Correo electrónico'
}
```

### Columna Única (No Duplicados)

```javascript
{
  name: 'DOCUMENTO DE IDENTIDAD',
  required: true,
  type: 'string',
  aliases: ['DOCUMENTO', 'CEDULA', 'DNI'],
  jsonField: 'numeroDocumento',
  description: 'Número de documento',
  unique: true  // No se permiten duplicados
}
```

### Columna Numérica

```javascript
{
  name: 'EDAD',
  required: false,
  type: 'number',
  jsonField: 'edad',
  description: 'Edad en años'
}
```

### Columna de Fecha

```javascript
{
  name: 'FECHA DE NACIMIENTO',
  required: false,
  type: 'date',
  aliases: ['FECHA NACIMIENTO'],
  jsonField: 'fechaNacimiento',
  description: 'Fecha de nacimiento'
}
```

## 🎨 Tipos de Datos Soportados

| Tipo | Descripción | Validación |
|------|-------------|------------|
| `string` | Texto | Ninguna especial |
| `number` | Número | Valida que sea numérico |
| `date` | Fecha | Parsea fechas de Excel |
| `email` | Email | Valida formato de email |

## 🔄 Orden Flexible de Columnas

### ¿Cómo funciona?

El sistema busca las columnas por **nombre**, no por **posición**. Esto significa:

**Archivo 1:**
```
| MUNICIPIO | NOMBRE COMPLETO | DOCUMENTO DE IDENTIDAD |
```

**Archivo 2 (orden diferente):**
```
| DOCUMENTO DE IDENTIDAD | MUNICIPIO | NOMBRE COMPLETO |
```

**¡Ambos archivos se procesarán correctamente!** 🎉

### Aliases en Acción

Si tu Excel tiene:
```
| EMAIL | MUNICIPIO | CEDULA |
```

Y el schema define:
```javascript
{ name: 'CORREO ELECTRONICO', aliases: ['EMAIL', 'CORREO'] }
{ name: 'MUNICIPIO' }
{ name: 'DOCUMENTO DE IDENTIDAD', aliases: ['CEDULA', 'DOCUMENTO'] }
```

¡Se reconocerán correctamente! ✅

## 📊 Validaciones Personalizadas

Puedes agregar validaciones custom en el schema:

```javascript
validations: {
  custom: {
    validateEdadCoherente: (doc) => {
      if (doc.edad && doc.fechaNacimiento) {
        const edadCalculada = calcularEdad(doc.fechaNacimiento);
        if (Math.abs(edadCalculada - doc.edad) > 1) {
          return {
            valid: false,
            error: 'EDAD no coincide con FECHA DE NACIMIENTO'
          };
        }
      }
      return { valid: true };
    }
  }
}
```

## 🚀 Mejores Prácticas

1. **Usa IDs descriptivos**: `departamento-programa-v1`
2. **Versiona tus schemas**: `v1`, `v2`, etc.
3. **Documenta cada campo**: Agrega descripciones claras
4. **Define aliases comunes**: Para soportar variaciones
5. **Marca campos requeridos**: Solo los realmente necesarios
6. **Agrupa schemas**: Por departamento, programa, etc.

## 📦 Estructura Recomendada de Archivos

```
schemas/
├── antioquia/
│   ├── antioquia-municipios-v1.schema.js
│   └── antioquia-municipios-v2.schema.js
├── cundinamarca/
│   └── cundinamarca-beneficiarios-v1.schema.js
└── general/
    └── beneficiarios-generico-v1.schema.js
```

## 🔧 Herramientas Útiles

### Listar Schemas Disponibles

```bash
node src/index.js --list-schemas
```

### Ver Detalles de un Schema

```bash
node src/index.js --schema-info antioquia-municipios-v1
```

### Validar Schema sin Procesar

```bash
node src/index.js ./data/archivo.xlsx --dry-run --schema=mi-schema-v1
```

## ❓ FAQ

### ¿Puedo tener múltiples schemas?

Sí, puedes crear tantos schemas como necesites. El sistema cargará todos automáticamente.

### ¿Qué pasa si mi archivo tiene columnas extra?

El sistema las ignorará. Solo procesará las columnas definidas en el schema.

### ¿Qué pasa si faltan columnas requeridas?

El sistema reportará el error y continuará con otras hojas válidas.

### ¿Puedo modificar un schema existente?

Sí, pero se recomienda crear una nueva versión (v2) para mantener compatibilidad.

## 📖 Recursos Adicionales

- Ver [excel.config.js](../config/excel.config.js) para configuración legacy
- Ver [schema-loader.js](./schema-loader.js) para implementación
- Consultar [ARCHITECTURE.md](../../ARCHITECTURE.md) para arquitectura del sistema

---

**Última actualización**: 12 de abril de 2026  
**Versión del sistema**: 1.0.0
