require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URL = process.env.MONGODB_URL;
const COLLECTION_NAME = 'postulados-mejoramiento';

async function verifyData() {
  try {
    if (!MONGODB_URL) {
      throw new Error('Falta MONGODB_URL en variables de entorno (.env)');
    }

    await mongoose.connect(MONGODB_URL);
    
    const count = await mongoose.connection.db.collection(COLLECTION_NAME).countDocuments();
    console.log(`\n📊 Total documentos en ${COLLECTION_NAME}: ${count}\n`);
    
    if (count > 0) {
      const docs = await mongoose.connection.db.collection(COLLECTION_NAME).find({}).limit(5).toArray();
      console.log('=== PRIMEROS 5 REGISTROS ===\n');
      docs.forEach((d, i) => {
        console.log(`${i+1}. ${d.nombreCompleto} (${d.numeroDocumento})`);
        console.log(`   Municipio: ${d.municipio}`);
        console.log(`   Email: ${d.email || 'N/A'}`);
        console.log(`   Teléfono: ${d.telefono || 'N/A'}`);
        console.log('');
      });
      
      console.log(`\n✅ Los datos ESTÁN en la base ${mongoose.connection.name}, colección ${COLLECTION_NAME}\n`);
    } else {
      console.log('❌ No hay datos en la colección\n');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

verifyData();
