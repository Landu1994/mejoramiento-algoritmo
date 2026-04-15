/**
 * Modelo de Mongoose para Convocatorias del programa de mejoramiento de vivienda
 * Colección: convocatorias
 */

const mongoose = require('mongoose');

/**
 * Schema de Convocatoria
 * Define las convocatorias a las que se pueden postular los beneficiarios
 */
const convocatoriaSchema = new mongoose.Schema({
  // ========== INFORMACIÓN BÁSICA ==========
  nombre: {
    type: String,
    required: [true, 'El nombre de la convocatoria es requerido'],
    trim: true,
    unique: true,
    index: true
  },
  
  // ========== FECHAS ==========
  fechaInicio: {
    type: Date,
    required: [true, 'La fecha de inicio es requerida']
  },
  
  fechaCierre: {
    type: Date,
    required: [true, 'La fecha de cierre es requerida']
  },
  
  // ========== CONFIGURACIÓN ==========
  estado: {
    type: String,
    enum: ['BORRADOR', 'ABIERTA', 'CERRADA', 'EN_REVISION', 'FINALIZADA', 'CANCELADA'],
    default: 'BORRADOR',
    index: true
  },
  
  // ========== GEOGRAFÍA ==========
  municipios: [{
    type: String,
    trim: true
  }],
  
  // ========== PRESUPUESTO ==========
  presupuestoTotal: {
    type: Number,
    min: 0
  }
}, {
  // Configuración del schema
  collection: 'Convocatorias-mejoramiento',
  timestamps: true, // Añade createdAt y updatedAt automáticamente
  versionKey: '__v'
});

// ========== ÍNDICES COMPUESTOS ==========
convocatoriaSchema.index({ estado: 1, fechaInicio: -1 });
convocatoriaSchema.index({ fechaInicio: 1, fechaCierre: 1 });

// ========== ÍNDICE DE BÚSQUEDA DE TEXTO ==========
convocatoriaSchema.index({ nombre: 'text' });

// ========== MÉTODOS DE INSTANCIA ==========

/**
 * Verifica si la convocatoria está abierta
 */
convocatoriaSchema.methods.estaAbierta = function() {
  const ahora = new Date();
  return this.estado === 'ABIERTA' && 
         this.fechaInicio <= ahora && 
         this.fechaCierre >= ahora;
};

// ========== MÉTODOS ESTÁTICOS ==========

/**
 * Busca convocatorias activas
 */
convocatoriaSchema.statics.buscarActivas = function() {
  return this.find({ estado: { $in: ['ABIERTA', 'EN_REVISION'] } })
    .sort({ fechaInicio: -1 });
};

/**
 * Busca convocatorias por estado
 */
convocatoriaSchema.statics.buscarPorEstado = function(estado) {
  return this.find({ estado }).sort({ fechaInicio: -1 });
};

/**
 * Busca convocatorias disponibles para postulación
 */
convocatoriaSchema.statics.buscarDisponibles = function() {
  const ahora = new Date();
  return this.find({
    estado: 'ABIERTA',
    fechaInicio: { $lte: ahora },
    fechaCierre: { $gte: ahora }
  }).sort({ fechaInicio: -1 });
};

// ========== VALIDACIONES PERSONALIZADAS ==========

/**
 * Validar que fecha de cierre sea posterior a fecha de inicio
 */
convocatoriaSchema.pre('validate', function(next) {
  if (this.fechaInicio && this.fechaCierre && this.fechaCierre <= this.fechaInicio) {
    next(new Error('La fecha de cierre debe ser posterior a la fecha de inicio'));
  } else {
    next();
  }
});

/**
 * Pre-save: Actualizar estado según fechas
 */
convocatoriaSchema.pre('save', function(next) {
  const ahora = new Date();
  
  // Si es borrador, no cambiar automáticamente
  if (this.estado === 'BORRADOR') {
    return next();
  }
  
  // Actualizar estado según fechas
  if (this.fechaCierre < ahora && this.estado === 'ABIERTA') {
    this.estado = 'CERRADA';
  }
  
  next();
});

/**
 * Post-save: Log
 */
convocatoriaSchema.post('save', function(doc) {
  console.log(`Convocatoria guardada: ${doc.nombre}`);
});

// ========== CREAR Y EXPORTAR MODELO ==========
const Convocatoria = mongoose.model('Convocatorias-mejoramiento', convocatoriaSchema);

module.exports = Convocatoria;
