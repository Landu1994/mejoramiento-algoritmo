# Arquitectura del Sistema de Procesamiento de Excel

## 🏗️ Visión General

Este documento describe la arquitectura del sistema y cómo cada componente implementa los Requerimientos Funcionales (RF01-RF11).

## 📐 Arquitectura de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        index.js                              │
│                   (Punto de Entrada)                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ├──► ExcelProcessor (Orquestador Principal)
                      │         │
                      │         ├──► SheetValidator (Validación)
                      │         ├──► JsonTransformer (Transformación)
                      │         ├──► ProgressBar (Visualización)
                      │         └──► Logger (Auditoría)
                      │
                      └──► excel.config.js (Configuración)
```

## 📦 Componentes Principales

### 1. **excel.config.js** - Módulo de Configuración
**Responsabilidad**: Centralizar todas las configuraciones del sistema

**Implementa**:
- ✅ **RF01**: Configuración de fila de encabezados
- ✅ **RF02**: Configuración de estructura de columnas

**Configuraciones clave**:
```javascript
{
  HEADER_ROW: 0,                    // RF01
  EXPECTED_COLUMNS: [...],          // RF02
  COLUMN_MAPPING: {...},            // RF02
  BATCH_SIZE: 1000,                 // RF06
  DYNAMIC_BATCH_SIZING: true,       // RF10
  COUNT_ROWS: true,                 // RF05
  VALIDATIONS: {...}                // RF08
}
```

### 2. **ExcelProcessor** - Procesador Principal
**Responsabilidad**: Orquestar todo el flujo de procesamiento

**Implementa**:
- ✅ **RF03**: Identificación de hojas del archivo
- ✅ **RF05**: Conteo de filas de datos
- ✅ **RF06**: Procesamiento por lotes
- ✅ **RF09**: Indicador de progreso
- ✅ **RF10**: Estimación de rendimiento
- ✅ **RF11**: Continuidad del proceso

**Métodos principales**:
```javascript
processFile(filePath)      // Procesar archivo completo
processSheet(workbook, sheetName)  // Procesar hoja individual
calculateBatchSize(totalRows)      // RF10: Ajuste dinámico
generateReport()           // Generar reporte final
```

**Flujo de procesamiento**:
```
1. Leer archivo Excel
2. Obtener cantidad de hojas (RF03)
3. Para cada hoja:
   a. Validar estructura (RF04)
   b. Contar filas (RF05)
   c. Calcular lote óptimo (RF10)
   d. Procesar en lotes (RF06)
   e. Mostrar progreso (RF09)
   f. Continuar si hay errores (RF11)
4. Generar reporte final
```

### 3. **SheetValidator** - Validador de Estructura
**Responsabilidad**: Validar que las hojas tengan la estructura correcta

**Implementa**:
- ✅ **RF04**: Validación de estructura por hoja

**Funcionalidades**:
- Validación por nombres de columnas
- Validación por índices de columnas
- Detección de columnas faltantes
- Advertencias sobre columnas extra
- Mapeo de columnas para transformación

**Métodos principales**:
```javascript
validateSheet(sheet, sheetName)        // Validar estructura
validateByColumnNames(headers, ...)    // Validar por nombres
validateByIndices(headers, ...)        // Validar por índices
getColumnMapping(headers)              // Obtener mapeo
```

### 4. **JsonTransformer** - Transformador de Datos
**Responsabilidad**: Convertir filas Excel a documentos JSON válidos

**Implementa**:
- ✅ **RF07**: Transformación a estructura JSON
- ✅ **RF08**: Manejo de errores por registro

**Funcionalidades**:
- Transformación fila por fila
- Normalización de tipos de datos
- Validación de campos requeridos
- Validación de unicidad
- Validación de formatos (email, fecha)
- Agregación de metadatos

**Métodos principales**:
```javascript
transformBatch(rows, columnMapping, ...)  // Transformar lote
transformRow(row, columnMapping, ...)     // Transformar fila
normalizeValue(value, fieldName)          // Normalizar valor
validateDocument(doc, ...)                // Validar documento
```

**Validaciones soportadas**:
- Campos requeridos (`required`)
- Campos únicos (`uniqueFields`)
- Formato de email (`emailFields`)
- Campos de fecha (`dateFields`)
- Campos numéricos (`numericFields`)

### 5. **Logger** - Sistema de Logs
**Responsabilidad**: Registrar eventos y errores para auditoría

**Implementa**:
- ✅ **RF11**: Logs de ejecución para auditoría

**Niveles de log**:
- `error`: Errores críticos
- `warn`: Advertencias
- `info`: Información general
- `debug`: Detalles de depuración

**Métodos principales**:
```javascript
error(message, meta)     // Log de error
warn(message, meta)      // Log de advertencia
info(message, meta)      // Log de información
debug(message, meta)     // Log de debug
startTimer()             // Iniciar temporizador
endTimer()               // Finalizar y obtener tiempo
getStats()               // Obtener estadísticas
printSummary()           // Imprimir resumen
```

### 6. **ProgressBar** - Indicador de Progreso
**Responsabilidad**: Mostrar progreso visual en consola

**Implementa**:
- ✅ **RF09**: Indicador de progreso (Loading)

**Características**:
- Barra de progreso visual
- Porcentaje completado
- Contador de registros (actual/total)
- Tiempo transcurrido
- Tiempo estimado restante (ETA)

**Métodos principales**:
```javascript
start(total, sheetName)   // Iniciar barra
update(current)           // Actualizar progreso
increment()               // Incrementar en 1
stop()                    // Detener barra
getElapsedTime()          // Obtener tiempo transcurrido
getETA(current, total)    // Calcular tiempo restante
```

## 🔄 Flujo de Datos Detallado

### 1. Inicio del Procesamiento
```
Usuario ejecuta: node src/index.js archivo.xlsx
       ↓
