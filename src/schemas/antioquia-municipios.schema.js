/**
 * Schema para datos de municipios de Antioquia
 * Programa de mejoramiento de vivienda
 * 
 * Este schema define la estructura esperada del archivo Excel
 * y permite procesar las columnas independientemente de su orden
 */

const antioquiaMunicipiosSchema = {
  // Identificador único del schema
  id: 'antioquia-municipios-v1',
  
  // Nombre descriptivo
  name: 'Municipios de Antioquia - Mejoramiento de Vivienda',
  
  // Descripción del schema
  description: 'Estructura para procesar datos de beneficiarios del programa de mejoramiento de vivienda en los 125 municipios de Antioquia',
  
  // Versión del schema
  version: '1.0.0',
  
  // Configuración de encabezados
  headerConfig: {
    // Fila donde se encuentran los encabezados (base 0)
    headerRow: 0,
    
    // Permitir columnas en cualquier orden
    flexibleOrder: true,
    
    // Normalización de nombres (para manejar variaciones)
    normalize: {
      ignoreCase: true,           // Ignorar mayúsculas/minúsculas
      ignoreDiacritics: false,    // No ignorar tildes (mantener exactitud)
      trimSpaces: true            // Eliminar espacios al inicio/fin
    }
  },
  
  // Definición de columnas esperadas
  columns: [
    {
      name: 'SUBREGIÓN',
      required: false,
      type: 'string',
      aliases: ['SUBREGION', 'SUB-REGIÓN', 'SUB REGION'],
      jsonField: 'subregion',
      description: 'Subregión de Antioquia'
    },
    {
      name: 'MUNICIPIO',
      required: true,
      type: 'string',
      jsonField: 'municipio',
      description: 'Nombre del municipio'
    },
    {
      name: 'PARENTESCO',
      required: false,
      type: 'string',
      jsonField: 'parentesco',
      description: 'Relación con el jefe de hogar'
    },
    {
      name: 'NOMBRE 1',
      required: false,
      type: 'string',
      aliases: ['PRIMER NOMBRE', 'NOMBRE1'],
      jsonField: 'primerNombre',
      description: 'Primer nombre del beneficiario'
    },
    {
      name: 'NOMBRE 2',
      required: false,
      type: 'string',
      aliases: ['SEGUNDO NOMBRE', 'NOMBRE2'],
      jsonField: 'segundoNombre',
      description: 'Segundo nombre del beneficiario'
    },
    {
      name: 'APELLIDO 1',
      required: false,
      type: 'string',
      aliases: ['PRIMER APELLIDO', 'APELLIDO1'],
      jsonField: 'primerApellido',
      description: 'Primer apellido del beneficiario'
    },
    {
      name: 'APELLIDO 2',
      required: false,
      type: 'string',
      aliases: ['SEGUNDO APELLIDO', 'APELLIDO2'],
      jsonField: 'segundoApellido',
      description: 'Segundo apellido del beneficiario'
    },
    {
      name: 'NOMBRE COMPLETO',
      required: true,
      type: 'string',
      aliases: ['NOMBRES COMPLETOS', 'NOMBRE_COMPLETO'],
      jsonField: 'nombreCompleto',
      description: 'Nombre completo del beneficiario'
    },
    {
      name: 'TIPO DE DOCUMENTO',
      required: true,
      type: 'string',
      aliases: ['TIPO DOCUMENTO', 'TIPO_DOCUMENTO'],
      jsonField: 'tipoDocumento',
      description: 'Tipo de documento de identidad'
    },
    {
      name: 'DOCUMENTO DE IDENTIDAD',
      required: true,
      type: 'string',
      aliases: ['DOCUMENTO', 'NUMERO DOCUMENTO', 'CEDULA', 'DOCUMENDO DE IDENTIDAD'],
      jsonField: 'numeroDocumento',
      description: 'Número de documento de identidad',
      unique: true
    },
    {
      name: 'FECHA DE NACIMIENTO',
      required: false,
      type: 'date',
      aliases: ['FECHA NACIMIENTO', 'FECHA_NACIMIENTO'],
      jsonField: 'fechaNacimiento',
      description: 'Fecha de nacimiento'
    },
    {
      name: 'EDAD',
      required: false,
      type: 'number',
      jsonField: 'edad',
      description: 'Edad del beneficiario'
    },
    {
      name: 'GENERO',
      required: false,
      type: 'string',
      aliases: ['SEXO', 'GÉNERO'],
      jsonField: 'genero',
      description: 'Género del beneficiario'
    },
    {
      name: 'NUMERO DE CONTACTO',
      required: false,
      type: 'string',
      aliases: ['TELEFONO', 'CELULAR', 'TELÉFONO'],
      jsonField: 'telefono',
      description: 'Número de contacto'
    },
    {
      name: 'CORREO ELECTRONICO',
      required: false,
      type: 'email',
      aliases: ['EMAIL', 'CORREO', 'E-MAIL'],
      jsonField: 'email',
      description: 'Correo electrónico'
    },
    {
      name: 'INGRESOS FAMILIARES',
      required: false,
      type: 'number',
      aliases: ['INGRESOS', 'INGRESO FAMILIAR'],
      jsonField: 'ingresosFamiliares',
      description: 'Ingresos familiares mensuales'
    },
    {
      name: 'ENFOQUE DIFERENCIAL',
      required: false,
      type: 'string',
      jsonField: 'enfoqueDiferencial',
      description: 'Enfoque diferencial aplicable'
    },
    {
      name: 'ZONA INTERVENCION',
      required: false,
      type: 'string',
      aliases: ['ZONA', 'ZONA DE INTERVENCIÓN'],
      jsonField: 'zonaIntervencion',
      description: 'Zona de intervención (urbana/rural)'
    },
    {
      name: 'DIRECCION O PUNTO DE REFERENCIA',
      required: false,
      type: 'string',
      aliases: ['DIRECCION', 'DIRECCIÓN'],
      jsonField: 'direccion',
      description: 'Dirección o punto de referencia'
    },
    {
      name: 'TIPOLOGIA DE INTERVENCIÓN',
      required: false,
      type: 'string',
      aliases: ['TIPOLOGIA', 'TIPO INTERVENCIÓN'],
      jsonField: 'tipologiaIntervencion',
      description: 'Tipología de la intervención'
    },
    {
      name: 'SUBSIDIOS OTORGADOS EXTERNOS (fecha entidad otorgante valor)',
      required: false,
      type: 'string',
      aliases: ['SUBSIDIOS EXTERNOS', 'SUBSIDIOS OTORGADOS EXTERNOS', 'SUBSIDIOS OTORGADOS  EXTERNOS (fecha entidad otorgante valor)'],
      jsonField: 'subsidiosExternos',
      description: 'Subsidios otorgados por entidades externas'
    },
    {
      name: 'SUBSIDIOS OTORGADOS VIVA (fecha entidad otorgante valor)',
      required: false,
      type: 'string',
      aliases: ['SUBSIDIOS VIVA', 'SUBSIDIOS OTORGADOS VIVA'],
      jsonField: 'subsidiosViva',
      description: 'Subsidios otorgados por VIVA'
    },
    {
      name: 'MINISTERIO DE VIVIENDA CIUDAD Y TERRITORIO: MATRICULA CATASTRAL',
      required: false,
      type: 'string',
      aliases: ['MATRICULA CATASTRAL', 'MATRÍCULA CATASTRAL', 'MINISTERIO DE VIVIENDA CUIDAD Y TERRITORIO: MATRICULA CATASTRAL'],
      jsonField: 'matriculaCatastral',
      description: 'Matrícula catastral del predio'
    },
    {
      name: 'VIABILIDAD',
      required: false,
      type: 'string',
      jsonField: 'viabilidad',
      description: 'Estado de viabilidad'
    },
    {
      name: 'VALOR DE MEJORAMIENTO',
      required: false,
      type: 'number',
      aliases: ['VALOR MEJORAMIENTO', 'COSTO'],
      jsonField: 'valorMejoramiento',
      description: 'Valor del mejoramiento'
    },
    {
      name: 'DOCUMENTO POSTULADO',
      required: false,
      type: 'string',
      jsonField: 'documentoPostulado',
      description: 'Documento postulado (Sí/No)'
    },
    {
      name: 'DOCUMENTOS GRUPO FAMILIAR',
      required: false,
      type: 'string',
      jsonField: 'documentosGrupoFamiliar',
      description: 'Documentos del grupo familiar'
    },
    {
      name: 'TTO DE DATOS',
      required: false,
      type: 'string',
      aliases: ['TRATAMIENTO DE DATOS', 'TRATAMIENTO DATOS'],
      jsonField: 'tratamientoDatos',
      description: 'Tratamiento de datos personales'
    },
    {
      name: 'SOPORTE TENENCIA',
      required: false,
      type: 'string',
      jsonField: 'soporteTenencia',
      description: 'Soporte de tenencia del predio'
    },
    {
      name: 'SERVICIOS PÚBLICOS',
      required: false,
      type: 'string',
      aliases: ['SERVICIOS', 'SERVICIOS PUBLICOS'],
      jsonField: 'serviciosPublicos',
      description: 'Servicios públicos disponibles'
    },
    {
      name: 'ZONA DE RIESGO',
      required: false,
      type: 'string',
      aliases: ['ZONA RIESGO', 'RIESGO'],
      jsonField: 'zonaRiesgo',
      description: 'Ubicación en zona de riesgo'
    },
    {
      name: 'FICHA SISBEN',
      required: false,
      type: 'string',
      aliases: ['SISBEN', 'SISBÉN'],
      jsonField: 'fichaSisben',
      description: 'Ficha SISBEN'
    },
    {
      name: 'FCSDT',
      required: false,
      type: 'string',
      jsonField: 'fcsdt',
      description: 'FCSDT'
    },
    {
      name: 'REGISTRO FOTOGRÁFICO',
      required: false,
      type: 'string',
      aliases: ['REGISTRO FOTOGRAFICO', 'FOTOS'],
      jsonField: 'registroFotografico',
      description: 'Registro fotográfico'
    },
    {
      name: 'OBSERVACIONES CRUCE VUR',
      required: false,
      type: 'string',
      aliases: ['OBSERVACIONES VUR', 'OBS VUR'],
      jsonField: 'observacionesCruceVUR',
      description: 'Observaciones del cruce con VUR'
    },
    {
      name: 'OBSERVACIONES',
      required: false,
      type: 'string',
      aliases: ['OBS', 'OBSERVACION', 'OBSRVACIONES', 'OBSRVACIONES '],
      jsonField: 'observaciones',
      description: 'Observaciones generales'
    },
    {
      name: 'VIABILIDAD ETAPA 1',
      required: false,
      type: 'string',
      aliases: ['VIABILIDAD ETAPA1', 'VIABILIDAD E1'],
      jsonField: 'viabilidadEtapa1',
      description: 'Viabilidad en etapa 1'
    },
    // ========== COLUMNAS ADICIONALES ==========
    {
      name: '#',
      required: false,
      type: 'number',
      aliases: ['NUMERO', 'NO', 'NUM'],
      jsonField: 'numeroFila',
      description: 'Número de fila o registro'
    },
    {
      name: 'DIRECCIÓN DE POZUELO',
      required: false,
      type: 'string',
      aliases: ['DIRECCION DE POZUELO', 'DIRECCION POZUELO'],
      jsonField: 'direccionPozuelo',
      description: 'Dirección de pozuelo'
    },
    {
      name: 'TIPO DE GAS',
      required: false,
      type: 'string',
      aliases: ['TIPO DE GAS ', 'TIPO GAS'],
      jsonField: 'tipoGas',
      description: 'Tipo de gas'
    },
    {
      name: 'PRESUPUESTO',
      required: false,
      type: 'number',
      jsonField: 'presupuesto',
      description: 'Presupuesto asignado'
    },
    {
      name: 'PERITAJE (SI AFECTA ESTRUCTURAL)',
      required: false,
      type: 'string',
      aliases: ['PERITAJE', 'PERITAJE SI AFECTA ESTRUCTURAL'],
      jsonField: 'peritaje',
      description: 'Peritaje si afecta estructura'
    },
    {
      name: 'LICENCIA (SI APLICA)',
      required: false,
      type: 'string',
      aliases: ['LICENCIA', 'LICENCIA SI APLICA'],
      jsonField: 'licencia',
      description: 'Licencia si aplica'
    }
  ],
  
  // Configuración de procesamiento
  processing: {
    batchSize: 1000,
    dynamicBatchSizing: true,
    batchSizeThresholds: {
      small: { maxRows: 10000, batchSize: 1000 },
      medium: { maxRows: 50000, batchSize: 500 },
      large: { maxRows: Infinity, batchSize: 250 }
    }
  },
  
  // Validaciones específicas del schema
  validations: {
    // Validaciones personalizadas
    custom: {
      // Validar que si hay NOMBRE 1 y APELLIDO 1, estén en NOMBRE COMPLETO
      validateNombreCompleto: (doc) => {
        if (doc.primerNombre && doc.primerApellido && doc.nombreCompleto) {
          const nombreEnCompleto = doc.nombreCompleto.toLowerCase().includes(doc.primerNombre.toLowerCase());
          const apellidoEnCompleto = doc.nombreCompleto.toLowerCase().includes(doc.primerApellido.toLowerCase());
          
          if (!nombreEnCompleto || !apellidoEnCompleto) {
            return {
              valid: false,
              error: 'NOMBRE COMPLETO no coincide con NOMBRE 1 y APELLIDO 1'
            };
          }
        }
        return { valid: true };
      }
    }
  },
  
  // Metadatos del schema
  metadata: {
    createdAt: '2026-04-12',
    author: 'Sistema de Procesamiento Excel',
    department: 'Antioquia',
    program: 'Mejoramiento de Vivienda',
    municipalities: 125
  }
};

module.exports = antioquiaMunicipiosSchema;
