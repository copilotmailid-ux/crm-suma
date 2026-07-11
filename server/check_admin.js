const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://copilotmailid_db_user:MUMMYdear2110@cluster0.roadhnz.mongodb.net/placement-crm';

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected to Atlas successfully!');
    
    // Find all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(c => console.log(` - ${c.name}`));
    
    // Check Admin collection
    const AdminSchema = new mongoose.Schema({}, { strict: false });
    const Admin = mongoose.model('AdminCheck', AdminSchema, 'admins');
    
    const admins = await Admin.find({});
    console.log(`Found ${admins.length} admins:`);
    const bcrypt = require('bcryptjs');
    for (const admin of admins) {
      const email = admin.get('email');
      const hash = admin.get('password');
      console.log(` - Name: ${admin.get('name')}, Email: ${email}`);
      const isMatch123Case = await bcrypt.compare('Admin@123', hash);
      const isMatch123Lower = await bcrypt.compare('admin@123', hash);
      console.log(`   * Match 'Admin@123': ${isMatch123Case}`);
      console.log(`   * Match 'admin@123': ${isMatch123Lower}`);
    }
    
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
    process.exit(1);
  });
