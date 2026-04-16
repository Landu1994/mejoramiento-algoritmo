# Modelo de MongoDB - Mongoose

Este directorio contiene el modelo de Mongoose para almacenar los datos de beneficiarios del programa de mejoramiento de vivienda en MongoDB.

## 📁 Archivos

- **connection.js** - Configuración y conexión a MongoDB
- **BeneficiarioMejoramiento.js** - Modelo de Mongoose con schema de 37 campos
- **importarDatos.js** - Script para importar datos desde JSON a MongoDB
- **ejemplos.js** - Ejemplos de uso del modelo (CRUD y consultas)

## 🚀 Instalación

1. Instalar Mongoose:
```bash
pnpm install
```

2. Asegurarse de tener MongoDB ejecutándose localmente en `mongodb://localhost:27017`
   - Si usas MongoDB Compass, solo necesitas tener el servidor corriendo

## 📊 Estructura de la Base de Datos

- **Base de datos**: `viva`
- **Colección**: `algoritmo-mejoramiento`
- **Campos**: 37 campos del schema de Antioquia Municipios + metadata

### Campos Principales

```javascript
{
  // Geográfica
  subregion, municipio,
  
  // Personal
  nombreCompleto, primerNombre, segundoNombre,
  primerApellido, segundoApellido, parentesco,
  
  // Documento
  tipoDocumento, numeroDocumento (único),
  
  // Demográficos
  fechaNacimiento, edad, genero,
  
  // Contacto
  telefono, email,
  
  // Socioeconómicos
  ingresosFamiliares, enfoqueDiferencial,
  
  // Ubicación
  zonaIntervencion, direccion,
  
  // Intervención
  tipologiaIntervencion, valorMejoramiento, viabilidad,
  
  // Subsidios
  subsidiosExternos, subsidiosViva,
  
  // Documentación
  matriculaCatastral, documentoPostulado,
  documentosGrupoFamiliar, tratamientoDatos,
  soporteTenencia,
  
  // Servicios
  serviciosPublicos, zonaRiesgo,
  
  // Formularios
  fichaSisben, fcsdt,
  
  // Evidencias
  registroFotografico,
  
  // Observaciones
  observaciones, observacionesCruceVUR,
  
  // Etapas
  viabilidadEtapa1,
  
  // Metadata (automática)
  metadata: {
    archivoOrigen,
    hojaOrigen,
    filaOrigen,
    fechaProcesamiento,
    versionAlgoritmo
  },
  
  // Timestamps (automáticos)
  createdAt, updatedAt
}
```

## 🔧 Uso Básico

### 1. Importar datos desde archivo JSON

Después de procesar tu archivo Excel, importa los datos a MongoDB:

```bash
# Importación básica
pnpm db:import ../data/libro_prueba_output.json

# Limpiar y volver a importar
pnpm db:import ../data/datos.json --limpiar

# Actualizar registros existentes
pnpm db:import ../data/datos.json --actualizar

# Lote personalizado
pnpm db:import ../data/datos.json --lote=1000
```

### 2. Ejecutar ejemplos

Ver ejemplos de operaciones CRUD:

```bash
pnpm db:ejemplos
```

### 3. Usar el modelo en tu código

```javascript
const { connect, disconnect } = require('./src/model/connection');
const Beneficiario = require('./src/model/BeneficiarioMejoramiento');

async function misFunciones() {
  // Conectar
  await connect();
  
  // Buscar por documento
  const persona = await Beneficiario.buscarPorDocumento('12345678');
  
  // Buscar por municipio
  const beneficiarios = await Beneficiario.buscarPorMunicipio('Medellín');
  
  // Estadísticas
  const stats = await Beneficiario.estadisticasPorMunicipio();
  
  // Desconectar
  await disconnect();
}
```

## 📝 Ejemplos de Consultas

### Crear beneficiario

```javascript
const beneficiario = new Beneficiario({
  municipio: 'Medellín',
  nombreCompleto: 'Juan Pérez',
  tipoDocumento: 'CC',
  numeroDocumento: '12345678',
  email: 'juan@email.com',
  valorMejoramiento: 15000000
});

await beneficiario.save();
```

### Buscar y filtrar

```javascript
// Por documento (método estático)
const persona = await Beneficiario.buscarPorDocumento('12345678');

// Por municipio con opciones
const medellin = await Beneficiario.buscarPorMunicipio('Medellín', {
  limit: 10,
  sort: { nombreCompleto: 1 }
});

// Consulta avanzada
const resultados = await Beneficiario.find({
  municipio: 'Medellín',
  valorMejoramiento: { $gte: 10000000 },
  viabilidad: 'Aprobada'
}).select('nombreCompleto numeroDocumento valorMejoramiento');
```

