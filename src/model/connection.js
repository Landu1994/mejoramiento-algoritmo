/**
 * Configuración de conexión a MongoDB
 * Base de datos: viva
 * Colección: algoritmo-mejoramientos
 */

const mongoose = require('mongoose');

// URL de conexión (ajusta según tu configuración)
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/viva';

// Opciones de conexión
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

/**
 * Conectar a MongoDB
 */
async function connect() {
  try {
    await mongoose.connect(MONGODB_URL, options);
    console.log('✅ Conectado a MongoDB');
    console.log(`   Base de datos: viva`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Puerto: ${mongoose.connection.port}`);
  } catch (error) {
    console.error('❌ Error de conexión a MongoDB:', error.message);
    throw error;
  }
}

/**
 * Desconectar de MongoDB
 */
async function disconnect() {
  try {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  } catch (error) {
    console.error('Error al desconectar:', error.message);
    throw error;
  }
}

/**
 * Eventos de conexión
 */
mongoose.connection.on('error', (err) => {
  console.error('Error de conexión MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB desconectado');
});

// Cerrar conexión cuando la aplicación termina
process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});

module.exports = {
  connect,
  disconnect,
  connection: mongoose.connection
};
