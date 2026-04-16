# Sistema de Procesamiento de Archivos Excel

Sistema robusto para procesar archivos Excel grandes con validación de estructura, procesamiento por lotes, transformación a JSON y almacenamiento en MongoDB.

**Caso de uso actual**: Procesamiento de datos de beneficiarios de programas de mejoramiento de vivienda en los 125 municipios de Antioquia.

## 🎯 Características Principales

- ✅ **Procesamiento por lotes** optimizado para archivos grandes
- ✅ **Schemas flexibles** - Procesa columnas en cualquier orden
- ✅ **Tolerancia a errores** - Reconoce errores de tipeo en columnas
- ✅ **Integración MongoDB** - Importación directa con Mongoose
- ✅ **Validaciones robustas** - Email, documentos únicos, campos requeridos
- ✅ **Barra de progreso** visual con estadísticas en tiempo real
- ✅ **43 campos** configurados para datos de Antioquia

## ✨ Características Implementadas

### ✅ RF01 - Configuración de fila de encabezados
- Configurable mediante constante `HEADER_ROW` en `src/config/excel.config.js`

### ✅ RF02 - Configuración de estructura de columnas
- Definición por nombres de columnas esperadas (`EXPECTED_COLUMNS`)
- Definición por índices de columna (`COLUMN_INDICES`)
- Mapeo flexible de columnas (`COLUMN_MAPPING`)

### ✅ RF03 - Identificación de hojas del archivo
- Detección automática de la cantidad de hojas en el archivo
- Reporte previo al procesamiento

### ✅ RF04 - Validación de estructura por hoja
- Validación independiente de cada hoja
- Reporte detallado de errores (columnas faltantes, nombres incorrectos)
- Continuación del proceso aunque una hoja falle

### ✅ RF05 - Conteo de filas de datos
- Cálculo del número de filas después de encabezados
- Configurable mediante `COUNT_ROWS`

### ✅ RF06 - Procesamiento por lotes (Batch Processing)
- Lotes configurables (500, 1000, etc.)
- Liberación de memoria tras cada lote
- Optimización para archivos grandes

### ✅ RF07 - Transformación a estructura JSON
- Conversión automática a objetos JavaScript
- Compatible con MongoDB
- Normalización de tipos de datos

### ✅ RF08 - Manejo de errores por registro
- Validación individual de cada fila
- Registro sin detención del proceso
- Identificación precisa de filas con problemas

### ✅ RF09 - Indicador de progreso
- Barra de progreso visual en consola
- Porcentaje y contador de registros
- Tiempo transcurrido y ETA

### ✅ RF10 - Estimación de rendimiento
- Evaluación del volumen de datos
- Ajuste dinámico del tamaño de lotes
- Optimización automática

### ✅ RF11 - Continuidad del proceso
- Errores no detienen el proceso completo
- Logs detallados para auditoría
- Reporte final comprensivo

### 🆕 Sistema de Schemas Flexibles
- **Orden independiente**: Procesa columnas en cualquier posición
- **Aliases inteligentes**: Reconoce variaciones de nombres
- **Tolerancia a errores**: `DOCUMENDO` → `DOCUMENTO`, `CUIDAD` → `CIUDAD`
- **Múltiples schemas**: Soporta diferentes formatos de Excel
- **Auto-carga**: Detecta y usa schema apropiado automáticamente

### 🆕 Integración MongoDB
- **Modelo Mongoose** completo con 43 campos
- **Importación por lotes** optimizada
- **Validaciones automáticas** en base de datos
- **Índices optimizados** para consultas rápidas
- **Métodos de búsqueda** incorporados
- **Estadísticas agregadas** por municipio y subregión

## 📦 Instalación

```bash
# Instalar dependencias
pnpm install
```

**Dependencias incluidas:**
- `xlsx` - Procesamiento de archivos Excel
- `cli-progress` - Barras de progreso
- `chalk` - Colores en consola
- `mongoose` - ODM para MongoDB

