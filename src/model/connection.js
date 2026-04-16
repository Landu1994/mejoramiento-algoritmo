/**
 * Configuración de conexión a MongoDB
 * Base de datos por defecto: gogo-viva
 */

const mongoose = require('mongoose');

const DEFAULT_DB_NAME = process.env.MONGODB_DB_NAME || 'gogo-viva';

function normalizeMongoUrl(url) {
  if (!url) {
    return `mongodb://localhost:27017/${DEFAULT_DB_NAME}`;
  }

  const trimmedUrl = url.trim();

  if (trimmedUrl.startsWith('mongodb+srv://')) {
    const hasDbName = /mongodb\+srv:\/\/[^/]+\/[^?]+/.test(trimmedUrl);
    return hasDbName ? trimmedUrl : trimmedUrl.replace(/\/?(\?.*)?$/, `/${DEFAULT_DB_NAME}$1`);
  }

  if (trimmedUrl.startsWith('mongodb://')) {
    const hasDbName = /mongodb:\/\/[^/]+\/[^?]+/.test(trimmedUrl);
    return hasDbName ? trimmedUrl : trimmedUrl.replace(/\/?(\?.*)?$/, `/${DEFAULT_DB_NAME}$1`);
  }

  return trimmedUrl;
}

// URL de conexión, forzando la base gogo-viva si no viene definida
const MONGODB_URL = normalizeMongoUrl(process.env.MONGODB_URL);

// Opciones de conexión
const options = {
  dbName: DEFAULT_DB_NAME,
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
    console.log(`   Base de datos: ${mongoose.connection.name}`);
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
