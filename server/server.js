require('dotenv').config();
const connectDB = require('./src/config/db');
const seedAdmin = require('./src/utils/seedAdmin');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedAdmin();

    // Sync alumni companyShifted status
    const Alumni = require('./src/models/Alumni');
    const alumniRecords = await Alumni.find().populate('companyId');
    for (const record of alumniRecords) {
      if (record.companyId) {
        const originalCompanyName = record.companyId.name || '';
        const isShifted = record.currentCompany.trim().toLowerCase() !== originalCompanyName.trim().toLowerCase();
        if (record.companyShifted !== isShifted) {
          record.companyShifted = isShifted;
          await record.save();
        }
      }
    }

    app.listen(PORT, () => {
      console.log('\n======================================================');
      console.log('   🎓  SRI KRISHNA COLLEGE OF ENG & TECH - CRM  🎓   ');
      console.log('======================================================');
      console.log(` 📡  Status    : Running Successfully`);
      console.log(` 🔌  Local URL : http://localhost:${PORT}`);
      console.log(` 🗄️  Database  : MongoDB (Connected)`);
      console.log(` 🚀  Admin     : Seed Check OK / Ready`);
      console.log('======================================================\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
