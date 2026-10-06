require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement-crm';

const addresses = [
  '14, Gandhi Road, RS Puram, Coimbatore - 641002',
  '27, Anna Nagar 2nd Street, Chennai - 600040',
  '88, West Masi Street, Madurai - 625001',
  '45, Saradha College Road, Salem - 636016',
  '12, Subban Street, Theni - 625531',
  '73, Cross Cut Road, Gandhipuram, Coimbatore - 641012',
  '19, Thillai Nagar 10th Cross, Trichy - 620018',
  '56, Palayamkottai High Road, Tirunelveli - 627002',
  '34, College Road, Erode - 638001',
  '91, Nethaji Road, Pollachi - 642001',
  '62, Race Course Road, Coimbatore - 641018',
  '105, Kamarajar Salai, Madurai - 625009',
  '38, Velachery Main Road, Chennai - 600042',
  '15, Junction Road, Salem - 636004',
  '42, KPN Colony, Tirupur - 641601',
  '78, Perundurai Road, Erode - 638011',
  '23, North Car Street, Dindigul - 624001',
  '51, Rajaji Street, Thanjavur - 613001'
];

const femaleNames = new Set([
  'Aditi', 'Aishwarya', 'Amrita', 'Ananya', 'Anjali', 'Bhavna', 'Deepa', 'Divya',
  'Geetha', 'Harini', 'Ishita', 'Janani', 'Kavya', 'Keerthana', 'Lakshmi', 'Meera',
  'Monika', 'Nidhi', 'Nisha', 'Pavithra', 'Pooja', 'Preethi', 'Priya', 'Rhea',
  'Rithika', 'Riya', 'Sakshi', 'Sandhya', 'Shalini', 'Shreya', 'Shruti', 'Sneha',
  'Soundarya', 'Swati', 'Tanvi', 'Vaishnavi', 'Yukta', 'Ahana', 'Diya'
]);

const entrepreneurshipDetails = [
  'Founder of AgriTech IoT: automated drip irrigation & soil health monitoring system for farms in Pollachi. Incubated in college innovation lab.',
  'Building SaaS micro-tool for college event management and ticketing. In pre-seed pitch stage.',
  'Working on autonomous delivery rover prototype using ROS and computer vision. Team of 4.',
  'Co-founding EcoPack: biodegradable packaging made from areca palm leaf waste. Seed grant applied.',
  'Developing AI resume screener & mock interview platform for engineering college students in Tamil Nadu.',
  'Hardware startup prototyping low-cost EV battery monitoring systems (BMS) for 2-wheelers.',
  'Fintech micro-savings app for college students and gig workers. Working on MVP.',
  'Drone-based aerial survey & pesticide spraying service startup. DGCA certification in progress.'
];

const higherStudiesDetails = [
  'Preparing for GATE 2025 (CSE). Aiming for M.Tech in Artificial Intelligence at IIT Madras or IISc Bangalore.',
  'GRE score: 324 (Quant 168, Verbal 156), TOEFL: 110. Applying for MS in Computer Science for Fall 2025 at ASU & TU Munich.',
  'Preparing for CAT / XAT 2024. Target B-schools: IIM Bangalore, SPJIMR, XLRI for MBA in Tech Management.',
  'GATE 2025 (ECE) aspirant. Target: Microelectronics and VLSI Design at IISc Bangalore.',
  'Applied for DAAD Scholarship & Masters in Robotics and Automation at RWTH Aachen, Germany.',
  'IELTS score: 8.0. Seeking Master of Engineering Management (MEM) at Northeastern University, USA.',
  'Preparing for GATE 2025 (Mechanical). Targeting M.Tech in Thermal Engineering at NIT Trichy.',
  'Targeting MS in Data Science & Machine Learning at National University of Singapore (NUS).'
];

const govtJobDetails = [
  'Preparing for UPSC Civil Services Examination (IAS/IPS). Optional subject: Geography.',
  'Targeting TNPSC Combined Engineering Services Examination (CESE) & Group 1 Services (Assistant Director / DSP).',
  'Preparing for SSC CGL (Staff Selection Commission) & Indian Railways (RRB Senior Section Engineer).',
  'IES / ESE (Indian Engineering Services) preparation. Target: Central Water Commission / Indian Railway Service of Mechanical Engineers.',
  'Preparing for Banking Exams (IBPS PO & SBI PO Specialist IT Officer).',
  'Targeting ISRO / DRDO Scientist-SC recruitment exam for Electronics & Mechanical branches.',
  'Preparing for Airport Authority of India (AAI) Junior Executive (Air Traffic Control / Technical).',
  'State Electricity Board (TANGEDCO) Assistant Engineer recruitment preparation.'
];

