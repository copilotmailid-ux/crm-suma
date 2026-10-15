require('dotenv').config();
const mongoose = require('mongoose');
const PlacementEvent = require('../models/PlacementEvent');
const Student = require('../models/Student');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement-crm';

const sampleEvents = [
  {
    title: 'GenAI & Cloud Architecture Masterclass',
    chiefGuest: 'Mr. K. Senthil Nathan',
    chiefGuestDesignation: 'Principal Cloud Architect & AI Lead',
    chiefGuestCompany: 'Amazon Web Services (AWS)',
    eventDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    venue: 'Main Auditorium (Dr. APJ Abdul Kalam Hall)',
    departments: ['CSE', 'IT', 'AIDS', 'AIML', 'ECE'],
    eligibleBatches: ['2022-2026', '2023-2027'],
    eventType: 'Workshop',
    status: 'Upcoming',
    description: 'Deep dive into generative AI applications, Large Language Model deployments on AWS Bedrock, serverless architectures, and preparing for cloud engineering campus placements.',
    maxParticipants: 180,
  },
  {
    title: 'Core VLSI & Semiconductor Embedded Systems Summit',
    chiefGuest: 'Dr. Meenakshi Sundaram',
    chiefGuestDesignation: 'Senior Director - Hardware R&D',
    chiefGuestCompany: 'Qualcomm India',
    eventDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // In 5 days
    startTime: '09:30 AM',
    endTime: '12:30 PM',
    venue: 'Srinivasa Ramanujan Seminar Hall',
    departments: ['ECE', 'EEE', 'AIDS'],
    eligibleBatches: ['2022-2026', '2021-2025'],
    eventType: 'Guest Lecture',
    status: 'Upcoming',
    description: 'Insights into semiconductor manufacturing trends in India, RTL design, FPGA prototyping, automotive ECUs, and high-paying careers in Tier-1 chip design companies.',
    maxParticipants: 120,
  },
  {
    title: 'Full-Stack System Design & FinTech Security Workshop',
    chiefGuest: 'Ms. Priyadarshini Rao',
    chiefGuestDesignation: 'Vice President of Engineering',
    chiefGuestCompany: 'PayPal Global Operations',
    eventDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // In 9 days
    startTime: '02:00 PM',
    endTime: '05:00 PM',
    venue: 'Central Computing Centre - Lab 4',
    departments: ['CSE', 'IT', 'AIDS', 'AIML'],
    eligibleBatches: ['2022-2026'],
    eventType: 'Bootcamp',
    status: 'Upcoming',
    description: 'Practical architectural patterns for high-throughput distributed payment processing, idempotency, microservices security, and tackling product-company design rounds.',
    maxParticipants: 100,
  },
  {
    title: 'Tier-1 Campus Placement Aptitude & Speed Math Masterclass',
    chiefGuest: 'Mr. Vigneshwaran K.',
    chiefGuestDesignation: 'Chief Corporate Trainer & Former CAT 99.8%iler',
    chiefGuestCompany: 'SMART Training Solutions',
    eventDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago (Completed)
    startTime: '09:00 AM',
    endTime: '04:00 PM',
    venue: 'Mechanical Block Seminar Hall A',
    departments: ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'AIDS'],
    eligibleBatches: ['2022-2026'],
    eventType: 'Bootcamp',
    status: 'Completed',
    description: 'Full-day comprehensive speed math techniques, permutation & combination shortcuts, logical reasoning puzzles, and mock online assessment simulations.',
    maxParticipants: 200,
  },
];

async function seedPlacementEvents() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding events...');

    await PlacementEvent.deleteMany({});
    console.log('🧹 Cleared existing placement events.');

    // Fetch students to populate attendance records
    const students = await Student.find({}).limit(300);

    for (const evtData of sampleEvents) {
      // Pick matching students based on event departments
      const matching = students.filter((s) => evtData.departments.includes(s.department));
      const rosterStudents = matching.slice(0, Math.min(matching.length, evtData.maxParticipants || 80));

      const attendance = rosterStudents.map((s, idx) => {
        let status = 'Registered';
        let markedAt = null;

        if (evtData.status === 'Completed') {
          status = idx % 5 === 0 ? 'Absent' : 'Present';
          markedAt = status === 'Present' ? evtData.eventDate : null;
        } else if (idx < 15) {
          // A few already checked in if upcoming
          status = idx % 4 === 0 ? 'Absent' : 'Present';
          markedAt = status === 'Present' ? new Date() : null;
        }

        return {
          studentId: s._id,
          studentName: s.name,
          rollNumber: s.rollNumber,
          department: s.department,
          batch: s.batch,
          status,
          markedAt,
        };
      });

      await PlacementEvent.create({
        ...evtData,
        attendance,
      });

      console.log(`✓ Seeded Event: "${evtData.title}" with ${attendance.length} attendance records.`);
    }

    console.log('\n🎉 Placement Events successfully seeded with attendance!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding events:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedPlacementEvents();