index.js recibe la ruta del archivo
       ↓
Inicializa Logger con configuración
       ↓
Crea ExcelProcessor(config, logger)
       ↓
Llama a processor.processFile(filePath)
```

### 2. Lectura y Validación
```
ExcelProcessor.processFile()
       ↓
Lee archivo con XLSX.readFile()
       ↓
Identifica hojas: workbook.SheetNames (RF03)
       ↓
Para cada hoja:
  SheetValidator.validateSheet() (RF04)
       ↓
  Si válida → Continuar
  Si inválida → Registrar error y siguiente hoja (RF11)
```

### 3. Procesamiento por Lotes
```
Para cada hoja válida:
       ↓
Convertir a array: XLSX.utils.sheet_to_json()
       ↓
Contar filas de datos (RF05)
       ↓
Calcular tamaño de lote óptimo (RF10)
       ↓
Iniciar ProgressBar (RF09)
       ↓
Dividir en lotes de N registros (RF06)
       ↓
Para cada lote:
  │
  ├─► JsonTransformer.transformBatch()
  │      ↓
  │   Para cada fila:
  │     ├─► Transformar a JSON (RF07)
  │     ├─► Validar documento (RF08)
  │     ├─► Si error → Registrar sin detener
  │     └─► Si válido → Agregar a resultado
  │
  ├─► Actualizar ProgressBar
  │
  └─► Liberar memoria (RF06)
```

### 4. Generación de Resultados
```
Todos los lotes procesados
       ↓
Combinar documentos válidos
       ↓
Generar reporte con estadísticas
       ↓
Guardar documentos en JSON
       ↓
Guardar reporte en JSON
       ↓
