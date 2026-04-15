const mongoose = require('mongoose');

async function verifyData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/viva');
    
    const count = await mongoose.connection.db.collection('algoritmo-mejoramientos').countDocuments();
    console.log(`\n📊 Total documentos en algoritmo-mejoramientos: ${count}\n`);
    
    if (count > 0) {
      const docs = await mongoose.connection.db.collection('algoritmo-mejoramientos').find({}).limit(5).toArray();
      console.log('=== PRIMEROS 5 REGISTROS ===\n');
      docs.forEach((d, i) => {
        console.log(`${i+1}. ${d.nombreCompleto} (${d.numeroDocumento})`);
        console.log(`   Municipio: ${d.municipio}`);
        console.log(`   Email: ${d.correoElectronico || 'N/A'}`);
        console.log(`   Teléfono: ${d.telefonoCelular || 'N/A'}`);
        console.log('');
      });
      
      console.log('\n✅ Los datos ESTÁN en la base de datos viva, colección algoritmo-mejoramientos\n');
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
