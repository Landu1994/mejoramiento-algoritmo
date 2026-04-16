/**
 * Modelo de Mongoose para beneficiarios del programa de mejoramiento de vivienda
 * Colección: postulados-mejoramientos
 * 
 * Basado en el schema de Antioquia Municipios (37 campos)
 */

const mongoose = require('mongoose');

/**
 * Schema de Beneficiario
 * Define todos los campos procesados del archivo Excel
 */
const beneficiarioSchema = new mongoose.Schema({
  // ========== INFORMACIÓN GEOGRÁFICA ==========
  subregion: {
    type: String,
    trim: true,
    index: true
  },
  
  municipio: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // ========== INFORMACIÓN PERSONAL ==========
  parentesco: {
    type: String,
    trim: true
  },
  
  primerNombre: {
    type: String,
    trim: true
  },
  
  segundoNombre: {
    type: String,
    trim: true
  },
  
  primerApellido: {
    type: String,
    trim: true
  },
  
  segundoApellido: {
    type: String,
    trim: true
  },
  
  nombreCompleto: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // ========== DOCUMENTO DE IDENTIDAD ==========
  tipoDocumento: {
    type: String,
    required: true,
    trim: true,
    enum: ['CC', 'TI', 'CE', 'RC', 'PA', 'PE', 'PEP', 'Otro']
  },
  
  numeroDocumento: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  
  // ========== DATOS DEMOGRÁFICOS ==========
  fechaNacimiento: {
    type: Date
  },
  
  edad: {
    type: Number,
    min: 0,
    max: 120
  },
  
  genero: {
    type: String,
    trim: true,
    enum: ['M', 'F', 'Masculino', 'Femenino', 'Otro', null]
  },
  
  // ========== INFORMACIÓN DE CONTACTO ==========
  telefono: {
    type: String,
    trim: true
  },
  
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  
  // ========== INFORMACIÓN SOCIOECONÓMICA ==========
  ingresosFamiliares: {
    type: Number,
    min: 0
  },
  
  enfoqueDiferencial: {
    type: String,
    trim: true
  },
  
  // ========== UBICACIÓN DEL PREDIO ==========
  zonaIntervencion: {
    type: String,
    trim: true,
    enum: ['Urbana', 'Rural', 'URBANA', 'RURAL', null]
  },
  
  direccion: {
    type: String,
    trim: true
  },
  
  // ========== INTERVENCIÓN ==========
  tipologiaIntervencion: {
    type: String,
    trim: true
  },
  
  // ========== SUBSIDIOS ==========
  subsidiosExternos: {
    type: String,
    trim: true
  },
  
  subsidiosViva: {
    type: String,
    trim: true
  },
  
  // ========== INFORMACIÓN CATASTRAL ==========
  matriculaCatastral: {
    type: String,
    trim: true,
    index: true
  },
  
  // ========== VIABILIDAD Y VALORES ==========
  viabilidad: {
    type: String,
    trim: true
  },
  
  valorMejoramiento: {
    type: Number,
    min: 0
  },
  
  // ========== DOCUMENTACIÓN ==========
  documentoPostulado: {
    type: String,
    trim: true,
    enum: ['Sí', 'No', 'SI', 'NO', 'Si', null]
  },
  
  documentosGrupoFamiliar: {
    type: String,
    trim: true
  },
  
  tratamientoDatos: {
    type: String,
    trim: true
  },
  
  soporteTenencia: {
    type: String,
    trim: true
  },
  
  // ========== SERVICIOS Y RIESGOS ==========
  serviciosPublicos: {
    type: String,
    trim: true
  },
  
  zonaRiesgo: {
    type: String,
    trim: true
  },
  
  // ========== SISBEN Y FORMULARIOS ==========
  fichaSisben: {
    type: String,
    trim: true
  },
  
  fcsdt: {
    type: String,
    trim: true
  },
  
  // ========== EVIDENCIAS ==========
  registroFotografico: {
    type: String,
    trim: true
  },
  
  // ========== OBSERVACIONES ==========
  observacionesCruceVUR: {
    type: String,
    trim: true
  },
  
  observaciones: {
    type: String,
    trim: true
  },
  
  // ========== ETAPAS ==========
  viabilidadEtapa1: {
    type: String,
    trim: true
  },
  
  // ========== CAMPOS ADICIONALES ==========
  numeroFila: {
    type: Number
  },
  
  direccionPozuelo: {
    type: String,
    trim: true
  },
  
  tipoGas: {
    type: String,
    trim: true
  },
  
  presupuesto: {
    type: Number,
    min: 0
  },
  
  peritaje: {
    type: String,
    trim: true
  },
  
  licencia: {
    type: String,
    trim: true
  },

  // ========== CONVOCATORIA Y POSTULACIÓN ==========
  convocatoria: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ConvocatoriaMejoramiento'
    },
    nombre: {
      type: String,
      trim: true,
      index: true
    },
    fechaInicio: Date,
    fechaCierre: Date,
    estado: {
      type: String,
      trim: true
    },
    municipios: [{
      type: String,
      trim: true
    }],
    presupuestoTotal: {
      type: Number,
      min: 0
    }
  },

  estadoPostulacion: {
    type: String,
    trim: true,
    default: 'REGISTRADO'
  },

  fechaPostulacion: {
    type: Date,
    default: Date.now
  },
  
  // ========== METADATOS DEL PROCESAMIENTO ==========
  metadata: {
    archivoOrigen: {
      type: String,
      trim: true
    },
    hojaOrigen: {
      type: String,
      trim: true
    },
    filaOrigen: {
      type: Number
    },
    fechaProcesamiento: {
      type: Date,
      default: Date.now
    },
    versionAlgoritmo: {
      type: String,
      default: '1.0.0'
    }
  }
  
}, {
  // Configuración del schema
  collection: 'postulados-mejoramientos',
  timestamps: true, // Añade createdAt y updatedAt automáticamente
  versionKey: '__v'
});

