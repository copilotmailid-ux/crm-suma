/**
 * Seed Data Script
 * Run: node src/utils/seedData.js
 * 
 * Creates sample students, companies, placements, and alumni
 * across multiple departments and batches for testing filters.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Placement = require('../models/Placement');
const Alumni = require('../models/Alumni');

const students = [
  // ===== Batch 2021-2025 =====
  // CSE
  { name: 'Aarav Sharma', rollNumber: '21CSE001', email: 'aarav.sharma@college.edu', phone: '9876543101', department: 'CSE', batch: '2021-2025', cgpa: 9.2, skills: ['React', 'Node.js', 'MongoDB'] },
  { name: 'Diya Patel', rollNumber: '21CSE002', email: 'diya.patel@college.edu', phone: '9876543102', department: 'CSE', batch: '2021-2025', cgpa: 8.8, skills: ['Python', 'Django', 'PostgreSQL'] },
  { name: 'Vivaan Reddy', rollNumber: '21CSE003', email: 'vivaan.reddy@college.edu', phone: '9876543103', department: 'CSE', batch: '2021-2025', cgpa: 7.5, skills: ['Java', 'Spring Boot'] },
  // ECE
  { name: 'Ananya Iyer', rollNumber: '21ECE001', email: 'ananya.iyer@college.edu', phone: '9876543104', department: 'ECE', batch: '2021-2025', cgpa: 8.5, skills: ['VLSI', 'Embedded C', 'MATLAB'] },
  { name: 'Rohan Nair', rollNumber: '21ECE002', email: 'rohan.nair@college.edu', phone: '9876543105', department: 'ECE', batch: '2021-2025', cgpa: 7.9, skills: ['IoT', 'Arduino', 'Python'] },
  // ME
  { name: 'Kavya Joshi', rollNumber: '21ME001', email: 'kavya.joshi@college.edu', phone: '9876543106', department: 'ME', batch: '2021-2025', cgpa: 8.1, skills: ['AutoCAD', 'SolidWorks', 'ANSYS'] },
  { name: 'Arjun Das', rollNumber: '21ME002', email: 'arjun.das@college.edu', phone: '9876543107', department: 'ME', batch: '2021-2025', cgpa: 7.3, skills: ['Thermodynamics', 'CAD'] },
  // IT
  { name: 'Meera Gupta', rollNumber: '21IT001', email: 'meera.gupta@college.edu', phone: '9876543108', department: 'IT', batch: '2021-2025', cgpa: 9.0, skills: ['React', 'AWS', 'Docker'] },
  // EEE
  { name: 'Siddharth Rao', rollNumber: '21EEE001', email: 'siddharth.rao@college.edu', phone: '9876543109', department: 'EEE', batch: '2021-2025', cgpa: 7.7, skills: ['Power Systems', 'PLC', 'SCADA'] },
  // CE
  { name: 'Priya Singh', rollNumber: '21CE001', email: 'priya.singh@college.edu', phone: '9876543110', department: 'CE', batch: '2021-2025', cgpa: 8.3, skills: ['AutoCAD', 'Revit', 'STAAD Pro'] },

  // ===== Batch 2022-2026 =====
  // CSE
  { name: 'Aditya Kumar', rollNumber: '22CSE001', email: 'aditya.kumar@college.edu', phone: '9876543201', department: 'CSE', batch: '2022-2026', cgpa: 9.5, skills: ['React', 'TypeScript', 'GraphQL'] },
  { name: 'Sneha Menon', rollNumber: '22CSE002', email: 'sneha.menon@college.edu', phone: '9876543202', department: 'CSE', batch: '2022-2026', cgpa: 8.7, skills: ['Python', 'ML', 'TensorFlow'] },
  { name: 'Rahul Verma', rollNumber: '22CSE003', email: 'rahul.verma@college.edu', phone: '9876543203', department: 'CSE', batch: '2022-2026', cgpa: 7.2, skills: ['Java', 'Android'] },
  { name: 'Ishita Kapoor', rollNumber: '22CSE004', email: 'ishita.kapoor@college.edu', phone: '9876543204', department: 'CSE', batch: '2022-2026', cgpa: 8.4, skills: ['Go', 'Kubernetes', 'Docker'] },
  // ECE
  { name: 'Vikram Chandra', rollNumber: '22ECE001', email: 'vikram.chandra@college.edu', phone: '9876543205', department: 'ECE', batch: '2022-2026', cgpa: 8.9, skills: ['VLSI', 'Verilog', 'FPGA'] },
  { name: 'Nisha Bhat', rollNumber: '22ECE002', email: 'nisha.bhat@college.edu', phone: '9876543206', department: 'ECE', batch: '2022-2026', cgpa: 7.6, skills: ['Signal Processing', 'MATLAB'] },
  // IT
  { name: 'Karthik Sundaram', rollNumber: '22IT001', email: 'karthik.s@college.edu', phone: '9876543207', department: 'IT', batch: '2022-2026', cgpa: 8.6, skills: ['Vue.js', 'Node.js', 'MySQL'] },
  { name: 'Pooja Hegde', rollNumber: '22IT002', email: 'pooja.hegde@college.edu', phone: '9876543208', department: 'IT', batch: '2022-2026', cgpa: 8.0, skills: ['Angular', '.NET', 'Azure'] },
  // ME
  { name: 'Arun Pillai', rollNumber: '22ME001', email: 'arun.pillai@college.edu', phone: '9876543209', department: 'ME', batch: '2022-2026', cgpa: 7.8, skills: ['CATIA', 'SolidWorks'] },
  // AIDS
  { name: 'Tanvi Agarwal', rollNumber: '22AIDS001', email: 'tanvi.ag@college.edu', phone: '9876543210', department: 'AIDS', batch: '2022-2026', cgpa: 9.1, skills: ['Python', 'R', 'Deep Learning', 'NLP'] },

  // ===== Batch 2023-2027 =====
  // CSE
  { name: 'Dev Malhotra', rollNumber: '23CSE001', email: 'dev.malhotra@college.edu', phone: '9876543301', department: 'CSE', batch: '2023-2027', cgpa: 8.3, skills: ['Python', 'React', 'Firebase'] },
  { name: 'Riya Saxena', rollNumber: '23CSE002', email: 'riya.saxena@college.edu', phone: '9876543302', department: 'CSE', batch: '2023-2027', cgpa: 9.0, skills: ['Rust', 'WebAssembly', 'Go'] },
  // ECE
  { name: 'Manish Tiwari', rollNumber: '23ECE001', email: 'manish.t@college.edu', phone: '9876543303', department: 'ECE', batch: '2023-2027', cgpa: 7.4, skills: ['Embedded Systems', 'C++'] },
  // AIML
  { name: 'Shruti Desai', rollNumber: '23AIML001', email: 'shruti.desai@college.edu', phone: '9876543304', department: 'AIML', batch: '2023-2027', cgpa: 9.3, skills: ['PyTorch', 'Computer Vision', 'LLMs'] },
  // IT
  { name: 'Nikhil Prasad', rollNumber: '23IT001', email: 'nikhil.p@college.edu', phone: '9876543305', department: 'IT', batch: '2023-2027', cgpa: 7.9, skills: ['PHP', 'Laravel', 'React'] },
  // EEE
  { name: 'Lakshmi Venkat', rollNumber: '23EEE001', email: 'lakshmi.v@college.edu', phone: '9876543306', department: 'EEE', batch: '2023-2027', cgpa: 8.0, skills: ['Renewable Energy', 'MATLAB'] },
  // CE
  { name: 'Suresh Babu', rollNumber: '23CE001', email: 'suresh.b@college.edu', phone: '9876543307', department: 'CE', batch: '2023-2027', cgpa: 7.6, skills: ['Structural Analysis', 'AutoCAD'] },
  // ME
  { name: 'Deepa Krishnan', rollNumber: '23ME001', email: 'deepa.k@college.edu', phone: '9876543308', department: 'ME', batch: '2023-2027', cgpa: 8.2, skills: ['3D Printing', 'ANSYS', 'MATLAB'] },
  // AIDS
  { name: 'Harsh Pandey', rollNumber: '23AIDS001', email: 'harsh.p@college.edu', phone: '9876543309', department: 'AIDS', batch: '2023-2027', cgpa: 8.7, skills: ['Data Engineering', 'Spark', 'Kafka'] },
  // AIML
  { name: 'Aishwarya Nair', rollNumber: '23AIML002', email: 'aishwarya.n@college.edu', phone: '9876543310', department: 'AIML', batch: '2023-2027', cgpa: 8.5, skills: ['NLP', 'Transformers', 'Python'] },
];

const companies = [
  { name: 'TCS', industry: 'IT', website: 'https://www.tcs.com', contactPerson: 'Rajesh Kumar', contactEmail: 'hr@tcs.com', contactPhone: '9800000001', description: 'Tata Consultancy Services - Global IT services & consulting' },
  { name: 'Infosys', industry: 'IT', website: 'https://www.infosys.com', contactPerson: 'Priya Mehta', contactEmail: 'hr@infosys.com', contactPhone: '9800000002', description: 'Digital services and consulting company' },
  { name: 'Wipro', industry: 'IT', website: 'https://www.wipro.com', contactPerson: 'Sunil Verma', contactEmail: 'hr@wipro.com', contactPhone: '9800000003', description: 'Leading technology services company' },
  { name: 'Google', industry: 'IT', website: 'https://www.google.com', contactPerson: 'Sarah Johnson', contactEmail: 'recruit@google.com', contactPhone: '9800000004', description: 'Global technology giant - Search, Cloud, AI' },
  { name: 'Microsoft', industry: 'IT', website: 'https://www.microsoft.com', contactPerson: 'James Wilson', contactEmail: 'recruit@microsoft.com', contactPhone: '9800000005', description: 'Software, cloud computing, and AI' },
  { name: 'Deloitte', industry: 'Consulting', website: 'https://www.deloitte.com', contactPerson: 'Anita Sharma', contactEmail: 'hr@deloitte.com', contactPhone: '9800000006', description: 'Global consulting and audit firm' },
  { name: 'Bosch', industry: 'Manufacturing', website: 'https://www.bosch.com', contactPerson: 'Martin Weber', contactEmail: 'hr@bosch.com', contactPhone: '9800000007', description: 'Engineering and technology company' },
  { name: 'HDFC Bank', industry: 'Finance', website: 'https://www.hdfcbank.com', contactPerson: 'Ramesh Agarwal', contactEmail: 'hr@hdfcbank.com', contactPhone: '9800000008', description: 'Leading private sector bank in India' },
];

// Placements: { studentRoll, companyName, role, package, date, offerType, status }
const placementData = [
  // Batch 2021-2025 placements
  { studentRoll: '21CSE001', companyName: 'Google', role: 'Software Engineer', package: 32.0, date: '2025-01-15', offerType: 'on_campus', status: 'joined' },
  { studentRoll: '21CSE002', companyName: 'Microsoft', role: 'Data Engineer', package: 24.5, date: '2025-01-20', offerType: 'on_campus', status: 'joined' },
  { studentRoll: '21ECE001', companyName: 'Bosch', role: 'Embedded Engineer', package: 12.0, date: '2025-02-10', offerType: 'on_campus', status: 'joined' },
  { studentRoll: '21ME001', companyName: 'Bosch', role: 'Design Engineer', package: 10.5, date: '2025-02-12', offerType: 'on_campus', status: 'accepted' },
  { studentRoll: '21IT001', companyName: 'Infosys', role: 'Full Stack Developer', package: 8.5, date: '2025-03-01', offerType: 'on_campus', status: 'joined' },
  { studentRoll: '21CE001', companyName: 'Deloitte', role: 'Business Analyst', package: 9.0, date: '2025-03-15', offerType: 'on_campus', status: 'accepted' },

  // Batch 2022-2026 placements
  { studentRoll: '22CSE001', companyName: 'Google', role: 'SDE Intern → FTE', package: 35.0, date: '2026-01-10', offerType: 'on_campus', status: 'offered' },
  { studentRoll: '22CSE002', companyName: 'Microsoft', role: 'ML Engineer', package: 28.0, date: '2026-01-18', offerType: 'on_campus', status: 'offered' },
  { studentRoll: '22ECE001', companyName: 'TCS', role: 'Systems Engineer', package: 7.5, date: '2026-02-05', offerType: 'on_campus', status: 'accepted' },
  { studentRoll: '22IT001', companyName: 'Wipro', role: 'Project Engineer', package: 6.5, date: '2026-02-20', offerType: 'on_campus', status: 'offered' },
  { studentRoll: '22AIDS001', companyName: 'Deloitte', role: 'Data Scientist', package: 14.0, date: '2026-03-01', offerType: 'on_campus', status: 'accepted' },
  { studentRoll: '22CSE004', companyName: 'Infosys', role: 'DevOps Engineer', package: 9.5, date: '2026-03-10', offerType: 'off_campus', status: 'offered' },

  // Batch 2023-2027 placements (early / off-campus)
  { studentRoll: '23AIML001', companyName: 'Google', role: 'AI Research Intern', package: 40.0, date: '2026-06-01', offerType: 'off_campus', status: 'offered' },
  { studentRoll: '23CSE002', companyName: 'Microsoft', role: 'SWE Intern', package: 20.0, date: '2026-06-10', offerType: 'on_campus', status: 'offered' },
  { studentRoll: '23AIDS001', companyName: 'HDFC Bank', role: 'Data Analyst', package: 8.0, date: '2026-06-15', offerType: 'on_campus', status: 'offered' },
];

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...\n');

    // Clear existing data (except admins)
    await Student.deleteMany({});
    await Company.deleteMany({});
    await Placement.deleteMany({});
    await Alumni.deleteMany({});
    console.log('✓ Cleared existing data\n');

    // Insert students
    const createdStudents = await Student.insertMany(students);
    console.log(`✓ Seeded ${createdStudents.length} students`);

    // Insert companies
    const createdCompanies = await Company.insertMany(companies);
    console.log(`✓ Seeded ${createdCompanies.length} companies`);

    // Build lookup maps
    const studentMap = {};
    createdStudents.forEach(s => { studentMap[s.rollNumber] = s; });
    const companyMap = {};
    createdCompanies.forEach(c => { companyMap[c.name] = c; });

    // Create placements and update related records
    let placementCount = 0;
    let alumniCount = 0;

    for (const p of placementData) {
      const student = studentMap[p.studentRoll];
      const company = companyMap[p.companyName];

      if (!student || !company) {
        console.log(`  ⚠ Skipping: ${p.studentRoll} → ${p.companyName} (not found)`);
        continue;
      }

      // Create placement
      const placement = await Placement.create({
        studentId: student._id,
        companyId: company._id,
        role: p.role,
        package: p.package,
        placementDate: new Date(p.date),
        offerType: p.offerType,
        status: p.status,
      });
      placementCount++;

      // Update student status
      student.status = 'placed';
      student.placementId = placement._id;
      await student.save();

      // Update company placed count
      company.studentsPlaced = (company.studentsPlaced || 0) + 1;
      await company.save();

      // Extract graduation year
      const gradYear = student.batch.includes('-')
        ? student.batch.split('-')[1]
        : student.batch;

      // Create alumni record
      await Alumni.create({
        studentId: student._id,
        placementId: placement._id,
        companyId: company._id,
        currentCompany: company.name,
        currentRole: p.role,
        graduationYear: gradYear,
        department: student.department,
        isActive: true,
      });
      alumniCount++;
    }

    console.log(`✓ Seeded ${placementCount} placements`);
    console.log(`✓ Seeded ${alumniCount} alumni records\n`);

    // Summary
    const placedByDept = await Student.aggregate([
      { $group: { _id: '$department', total: { $sum: 1 }, placed: { $sum: { $cond: [{ $eq: ['$status', 'placed'] }, 1, 0] } } } },
      { $sort: { _id: 1 } },
    ]);

    console.log('── Summary ──────────────────────────────');
    console.log('Dept       Total  Placed  Unplaced');
    placedByDept.forEach(d => {
      console.log(`${d._id.padEnd(10)} ${String(d.total).padStart(5)}  ${String(d.placed).padStart(6)}  ${String(d.total - d.placed).padStart(8)}`);
    });

    const placedByBatch = await Student.aggregate([
      { $group: { _id: '$batch', total: { $sum: 1 }, placed: { $sum: { $cond: [{ $eq: ['$status', 'placed'] }, 1, 0] } } } },
      { $sort: { _id: 1 } },
    ]);

    console.log('\nBatch        Total  Placed  Unplaced');
    placedByBatch.forEach(b => {
      console.log(`${b._id.padEnd(12)} ${String(b.total).padStart(5)}  ${String(b.placed).padStart(6)}  ${String(b.total - b.placed).padStart(8)}`);
    });

    const companyStats = await Placement.aggregate([
      { $group: { _id: '$companyId', count: { $sum: 1 }, avgPkg: { $avg: '$package' } } },
      { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'comp' } },
      { $unwind: '$comp' },
      { $project: { name: '$comp.name', count: 1, avgPkg: { $round: ['$avgPkg', 1] } } },
      { $sort: { count: -1 } },
    ]);

    console.log('\nCompany       Placed  Avg Pkg (LPA)');
    companyStats.forEach(c => {
      console.log(`${c.name.padEnd(14)} ${String(c.count).padStart(6)}  ${String(c.avgPkg).padStart(13)}`);
    });

    console.log('\n✅ Seeding complete! You can now test all filters.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedData();