const otherDetails = [
  'Joining and modernizing 2nd generation family textile export & manufacturing business in Tirupur.',
  'Full-time Freelance UI/UX Designer & Frontend Developer serving international clients on Upwork.',
  'Selected for Teach For India Fellowship: 2-year leadership program focusing on rural education.',
  'Professional athlete (badminton university team) / Sports management & academy pathway.',
  'Family agricultural farm modernization and organic produce distribution in Theni.'
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min, max, decimals = 1) {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function getRandomDob(batch) {
  const startYear = parseInt(batch.slice(0, 4), 10);
  const birthYear = isNaN(startYear) ? 2003 : startYear - 18;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${birthYear}-${month}-${day}`;
}

async function updateAllStudents() {
  console.log('🚀 Updating all existing students with complete profile and career track data...');
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const students = await Student.find({});
    console.log(`Found ${students.length} students to update.`);

    // Pre-hash default password "Student@123" once for high performance
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Student@123', salt);

    let countPlacement = 0;
    let countEntrep = 0;
    let countHigher = 0;
    let countGovt = 0;
    let countOther = 0;

    const bulkOps = [];
    let unplacedIndex = 0;

    for (const student of students) {
      const fName = student.name.split(' ')[0] || '';
      const isFemale = femaleNames.has(fName);
      const gender = isFemale ? 'Female' : 'Male';
      const nameSlug = student.name.toLowerCase().replace(/[^a-z]/g, '');

      // Realistic 10th and 12th marks correlated somewhat with CGPA
      const cgpa = student.cgpa || 7.5;
      const basePercentage = cgpa * 9.5;
      const tenthPercentage = getRandomNumber(
        Math.max(68, Math.min(94, basePercentage - 5)),
        Math.min(99, basePercentage + 6),
        1
      );
      const twelfthPercentage = getRandomNumber(
        Math.max(65, Math.min(93, basePercentage - 6)),
        Math.min(98.5, basePercentage + 5),
        1
      );

      // Standing arrears: 85% have 0, 10% have 1, 3% have 2, 2% have 3
      const randArrears = Math.random();
      let currentArrears = 0;
      if (randArrears > 0.98) currentArrears = 3;
      else if (randArrears > 0.95) currentArrears = 2;
      else if (randArrears > 0.85) currentArrears = 1;

      // History of arrears
      const historyOfArrears = currentArrears + (Math.random() < 0.2 ? 1 : 0);

      // Career Preference determination
      let careerPreference = 'Placement';
      let careerDetails = '';

      if (student.status === 'placed') {
        careerPreference = 'Placement';
        countPlacement++;
      } else {
        // Distribute systematically across options:
        // 50% Placement
        // 16% Entrepreneurship
        // 18% Higher Studies
        // 12% Government Job
        // 4% Other
        unplacedIndex++;
        const mod = unplacedIndex % 100;
        if (mod < 50) {
          careerPreference = 'Placement';
          countPlacement++;
        } else if (mod < 66) {
          careerPreference = 'Entrepreneurship';
          careerDetails = getRandomElement(entrepreneurshipDetails);
          countEntrep++;
        } else if (mod < 84) {
          careerPreference = 'Higher Studies';
          careerDetails = getRandomElement(higherStudiesDetails);
          countHigher++;
        } else if (mod < 96) {
          careerPreference = 'Government Job';
          careerDetails = getRandomElement(govtJobDetails);
          countGovt++;
        } else {
          careerPreference = 'Other';
          careerDetails = getRandomElement(otherDetails);
          countOther++;
        }
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: student._id },
          update: {
            $set: {
              careerPreference,
              careerDetails,
              tenthPercentage,
              twelfthPercentage,
              currentArrears,
              historyOfArrears,
              gender,
              dob: student.dob || getRandomDob(student.batch || '2022-2026'),
              address: student.address || getRandomElement(addresses),
              resumeUrl: `https://drive.google.com/file/d/student_resume_${student.rollNumber.toLowerCase()}/view`,
              linkedinUrl: `https://linkedin.com/in/${nameSlug}-${student.rollNumber.toLowerCase()}`,
              githubUrl: `https://github.com/${nameSlug}${student.rollNumber.slice(-3).toLowerCase()}`,
              portfolioUrl: `https://${nameSlug}.dev`,
              ...(student.password ? {} : { password: hashedPassword })
            }
          }
        }
      });
    }

    console.log(`Executing bulk update for ${bulkOps.length} students...`);
    const result = await Student.bulkWrite(bulkOps);
    console.log('✓ Bulk update completed:', result.modifiedCount, 'documents modified.');

    console.log('\n======================================================');
    console.log('          🎉 CAREER TRACKS DISTRIBUTION 🎉           ');
    console.log('======================================================');
    console.log(` 💼 Placement          : ${countPlacement}`);
    console.log(` 🚀 Entrepreneurship   : ${countEntrep}`);
    console.log(` 🎓 Higher Studies     : ${countHigher}`);
    console.log(` 🏛️ Government Job     : ${countGovt}`);
    console.log(` 🌐 Other              : ${countOther}`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    console.log('✅ Done! Disconnected from MongoDB.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating students:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

updateAllStudents();