// ========== ÍNDICES COMPUESTOS ==========
// Para búsquedas comunes más eficientes
beneficiarioSchema.index({ municipio: 1, numeroDocumento: 1 });
beneficiarioSchema.index({ subregion: 1, municipio: 1 });
beneficiarioSchema.index({ nombreCompleto: 'text', observaciones: 'text' });

// ========== MÉTODOS DE INSTANCIA ==========

/**
 * Obtener nombre completo formateado
 */
beneficiarioSchema.methods.getNombreFormateado = function() {
  return this.nombreCompleto || 
         `${this.primerNombre || ''} ${this.segundoNombre || ''} ${this.primerApellido || ''} ${this.segundoApellido || ''}`.trim();
};

/**
 * Verificar si está en zona de riesgo
 */
beneficiarioSchema.methods.estaEnZonaRiesgo = function() {
  return this.zonaRiesgo && this.zonaRiesgo.toLowerCase().includes('sí');
};

/**
 * Obtener resumen del beneficiario
 */
beneficiarioSchema.methods.getResumen = function() {
  return {
    documento: this.numeroDocumento,
    nombre: this.nombreCompleto,
    municipio: this.municipio,
    subregion: this.subregion,
    tipoDocumento: this.tipoDocumento,
    viabilidad: this.viabilidad
  };
};

beneficiarioSchema.methods.aprobar = function(usuario, observacion) {
  this.estadoPostulacion = 'APROBADO';
  this.metadata = {
    ...this.metadata,
    aprobadoPor: usuario,
    observacionAprobacion: observacion,
    fechaAprobacion: new Date()
  };
  return this.save();
};

beneficiarioSchema.methods.rechazar = function(motivo, usuario) {
  this.estadoPostulacion = 'RECHAZADO';
  this.metadata = {
    ...this.metadata,
    rechazadoPor: usuario,
    motivoRechazo: motivo,
    fechaRechazo: new Date()
  };
  return this.save();
};

// ========== MÉTODOS ESTÁTICOS ==========