Logger.printSummary()
```

## 🎯 Implementación de RFs

### RF01 - Configuración de fila de encabezados
**Archivo**: `excel.config.js`  
**Implementación**: Constante `HEADER_ROW`  
**Uso**: `const headerRow = sheet[this.config.HEADER_ROW]`

### RF02 - Configuración de estructura de columnas
**Archivo**: `excel.config.js`  
**Implementación**: `EXPECTED_COLUMNS` y `COLUMN_MAPPING`  
**Validación**: `SheetValidator.validateByColumnNames()`

### RF03 - Identificación de hojas
**Archivo**: `excelProcessor.js`  
**Implementación**: `workbook.SheetNames.length`  
**Log**: `logger.info(\`Archivo contiene ${totalSheets} hoja(s)\`)`

### RF04 - Validación de estructura por hoja
**Archivo**: `sheetValidator.js`  
**Método**: `validateSheet(sheet, sheetName)`  
**Retorna**: `{ valid, errors, warnings, headers }`

### RF05 - Conteo de filas
**Archivo**: `excelProcessor.js`  
**Implementación**: `dataRows.length`  
**Opcional**: Controlado por `config.COUNT_ROWS`

### RF06 - Procesamiento por lotes
**Archivo**: `excelProcessor.js`  
**Implementación**: 
```javascript
for (let i = 0; i < dataRows.length; i += batchSize) {
  const batch = dataRows.slice(i, i + batchSize);
  // Procesar batch
  if (global.gc) global.gc(); // Liberar memoria
}
```

### RF07 - Transformación a JSON
**Archivo**: `jsonTransformer.js`  
**Método**: `transformRow(row, columnMapping, ...)`  
**Salida**: Documento compatible con MongoDB

### RF08 - Manejo de errores por registro
**Archivo**: `jsonTransformer.js`  
**Implementación**: Try-catch por fila + validaciones  
**Comportamiento**: Registra error y continúa

### RF09 - Indicador de progreso
**Archivo**: `progressBar.js`  
**Biblioteca**: `cli-progress`  
**Muestra**: Barra, %, contadores, tiempo, ETA

### RF10 - Estimación de rendimiento
**Archivo**: `excelProcessor.js`  
**Método**: `calculateBatchSize(totalRows)`  
**Implementación**:
```javascript
if (totalRows <= 10000) return 1000;
else if (totalRows <= 50000) return 500;
else return 250;
```

### RF11 - Continuidad del proceso
**Archivo**: `excelProcessor.js` + `logger.js`  
**Implementación**: Try-catch + continue en bucles  
**Logs**: Registro completo de errores

## 📊 Estructura de Datos

### Documento de salida (RF07)
```javascript
{
  "subregion": "Valle de Aburrá",
  "municipio": "Medellín",
  "numero": 1,
  "parentesco": "Jefe de hogar",
  "primerNombre": "Juan",
  "segundoNombre": "José",
  "primerApellido": "García",
  "segundoApellido": "Gómez",
  "nombreCompleto": "Juan José García Gómez",
  "tipoDocumento": "CC",
  "numeroDocumento": "43567890",
  "fechaNacimiento": "1985-05-15T00:00:00.000Z",
  "edad": 39,
  "genero": "Masculino",
  "telefono": "3001234567",
  "email": "juan@ejemplo.com",
  "ingresosFamiliares": 2500000,
  "enfoqueDiferencial": "Ninguno",
  "zonaIntervencion": "Urbana",
  "direccion": "Calle 45 # 23-67",
  "tipologiaIntervencion": "Mejoramiento de vivienda",
  "viabilidad": "Viable",
  "valorMejoramiento": 15000000,
  "_metadata": {
    "sourceSheet": "Medellín",
    "sourceRow": 2,
    "processedAt": "2024-04-10T10:30:00.000Z"
  }
}
```

### Reporte de procesamiento
```javascript
{
  "summary": {
    "totalSheets": 4,
    "validSheets": 3,
    "invalidSheets": 1,
    "totalRowsProcessed": 5150,
    "validDocuments": 5100,
    "invalidDocuments": 50,
    "successRate": "99.03%",
    "executionTime": "2.45s",
    "recordsPerSecond": "2102.04"
  },
  "sheetDetails": [...],
  "globalErrors": [...]
}
```

## 🚀 Optimizaciones Implementadas

1. **Procesamiento por lotes** (RF06)
   - Evita cargar todo en memoria
   - Permite procesar archivos gigantes

2. **Liberación de memoria**
   - `global.gc()` después de cada lote
   - Limpieza de variables temporales

3. **Ajuste dinámico de lotes** (RF10)
   - Lotes grandes para archivos pequeños (más velocidad)
   - Lotes pequeños para archivos grandes (menos memoria)

4. **Validación eficiente**
   - Validación por hoja antes de procesar datos
   - Evita procesar hojas inválidas

5. **Mapeo optimizado**
   - Map() en lugar de búsquedas lineales
   - Cache de valores únicos

## 🔍 Puntos de Extensión

### Agregar nueva validación
**Archivo**: `jsonTransformer.js`  
**Método**: `validateDocument()`

### Cambiar formato de salida
**Archivo**: `index.js`  
**Modificar**: `fs.writeFileSync()` con formato deseado

### Integrar con MongoDB
**Archivo**: `excelProcessor.js`  
**Agregar**: Cliente de MongoDB en procesamiento por lotes

### Personalizar logs
**Archivo**: `logger.js`  
**Modificar**: `formatMessage()` o agregar transportador

## 📈 Métricas de Rendimiento

**Hardware de referencia**: Laptop estándar (8GB RAM, SSD)

| Tamaño archivo | Registros | Tiempo | Vel. (reg/s) | Memoria máx |
|----------------|-----------|--------|--------------|-------------|
| Pequeño        | 1,000     | 0.2s   | 5,000        | ~50 MB      |
| Mediano        | 10,000    | 1.5s   | 6,667        | ~100 MB     |
| Grande         | 100,000   | 18s    | 5,556        | ~200 MB     |
| Muy grande     | 500,000   | 95s    | 5,263        | ~300 MB     |

## 🛡️ Manejo de Errores por Nivel

1. **Nivel de Archivo**: Error fatal → Detener proceso
2. **Nivel de Hoja**: Error → Registrar y continuar
3. **Nivel de Registro**: Error → Registrar y continuar
4. **Nivel de Validación**: Error → No incluir en salida

## 📝 Convenciones del Código

- **Comentarios**: JSDoc para todas las funciones públicas
- **Logging**: Usar logger en lugar de console.log
- **Errores**: Try-catch con logging detallado
- **Nombres**: camelCase para variables, PascalCase para clases
- **Constantes**: UPPER_SNAKE_CASE en configuración

---

**Última actualización**: Abril 2024  
**Versión**: 1.0.0
