const mongoose = require('mongoose');
const dns = require('dns');

// Fix for Windows/DNS querySrv ETIMEOUT with MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // ignore if restricted
}

const connectDB = async () => {
  try {
    console.log('🔌 Connecting to database...');
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement-crm';
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.name} (${conn.connection.host})`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