/**
 * Buscar por número de documento
 */
beneficiarioSchema.statics.buscarPorDocumento = function(numeroDocumento) {
  return this.findOne({ numeroDocumento });
};

/**
 * Buscar por municipio
 */
beneficiarioSchema.statics.buscarPorMunicipio = function(municipio, opciones = {}) {
  return this.find({ municipio })
    .sort(opciones.sort || { nombreCompleto: 1 })
    .limit(opciones.limit || 0);
};

beneficiarioSchema.statics.buscarPorConvocatoria = function(convocatoriaId, filtros = {}) {
  const query = {
    'convocatoria._id': convocatoriaId
  };

  if (filtros.estado) {
    query.estadoPostulacion = filtros.estado;
  }

  return this.find(query).sort({ fechaPostulacion: -1, createdAt: -1 });
};

beneficiarioSchema.statics.contarPorEstado = function(convocatoriaId) {
  const objectId = typeof convocatoriaId === 'string' && mongoose.Types.ObjectId.isValid(convocatoriaId)
    ? new mongoose.Types.ObjectId(convocatoriaId)
    : convocatoriaId;

  return this.aggregate([
    {
      $match: {
        'convocatoria._id': objectId
      }
    },
    {
      $group: {
        _id: '$estadoPostulacion',
        total: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

/**
 * Obtener estadísticas por municipio
 */
beneficiarioSchema.statics.estadisticasPorMunicipio = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$municipio',
        total: { $sum: 1 },
        valorTotal: { $sum: '$valorMejoramiento' },
        valorPromedio: { $avg: '$valorMejoramiento' }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

/**
 * Obtener beneficiarios por subregión
 */
beneficiarioSchema.statics.estadisticasPorSubregion = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$subregion',
        municipios: { $addToSet: '$municipio' },
        total: { $sum: 1 },
        valorTotal: { $sum: '$valorMejoramiento' }
      }
    },
    {
      $project: {
        _id: 1,
        total: 1,
        valorTotal: 1,
        cantidadMunicipios: { $size: '$municipios' }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

// ========== MIDDLEWARES ==========

/**
 * Pre-save: Normalizar datos antes de guardar
 */
beneficiarioSchema.pre('save', function(next) {
  // Normalizar email a minúsculas
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  
  // Normalizar género
  if (this.genero) {
    const generoMap = {
      'M': 'M',
      'F': 'F',
      'MASCULINO': 'M',
      'FEMENINO': 'F',
      'Masculino': 'M',
      'Femenino': 'F'
    };
    this.genero = generoMap[this.genero] || this.genero;
  }
  
  // Normalizar zona de intervención
  if (this.zonaIntervencion) {
    this.zonaIntervencion = this.zonaIntervencion.charAt(0).toUpperCase() + 
                            this.zonaIntervencion.slice(1).toLowerCase();
  }
  
  next();
});

/**
 * Pre-validate: Recalcular edad automáticamente desde fecha de nacimiento
 * Garantiza que todos los registros tengan edad correcta sin rechazarlos
 */
beneficiarioSchema.pre('validate', function(next) {
  // Si hay fecha de nacimiento, calcular edad correcta
  if (this.fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(this.fechaNacimiento);
    const edadCalculada = Math.floor((hoy - nacimiento) / (365.25 * 24 * 60 * 60 * 1000));
    
    // Sobrescribir edad con el valor calculado
    if (edadCalculada >= 0 && edadCalculada <= 150) {
      this.edad = edadCalculada;
    }
  }
  
  next();
});

/**
 * Post-save: Log después de guardar
 */
beneficiarioSchema.post('save', function(doc) {
  console.log(`Beneficiario guardado: ${doc.numeroDocumento} - ${doc.nombreCompleto}`);
});

// ========== CREAR Y EXPORTAR MODELO ==========
const Beneficiario = mongoose.models.PostuladoMejoramiento || mongoose.model('PostuladoMejoramiento', beneficiarioSchema);

module.exports = Beneficiario;