## 🚀 Uso Rápido

### 1. Procesar archivo Excel

```bash
# Procesar con schema por defecto (auto-detecta columnas en cualquier orden)
node src/index.js ./data/archivo.xlsx

# Usar un schema específico
node src/index.js ./data/archivo.xlsx --schema=antioquia-municipios-v1

# Ver schemas disponibles
node src/index.js --list-schemas

# Ver ayuda
node src/index.js --help
```

### 2. Importar a MongoDB

```bash
# Importar datos procesados (limpia colección antes)
pnpm db:import data/archivo_output.json --limpiar

# Actualizar registros existentes (upsert)
pnpm db:import data/archivo_output.json --actualizar

# Con tamaño de lote personalizado
pnpm db:import data/archivo_output.json --lote=1000
```
 con Schemas (Recomendado)

Los schemas permiten procesar columnas en cualquier orden y reconocer variaciones:

```bash
# Ver schemas disponibles
pnpm list-schemas

# Salida:
# antioquia-municipios-v1
#   Nombre: Municipios de Antioquia - Mejoramiento de Vivienda
#   Versión: 1.0.0
#   Columnas: 43
#   Orden flexible: Sí
```

**Schema automático**: Si no especificas `--schema=`, el sistema usa automáticamente el schema por defecto.

**Editar schemas**: Los schemas están en `src/schemas/`
- `antioquia-municipios.schema.js` - 43 columnas con aliases
- `schema-loader.js` - Gestor de schemas

**Aliases incluidos:**
- `DOCUMENDO DE IDENTIDAD` → `DOCUMENTO DE IDENTIDAD` ✅
- `MINISTERIO DE VIVIENDA CUIDAD` → `CIUDAD` ✅
- `OBSRVACIONES` → `OBSERVACIONES` ✅
- `EMAIL` / `CORREO` → `CORREO ELECTRONICO` ✅
- Y más...

### Configuración Legacy

Si prefieres no usar schemas, edita `src/config/excel.config.js`:

```javascript
const excelConfig = {
  HEADER_ROW: 0,
  EXPECTED_COLUMNS: [/* 43 columnas */],
  COLUMN_MAPPING: {/* mapeos */},
  BATCH_SIZE: 1000,
  DYNAMIC_BATCH_SIZING: true,
  // ... más configuraciones,

  // Tamaño de lote
  BATCH_SIZE: 1000,

  // Ajuste dinámico
  DYNAMIC_BATCH_SIZING: true,

  // Validaciones
  VALIDATIONS: {
    required: ['MUNICIPIO', 'NOMBRE COMPLETO', 'TIPO DE DOCUMENTO', 'DOCUMENTO DE IDENTIDAD'],
    uniqueFields: ['DOCUMENTO DE IDENTIDAD'],
    emailFields: ['CORREO ELECTRONICO'],
    dateFields: ['FECHA DE NACIMIENTO'],
    numericFields: ['EDAD', 'INGRESOS FAMILIARES', 'VALOR DE MEJORAMIENTO']
  }
};
```

## 📊 Salidas del Sistema

### 1. Documentos procesados
- Archivo: `[nombre-archivo]_output.json`
- Contiene todos los documen (JSON)
- **Archivo**: `[nombre-archivo]_output.json`
- **Contiene**: Todos los documentos válidos transformados
- **Formato**: Array de objetos con 43 campos mapeados
- **Compatible**: Listo para importar a MongoDB

### 2. Reporte de procesamiento
- **Archivo**: `[nombre-archivo]_report.json`
- **Incluye**: 
  - Total de hojas procesadas
  - Filas válidas/inválidas
  - Tasa de éxito
  - Tiempo de ejecución
  - Velocidad (registros/segundo)
  - Errores detallados por tipo

### 3. Logs de ejecución
# Procesar Excel con schema automático
node src/index.js ./data/municipios.xlsx

