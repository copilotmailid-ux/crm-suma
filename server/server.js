require('dotenv').config();
const connectDB = require('./src/config/db');
const seedAdmin = require('./src/utils/seedAdmin');
const app = require('./src/app');

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    const seedAll = require('./src/utils/seedAll');
    await seedAll(false);
    console.log('⚡ All utils and placement drive linkages active.');

    // Check updated counts of all collections
    const Student = require('./src/models/Student');
    const Company = require('./src/models/Company');
    const Placement = require('./src/models/Placement');
    const Alumni = require('./src/models/Alumni');
    const Drive = require('./src/models/Drive');
    const PlacementEvent = require('./src/models/PlacementEvent');
    const Faculty = require('./src/models/Faculty');
    const TimeTableSlot = require('./src/models/TimeTableSlot');

    const [
      studentCount,
      companyCount,
      placementCount,
      alumniCount,
      driveCount,
      eventCount,
      facultyCount,
      slotCount
    ] = await Promise.all([
      Student.countDocuments(),
      Company.countDocuments(),
      Placement.countDocuments(),
      Alumni.countDocuments(),
      Drive.countDocuments(),
      PlacementEvent.countDocuments(),
      Faculty.countDocuments(),
      TimeTableSlot.countDocuments(),
    ]);

    const fs = require('fs');
    const path = require('path');
    const kavya = await Student.findOne({ rollNumber: '21ME004' });
    const samplePlacements = await Placement.find({}).limit(5);
    const sampleDrives = await Drive.find({}).limit(5);
    const kavyaPlacements = kavya ? await Placement.find({ studentId: kavya._id }) : [];
    const kavyaDrives = kavya ? await Drive.find({
      $or: [
        { registeredStudents: kavya._id },
        { 'rounds.candidates.studentId': kavya._id },
        { 'finalSelectedStudents.studentId': kavya._id },
      ],
    }) : [];

    fs.writeFileSync(
      path.join(__dirname, 'debug_student.json'),
      JSON.stringify({
        kavya,
        kavyaPlacements,
        kavyaDrives,
        samplePlacements,
        sampleDrives: sampleDrives.map(d => ({
          _id: d._id,
          title: d.title,
          companyName: d.companyName,
          registeredStudentsCount: d.registeredStudents?.length,
          roundsCount: d.rounds?.length,
          finalSelectedCount: d.finalSelectedStudents?.length,
        })),
      }, null, 2)
    );

    // Sync alumni companyShifted status
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

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n======================================================');
      console.log('   🎓  NADAR SARASWATHI COLLEGE OF ENG & TECH - CRM  🎓   ');
      console.log('======================================================');
      console.log(` 📡  Status    : Running Successfully`);
      console.log(` 🔌  Local URL : http://localhost:${PORT}`);
      console.log(` 🗄️  Database  : MongoDB (Connected)`);
      console.log(` 🚀  Admin     : Seed Check OK / Ready`);
      console.log('======================================================\n');
    });

    // Prevent proxy ECONNRESET by extending keep-alive timeouts beyond client/proxy timeout
    server.keepAliveTimeout = 65001;
    server.headersTimeout = 66000;

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use by another process.`);
        console.error(`💡 Tip: Terminate any existing Node processes using port ${PORT}.\n`);
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
