/**
 * Master Seed Script: Seeds all data across utils
 * 
 * Usage:
 *   node src/utils/seedAll.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const seedAdmin = require('./seedAdmin');
const seedData = require('./seedData');
const seedPlacementEvents = require('./seedEvents');
const updateAllStudents = require('./updateStudentsData');
const { ensureSeeded: seedTimeTable } = require('../controllers/facultyController');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement-crm';

async function seedAll(isStandalone = true) {
  console.log('\n======================================================');
  console.log('   🌱  STARTING COMPLETE DATABASE SEEDING RUNNER  🌱  ');
  console.log('======================================================\n');

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
      console.log('✅ Connected to MongoDB\n');
    }

    // 1. Seed Admin
    console.log('1️⃣ Seeding Super Admin...');
    await seedAdmin();

    // 2. Check if students/companies exist, seed baseline if empty
    const Student = require('../models/Student');
    const Company = require('../models/Company');
    const studentCount = await Student.countDocuments();
    const companyCount = await Company.countDocuments();

    if (studentCount === 0 || companyCount === 0) {
      console.log('\n2️⃣ Seeding Baseline Students, Companies, Placements & Drives...');
      await seedData(false);
    } else {
      console.log(`\n2️⃣ Existing ${studentCount} Students & ${companyCount} Companies found, skipping base clear.`);
    }

    // 3. Update all students with complete profile, address, gender, career details
    console.log('\n3️⃣ Enriching Students Profile Data (Address, Gender, Career Tracks)...');
    await updateAllStudents(false);

    // 4. Seed Placement Events with attendance rosters
    console.log('\n4️⃣ Seeding Placement Events & Student Attendance...');
    await seedPlacementEvents(false);

    // 5. Seed Faculty and Timetable Slots
    console.log('\n5️⃣ Seeding Faculty Directory & Placement Timetable...');
    if (typeof seedTimeTable === 'function') {
      await seedTimeTable();
      console.log('✓ Faculty & Timetable slots verified/seeded');
    }

    // 6. Sync Placed Students with Drives & Round Attendance
    console.log('\n6️⃣ Syncing Placed Students with Drives & Round Attendance...');
    const syncDrivesAndAttendance = require('./syncDrivesAndAttendance');
    await syncDrivesAndAttendance(false);

    console.log('\n======================================================');
    console.log('       🎉 ALL DATA UTILS SEEDED SUCCESSFULLY! 🎉      ');
    console.log('======================================================\n');

    if (isStandalone) {
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error during seedAll:', error);
    if (isStandalone) {
      await mongoose.disconnect();
      process.exit(1);
    }
    throw error;
  }
}

if (require.main === module) {
  seedAll(true);
}

module.exports = seedAll;