# Resultado:
# ✅ municipios_output.json (documentos)
# ✅ municipios_report.json (estadísticas)
```

### Ejemplo 2: Usar schema específico

```bash
# Ver schemas disponibles
pnpm list-schemas

# Usar schema específico
node src/index.js ./data/archivo.xlsx --schema=antioquia-municipios-v1
```

### Ejemplo 3: Importar a MongoDB

```bash
# Importar datos (limpia colección antes)legacy
│   ├── schemas/                     # 🆕 Sistema de schemas
│   │   ├── antioquia-municipios.schema.js  # Schema con 43 campos
│   │   ├── schema-loader.js         # Gestor de schemas
│   │   └── README.md                # Documentación de schemas
│   ├── model/                       # 🆕 Modelos MongoDB
│   │   ├── connection.js            # Conexión a MongoDB
│   │   ├── BeneficiarioMejoramiento.js  # Modelo Mongoose
│   │   ├── importarDatos.js         # Script de importación
│   │   └── README.md                # Guía de uso de MongoDB
│   ├── processors/
│   │   └── excelProcessor.js        # Procesador principal
│   ├── validators/
│   │   └── sheetValidator.js        # Validador de hojas
│   ├── transformers/
│   │   └── jsonTransformer.js       # Transformador a JSON
│   ├── utils/
│   │   ├── logger.js                # Sistema de logs
│   │   └── progressBar.js           # Barra de progreso
│   └── index.js                     # Punto de entrada
├── examples/
│   ├── generateTestFile.js          # Generador de pruebas
│   └── generateFlexibleOrder.js     # 🆕 Genera con orden variable
├── logs/                            # Logs de ejecución
├── data/                            # Archivos de entrada/salida
# 2. Procesar
node src/index.js data/libro_prueba.xlsx

# 3. Importar a MongoDB
pnpm db:import data/libro_prueba_output.json --limpiar

# 4. Consultar desde código (ejemplo)
node -e "
  const Beneficiario = require('./src/model/BeneficiarioMejoramiento');
  const { connect } = require('./src/model/connection');
  
  connect().then(async () => {
    const total = await Beneficiario.countDocuments();
    console.log('Total beneficiarios:', total);
    
    const stats = await Beneficiario.estadisticasPorMunicipio();
    console.log('Por municipio:', stats.slice(0, 3));
  });
"
```

### Ejemplo 5: Generar archivos con orden flexible

```bash
# Genera 4 archivos Excel con columnas en diferente orden
pnpm generate-flexible

# Procesar todos y verificar que generan el mismo JSON
node src/index.js data/test_order_original.xlsx
node src/index.js data/test_order_reversed.xlsx
# Ambos generan JSON idénticos ✅

### Ejemplo 2: Con modo desarrollo (auto-reload)

```bash
pnpm dev ./data/municipios_antioquia.xlsx
```

### Ejemplo 3: Generar archivo de prueba

```bash
pnpm generate-test
# o
node examples/generateTestFile.js
```

- **MongoDB**: Importación en lotes de 500 documentos por defecto
- **Schemas**: Overhead mínimo gracias a cache inteligente

### Benchmarks de ejemplo

| Registros | Tiempo Procesamiento | Tiempo Importación | Total |
|-----------|---------------------|-------------------|-------|
| 1,000     | 0.2s               | 0.3s             | 0.5s  |
| 10,000    | 1.5s               | 2.1s             | 3.6s  |
| 50,000    | 7.2s               | 9.8s             | 17s   |
| 100,000   | 14s                | 18s              | 32s   |
## 📁 Estructura del Proyecto