### Actualizar

```javascript
const beneficiario = await Beneficiario.findOne({ numeroDocumento: '12345678' });
beneficiario.viabilidad = 'Aprobada';
beneficiario.observaciones = 'Documentación completa';
await beneficiario.save();
```

### Estadísticas agregadas

```javascript
// Por municipio
const statsMunicipio = await Beneficiario.estadisticasPorMunicipio();

// Por subregión
const statsSubregion = await Beneficiario.estadisticasPorSubregion();

// Conteos
const total = await Beneficiario.countDocuments();
const aprobados = await Beneficiario.countDocuments({ viabilidad: 'Aprobada' });
```

## 🔍 Índices

El modelo tiene índices optimizados para consultas frecuentes:

- `numeroDocumento` - Único, para búsquedas rápidas
- `municipio` - Para filtrado por municipio
- `nombreCompleto` - Para búsquedas
- `matriculaCatastral` - Para identificación de predios
- `{ municipio, numeroDocumento }` - Índice compuesto
- `{ subregion, municipio }` - Índice compuesto
- Índice de texto en `nombreCompleto` y `observaciones`

## 🎯 Métodos Disponibles

### Métodos de instancia

- `getNombreFormateado()` - Obtener nombre completo formateado
- `estaEnZonaRiesgo()` - Verificar si está en zona de riesgo
- `getResumen()` - Obtener resumen del beneficiario

### Métodos estáticos

- `buscarPorDocumento(numero)` - Buscar por número de documento
- `buscarPorMunicipio(municipio, opciones)` - Buscar por municipio
- `estadisticasPorMunicipio()` - Estadísticas agregadas por municipio
- `estadisticasPorSubregion()` - Estadísticas agregadas por subregión

## ⚙️ Configuración

### Variable de entorno

Puedes configurar la URL de MongoDB con una variable de entorno:

```bash
# Windows PowerShell
$env:MONGODB_URL = "mongodb://usuario:password@localhost:27017/viva"

# Linux/Mac
export MONGODB_URL="mongodb://usuario:password@localhost:27017/viva"
```

### Modificar connection.js

O editar directamente en [connection.js](connection.js):

```javascript
const DEFAULT_DB_NAME = 'viva';
const MONGODB_URL = process.env.MONGODB_URL || `mongodb://localhost:27017/${DEFAULT_DB_NAME}`;
```

## 🔐 Validaciones

El modelo incluye validaciones automáticas:

- **numeroDocumento**: Único, requerido
- **nombreCompleto**: Requerido
- **municipio**: Requerido
- **tipoDocumento**: Enum (CC, TI, CE, RC, PA, PE, PEP, Otro)
- **email**: Formato válido de email
- **edad**: Entre 0 y 120, coherente con fecha de nacimiento
- **genero**: Enum (M, F, Masculino, Femenino, Otro)
- **zonaIntervencion**: Enum (Urbana, Rural)

## 📦 Workflow Completo

1. **Procesar Excel**
   ```bash
   node src/index.js data/archivo.xlsx
   ```

2. **Revisar output**
   ```bash
   # Se genera: data/archivo_output.json
   # Se genera: data/archivo_report.json
   ```

3. **Importar a MongoDB**
   ```bash
   pnpm db:import data/archivo_output.json --limpiar
   ```

4. **Consultar datos**
   ```bash
   pnpm db:ejemplos
   ```

## 🚨 Manejo de Errores

El importador genera un archivo de errores si encuentra problemas:

- `archivo_output_errores.json` - Detalle de registros que no se pudieron importar

Razones comunes de error:
- Documento duplicado (numeroDocumento ya existe)
- Email inválido
- Tipo de documento no permitido
- Campos requeridos faltantes

## 💡 Tips

1. **Importación incremental**: Usa `--actualizar` para actualizar solo registros modificados
2. **Performance**: Ajusta `--lote` según tu RAM disponible (default: 500)
3. **Limpieza**: Usa `--limpiar` solo cuando quieras borrar todo y empezar de cero
4. **Validación**: Usa `--no-validar` para importaciones más rápidas (no recomendado)

## 📚 Recursos

- [Mongoose Docs](https://mongoosejs.com/docs/)
- [MongoDB Compass](https://www.mongodb.com/products/compass)
- [Aggregation Framework](https://www.mongodb.com/docs/manual/aggregation/)