```
mejoramiento-algoritmo/
├── src/
│   ├── config/
│   │   └── excel.config.js          # Configuración del sistema
│   ├── processors/
│   │   └── excelProcessor.js        # Procesador principal
│   ├── validators/
│   │   └── sheetValidator.js        # Validador de hojas
│   ├── transformers/
│   │   └── jsonTransformer.js       # Transformador a JSON
│   ├── utils/
│   │   ├── logger.js                # Sistema de logs
│   │   └── progressBar.js           # Barra de progreso
│   └── index.js                     # Punto de entrada
### Procesamiento Excel → JSON

```
1. Leer archivo Excel
2. Cargar schema (automático o especificado)
3. Identificar hojas disponibles
4. Para cada hoja:
   a. Validar estructura con schema flexible
   b. Mapear columnas (independiente del orden)
   c. Si es válida:
      - Contar filas de datos
      - Calcular tamaño de lote óptimo
      - Procesar por lotes con barra de progreso
      - Transformar a JSON usando aliases
      - Validar cada documento
      - Acumular errores sin detener
   d. Si no es válida:
      - Registrar errores detallados
      - Continuar con siguiente hoja
5. Generar reporte final
6. Guardar output.json y report.json
```

### Importación JSON → MongoDB

```
1. Conectar a MongoDB (mongodb://localhost:27017/viva)
2. Leer archivo JSON procesado
3. Validar estructura de datos
4. Opcional: Limpiar colección existente
5. Procesar en lotes de 500 (configurable)
6. Para cada documento:
   a. Validar con schema de Mongoose
   b. Insertar o actualizar (upsert)
   c. Capturar errores individuales
7. Generar archivo de errores si aplica
8. Mostrar resumen estadístico
9. Cerrar conexión limpiamen
Verifica que no haya duplicados (cada documento de identidad debe ser único):
```javascript
uniqueFields: ['DOCUMENTO DE IDENTIDAD']
```

### Validación de emails
Valida formato de correo electrónico:
```javascript
emailFields: ['CORREO ELECTRONICO']
```

### Campos de fecha
Normaliza y valida fechas de Excel:
```javascript
dateFields: ['FECHA DE NACIMIENTO']
```

### Campos numéricos
Valida que los valores sean numéricos:
```javascript
numericFields: ['EDAD', 'INGRESOS FAMILIARES', 'VALOR DE MEJORAMIENTO']
```

## 🎯 Rendimiento

- **Archivos grandes**: Procesamiento eficiente con liberación de memoria
- **Velocidad típica**: 5,000-10,000 registros/segundo (depende del hardware)
- **Memoria**: Optimizada con procesamiento por lotes

## 📝 Logs y Reportes

### Niveles de log
- `error`: Errores críticos
- `w� Scripts Disponibles

```bash
# Procesamiento Excel
pnpm start <archivo.xlsx>          # Procesar archivo
pnpm list-schemas                   # Ver schemas disponibles
pnpm help                           # Ver ayuda

# Generación de datos de prueba
pnpm generate-test                  # Generar archivo de prueba
pnpm generate-flexible              # Generar con orden variable

# MongoDB
pnpm db:import <archivo.json>       # Importar a MongoDB
pnpm db:import <archivo.json> --limpiar        # Limpiar antes
pnpm db:import <archivo.json> --actualizar     # Upsert
pnpm db:import <archivo.json> --lote=1000      # Lote personalizado
```

## 🗃️ Base de Datos MongoDB

### Modelo de Datos

**Colección**: `algoritmo-mejoramiento` en BD `viva`

**43 campos organizados en:**
- 📍 Información geográfica (subregión, municipio)
- 👤 Datos personales (nombres, apellidos, parentesco)
- 🆔 Identificación (tipo y número de documento - único)
- 📊 Datos demográficos (edad, género, fecha nacimiento)
- 📞 Contacto (teléfono, email validado)
- 💰 Socioeconómicos (ingresos, enfoque diferencial)
- 🏠 Ubicación (zona, dirección, dirección pozuelo)
- 🔧 Intervención (tipología, valor, viabilidad)
- 💵 Subsidios (externos, VIVA)
- 📋 Documentación (matrícula, documentos, tratamiento datos)
- ⚡ Servicios (públicos, gas, zona riesgo)
- 📝 Formularios (SISBEN, FCSDT)
- 📷 Evidencias (registro fotográfico)
- 💬 Observaciones (generales, VUR)
- 🏗️ Adicionales (presupuesto, peritaje, licencia)

### Consultas desde Código

```javascript
const { connect } = require('./src/model/connection');
const Beneficiario = require('./src/model/BeneficiarioMejoramiento');

await connect();

// Buscar por documento
const persona = await Beneficiario.buscarPorDocumento('12345678');

// Por municipio
const medellin = await Beneficiario.buscarPorMunicipio('Medellín');

// Estadísticas
const stats = await Beneficiario.estadisticasPorMunicipio();
const statsSub = await Beneficiario.estadisticasPorSubregion();

// Consulta avanzada
const resultados = await Beneficiario.find({
  municipio: 'Medellín',
  valorMejoramiento: { $gte: 10000000 },
  viabilidad: 'Aprobada'
});
```

Ver guía completa en [src/model/README.md](src/model/README.md)

## 🚨 Solución de Problemas

### Error: "ECONNREFUSED" al importar
**Causa**: MongoDB no está ejecutándose  
**Solución**: 
1. Abre MongoDB Compass
2. Conecta a `mongodb://localhost:27017`
3. Vuelve a ejecutar `pnpm db:import`

### Error: "Columnas faltantes"
**Causa**: Nombres de columnas con errores de tipeo  
**Solución**: El schema tiene aliases automáticos para errores comunes. Si persiste, agrega alias en `src/schemas/antioquia-municipios.schema.js`

### Error: "MODULE_NOT_FOUND"
**Causa**: Dependencias no instaladas  
**Solución**: `pnpm install`

### Importación lenta
**Causa**: Lote muy pequeño  
**Solución**: `pnpm db:import archivo.json --lote=1000`

## 📞 Documentación Adicional

- 📖 [Schema System](src/schemas/README.md) - Guía de schemas flexibles
- 🗃️ [MongoDB Guide](src/model/README.md) - Uso de Mongoose y consultas
- 📝 [Logs Guide](logs/) - Interpretación de log
- Tiempo de ejecución
- Velocidad de procesamiento
- Detalles por hoja
- Lista de errores

## 🚨 Manejo de Errores

El sistema maneja errores en tres niveles:

1. **Errores de hoja**: No detienen el procesamiento de otras hojas
2. **Errores de fila**: No detienen el procesamiento del lote
3. **Errores críticos**: Detienen el proceso y generan reporte

## 🔄 Flujo de Procesamiento

```
1. Leer archivo Excel
2. Identificar hojas disponibles
3. Para cada hoja:
   a. Validar estructura de columnas
   b. Si es válida:
      - Contar filas de datos
      - Calcular tamaño de lote óptimo
      - Procesar por lotes
      - Transformar a JSON
      - Validar cada documento
      - Mostrar progreso
   c. Si no es válida:
      - Registrar errores
      - Continuar con siguiente hoja
4. Generar reporte final
5. Guardar documentos y reporte
```

## 📞 Soporte

Para problemas o preguntas:
- 📖 Consultar [CASO_USO_ANTIOQUIA.md](CASO_USO_ANTIOQUIA.md) para detalles del caso de uso
- 📝 Revisar logs en `./logs/excel-processing.log`
- 📊 Verificar el reporte JSON generado para errores específicos
- 🏗️ Consultar [ARCHITECTURE.md](ARCHITECTURE.md) para entender la arquitectura
- 🚀 Ver [QUICKSTART.md](QUICKSTART.md) para ejemplos rápidos

## 📄 Licencia

ISC

 node .\src\importarExcelAMongo.js ".\data\matriz-corte-abril.xlsx" --schema=antioquia-municipios-v1 --nombre="VIVA MI CASA Mejoradas para ellas"