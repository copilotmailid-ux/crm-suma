/**
 * Seed Data Script
 * Run: node src/utils/seedData.js
 * 
 * Seeds default admin, students, companies, placements, alumni,
 * and campus placement recruitment drives.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Placement = require('../models/Placement');
const Alumni = require('../models/Alumni');
const Drive = require('../models/Drive');
const seedAdmin = require('./seedAdmin');

const students = [
  // ===== Batch 2021-2025 =====
  // CSE
  { name: 'Aarav Sharma', rollNumber: '21CSE001', email: 'aarav.sharma@college.edu', phone: '9876543101', department: 'CSE', batch: '2021-2025', cgpa: 9.2, tenthPercentage: 94, twelfthPercentage: 92, currentArrears: 0, historyOfArrears: 0, skills: ['React', 'Node.js', 'MongoDB'], careerPreference: 'Placement' },
  { name: 'Diya Patel', rollNumber: '21CSE002', email: 'diya.patel@college.edu', phone: '9876543102', department: 'CSE', batch: '2021-2025', cgpa: 8.8, tenthPercentage: 89, twelfthPercentage: 88, currentArrears: 0, historyOfArrears: 0, skills: ['Python', 'Django', 'PostgreSQL'], careerPreference: 'Placement' },
  { name: 'Vivaan Reddy', rollNumber: '21CSE003', email: 'vivaan.reddy@college.edu', phone: '9876543103', department: 'CSE', batch: '2021-2025', cgpa: 7.5, tenthPercentage: 78, twelfthPercentage: 76, currentArrears: 0, historyOfArrears: 1, skills: ['Java', 'Spring Boot'], careerPreference: 'Placement' },
  // ECE
  { name: 'Ananya Iyer', rollNumber: '21ECE001', email: 'ananya.iyer@college.edu', phone: '9876543104', department: 'ECE', batch: '2021-2025', cgpa: 8.5, tenthPercentage: 88, twelfthPercentage: 86, currentArrears: 0, historyOfArrears: 0, skills: ['VLSI', 'Embedded C', 'MATLAB'], careerPreference: 'Placement' },
  { name: 'Rohan Nair', rollNumber: '21ECE002', email: 'rohan.nair@college.edu', phone: '9876543105', department: 'ECE', batch: '2021-2025', cgpa: 7.9, tenthPercentage: 82, twelfthPercentage: 80, currentArrears: 0, historyOfArrears: 0, skills: ['IoT', 'Arduino', 'Python'], careerPreference: 'Placement' },
  // ME
  { name: 'Kavya Joshi', rollNumber: '21ME001', email: 'kavya.joshi@college.edu', phone: '9876543106', department: 'ME', batch: '2021-2025', cgpa: 8.1, tenthPercentage: 85, twelfthPercentage: 83, currentArrears: 0, historyOfArrears: 0, skills: ['AutoCAD', 'SolidWorks', 'ANSYS'], careerPreference: 'Placement' },
  { name: 'Arjun Das', rollNumber: '21ME002', email: 'arjun.das@college.edu', phone: '9876543107', department: 'ME', batch: '2021-2025', cgpa: 7.3, tenthPercentage: 74, twelfthPercentage: 72, currentArrears: 1, historyOfArrears: 1, skills: ['Thermodynamics', 'CAD'], careerPreference: 'Higher Studies', careerDetails: 'Targeting M.S in Automotive Design in Germany' },
  // IT
  { name: 'Meera Gupta', rollNumber: '21IT001', email: 'meera.gupta@college.edu', phone: '9876543108', department: 'IT', batch: '2021-2025', cgpa: 9.0, tenthPercentage: 93, twelfthPercentage: 91, currentArrears: 0, historyOfArrears: 0, skills: ['React', 'AWS', 'Docker'], careerPreference: 'Placement' },
  // EEE
  { name: 'Siddharth Rao', rollNumber: '21EEE001', email: 'siddharth.rao@college.edu', phone: '9876543109', department: 'EEE', batch: '2021-2025', cgpa: 7.7, tenthPercentage: 80, twelfthPercentage: 78, currentArrears: 0, historyOfArrears: 0, skills: ['Power Systems', 'PLC', 'SCADA'], careerPreference: 'Government Job', careerDetails: 'Preparing for GATE & PSU Electrical Engineering' },
  // CE
  { name: 'Priya Singh', rollNumber: '21CE001', email: 'priya.singh@college.edu', phone: '9876543110', department: 'CE', batch: '2021-2025', cgpa: 8.3, tenthPercentage: 87, twelfthPercentage: 85, currentArrears: 0, historyOfArrears: 0, skills: ['AutoCAD', 'Revit', 'STAAD Pro'], careerPreference: 'Placement' },

  // ===== Batch 2022-2026 =====
  // CSE
  { name: 'Aditya Kumar', rollNumber: '22CSE001', email: 'aditya.kumar@college.edu', phone: '9876543201', department: 'CSE', batch: '2022-2026', cgpa: 9.5, tenthPercentage: 96, twelfthPercentage: 95, currentArrears: 0, historyOfArrears: 0, skills: ['React', 'TypeScript', 'GraphQL', 'Docker'], careerPreference: 'Placement' },
  { name: 'Sneha Menon', rollNumber: '22CSE002', email: 'sneha.menon@college.edu', phone: '9876543202', department: 'CSE', batch: '2022-2026', cgpa: 8.7, tenthPercentage: 90, twelfthPercentage: 88, currentArrears: 0, historyOfArrears: 0, skills: ['Python', 'ML', 'TensorFlow'], careerPreference: 'Placement' },
  { name: 'Rahul Verma', rollNumber: '22CSE003', email: 'rahul.verma@college.edu', phone: '9876543203', department: 'CSE', batch: '2022-2026', cgpa: 7.2, tenthPercentage: 75, twelfthPercentage: 73, currentArrears: 0, historyOfArrears: 1, skills: ['Java', 'Android'], careerPreference: 'Entrepreneurship', careerDetails: 'Building EdTech startup AppEdu' },
  { name: 'Ishita Kapoor', rollNumber: '22CSE004', email: 'ishita.kapoor@college.edu', phone: '9876543204', department: 'CSE', batch: '2022-2026', cgpa: 8.4, tenthPercentage: 88, twelfthPercentage: 86, currentArrears: 0, historyOfArrears: 0, skills: ['Go', 'Kubernetes', 'Docker'], careerPreference: 'Placement' },
  // ECE
  { name: 'Vikram Chandra', rollNumber: '22ECE001', email: 'vikram.chandra@college.edu', phone: '9876543205', department: 'ECE', batch: '2022-2026', cgpa: 8.9, tenthPercentage: 91, twelfthPercentage: 89, currentArrears: 0, historyOfArrears: 0, skills: ['VLSI', 'Verilog', 'FPGA'], careerPreference: 'Placement' },
  { name: 'Nisha Bhat', rollNumber: '22ECE002', email: 'nisha.bhat@college.edu', phone: '9876543206', department: 'ECE', batch: '2022-2026', cgpa: 7.6, tenthPercentage: 79, twelfthPercentage: 77, currentArrears: 0, historyOfArrears: 0, skills: ['Signal Processing', 'MATLAB'], careerPreference: 'Placement' },
  // IT
  { name: 'Karthik Sundaram', rollNumber: '22IT001', email: 'karthik.s@college.edu', phone: '9876543207', department: 'IT', batch: '2022-2026', cgpa: 8.6, tenthPercentage: 89, twelfthPercentage: 87, currentArrears: 0, historyOfArrears: 0, skills: ['Vue.js', 'Node.js', 'MySQL'], careerPreference: 'Placement' },
  { name: 'Pooja Hegde', rollNumber: '22IT002', email: 'pooja.hegde@college.edu', phone: '9876543208', department: 'IT', batch: '2022-2026', cgpa: 8.0, tenthPercentage: 84, twelfthPercentage: 82, currentArrears: 0, historyOfArrears: 0, skills: ['Angular', '.NET', 'Azure'], careerPreference: 'Placement' },
  // ME
  { name: 'Arun Pillai', rollNumber: '22ME001', email: 'arun.pillai@college.edu', phone: '9876543209', department: 'ME', batch: '2022-2026', cgpa: 7.8, tenthPercentage: 81, twelfthPercentage: 79, currentArrears: 0, historyOfArrears: 0, skills: ['CATIA', 'SolidWorks'], careerPreference: 'Placement' },
  // AIDS
  { name: 'Tanvi Agarwal', rollNumber: '22AIDS001', email: 'tanvi.ag@college.edu', phone: '9876543210', department: 'AIDS', batch: '2022-2026', cgpa: 9.1, tenthPercentage: 94, twelfthPercentage: 93, currentArrears: 0, historyOfArrears: 0, skills: ['Python', 'R', 'Deep Learning', 'NLP'], careerPreference: 'Placement' },

  // ===== Batch 2023-2027 =====
  // CSE
  { name: 'Dev Malhotra', rollNumber: '23CSE001', email: 'dev.malhotra@college.edu', phone: '9876543301', department: 'CSE', batch: '2023-2027', cgpa: 8.3, tenthPercentage: 86, twelfthPercentage: 84, currentArrears: 0, historyOfArrears: 0, skills: ['Python', 'React', 'Firebase'], careerPreference: 'Placement' },
  { name: 'Riya Saxena', rollNumber: '23CSE002', email: 'riya.saxena@college.edu', phone: '9876543302', department: 'CSE', batch: '2023-2027', cgpa: 9.0, tenthPercentage: 92, twelfthPercentage: 91, currentArrears: 0, historyOfArrears: 0, skills: ['Rust', 'WebAssembly', 'Go'], careerPreference: 'Placement' },
  // ECE
  { name: 'Manish Tiwari', rollNumber: '23ECE001', email: 'manish.t@college.edu', phone: '9876543303', department: 'ECE', batch: '2023-2027', cgpa: 7.4, tenthPercentage: 77, twelfthPercentage: 75, currentArrears: 0, historyOfArrears: 0, skills: ['Embedded Systems', 'C++'], careerPreference: 'Placement' },
  // AIML
  { name: 'Shruti Desai', rollNumber: '23AIML001', email: 'shruti.desai@college.edu', phone: '9876543304', department: 'AIML', batch: '2023-2027', cgpa: 9.3, tenthPercentage: 95, twelfthPercentage: 94, currentArrears: 0, historyOfArrears: 0, skills: ['PyTorch', 'Computer Vision', 'LLMs'], careerPreference: 'Placement' },
  // IT
  { name: 'Nikhil Prasad', rollNumber: '23IT001', email: 'nikhil.p@college.edu', phone: '9876543305', department: 'IT', batch: '2023-2027', cgpa: 7.9, tenthPercentage: 81, twelfthPercentage: 80, currentArrears: 0, historyOfArrears: 0, skills: ['PHP', 'Laravel', 'React'], careerPreference: 'Placement' },
  // EEE
  { name: 'Lakshmi Venkat', rollNumber: '23EEE001', email: 'lakshmi.v@college.edu', phone: '9876543306', department: 'EEE', batch: '2023-2027', cgpa: 8.0, tenthPercentage: 83, twelfthPercentage: 82, currentArrears: 0, historyOfArrears: 0, skills: ['Renewable Energy', 'MATLAB'], careerPreference: 'Placement' },
  // CE
  { name: 'Suresh Babu', rollNumber: '23CE001', email: 'suresh.b@college.edu', phone: '9876543307', department: 'CE', batch: '2023-2027', cgpa: 7.6, tenthPercentage: 78, twelfthPercentage: 76, currentArrears: 0, historyOfArrears: 0, skills: ['Structural Analysis', 'AutoCAD'], careerPreference: 'Placement' },
  // ME
  { name: 'Deepa Krishnan', rollNumber: '23ME001', email: 'deepa.k@college.edu', phone: '9876543308', department: 'ME', batch: '2023-2027', cgpa: 8.2, tenthPercentage: 85, twelfthPercentage: 84, currentArrears: 0, historyOfArrears: 0, skills: ['3D Printing', 'ANSYS', 'MATLAB'], careerPreference: 'Placement' },
  // AIDS
  { name: 'Harsh Pandey', rollNumber: '23AIDS001', email: 'harsh.p@college.edu', phone: '9876543309', department: 'AIDS', batch: '2023-2027', cgpa: 8.7, tenthPercentage: 89, twelfthPercentage: 88, currentArrears: 0, historyOfArrears: 0, skills: ['Data Engineering', 'Spark', 'Kafka'], careerPreference: 'Placement' },
  // AIML
  { name: 'Aishwarya Nair', rollNumber: '23AIML002', email: 'aishwarya.n@college.edu', phone: '9876543310', department: 'AIML', batch: '2023-2027', cgpa: 8.5, tenthPercentage: 87, twelfthPercentage: 86, currentArrears: 0, historyOfArrears: 0, skills: ['NLP', 'Transformers', 'Python'], careerPreference: 'Placement' },
];

const companies = [
  { name: 'Google', industry: 'IT', website: 'https://www.google.com', contactPerson: 'Sarah Johnson', contactEmail: 'recruit@google.com', contactPhone: '9800000004', description: 'Global technology giant - Search, Cloud, AI' },
  { name: 'Microsoft', industry: 'IT', website: 'https://www.microsoft.com', contactPerson: 'James Wilson', contactEmail: 'recruit@microsoft.com', contactPhone: '9800000005', description: 'Software, cloud computing, and AI' },
  { name: 'Amazon', industry: 'E-Commerce / Cloud', website: 'https://amazon.jobs', contactPerson: 'Arun Shenoy', contactEmail: 'campus-recruitment@amazon.com', contactPhone: '9840112235', description: 'World leader in cloud services (AWS), logistics, and e-commerce.' },
  { name: 'Zoho Corporation', industry: 'SaaS / Product', website: 'https://zoho.com/careers', contactPerson: 'Karthikeyan S', contactEmail: 'careers@zohocorp.com', contactPhone: '9840112240', description: 'Bootstrapped SaaS unicorn providing cloud software for business.' },
  { name: 'TCS', industry: 'IT', website: 'https://www.tcs.com', contactPerson: 'Rajesh Kumar', contactEmail: 'hr@tcs.com', contactPhone: '9800000001', description: 'Tata Consultancy Services - Global IT services & consulting' },
  { name: 'Infosys', industry: 'IT', website: 'https://www.infosys.com', contactPerson: 'Priya Mehta', contactEmail: 'hr@infosys.com', contactPhone: '9800000002', description: 'Digital services and consulting company' },
  { name: 'Wipro', industry: 'IT', website: 'https://www.wipro.com', contactPerson: 'Sunil Verma', contactEmail: 'hr@wipro.com', contactPhone: '9800000003', description: 'Leading technology services company' },
  { name: 'Deloitte', industry: 'Consulting', website: 'https://www.deloitte.com', contactPerson: 'Anita Sharma', contactEmail: 'hr@deloitte.com', contactPhone: '9800000006', description: 'Global consulting and audit firm' },
  { name: 'Bosch', industry: 'Manufacturing', website: 'https://www.bosch.com', contactPerson: 'Martin Weber', contactEmail: 'hr@bosch.com', contactPhone: '9800000007', description: 'Engineering and technology company' },
  { name: 'PayPal', industry: 'Fintech', website: 'https://paypal.com/careers', contactPerson: 'Srinivasan M', contactEmail: 'university-paypal@paypal.com', contactPhone: '9840112244', description: 'Worldwide digital payments platform and security solutions.' },
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
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement-crm';
    await mongoose.connect(uri);
    console.log('MongoDB Connected for seeding...\n');

    // 1. Seed Admin Account
    await seedAdmin();

    // 2. Clear existing operational collections
    await Student.deleteMany({});
    await Company.deleteMany({});
    await Placement.deleteMany({});
    await Alumni.deleteMany({});
    await Drive.deleteMany({});
    console.log('✓ Cleared existing operational collections\n');

    // 3. Insert students
    const createdStudents = await Student.insertMany(students);
    console.log(`✓ Seeded ${createdStudents.length} students`);

    // 4. Insert companies
    const createdCompanies = await Company.insertMany(companies);
    console.log(`✓ Seeded ${createdCompanies.length} companies`);

    // Build lookup maps
    const studentMap = {};
    createdStudents.forEach(s => { studentMap[s.rollNumber] = s; });
    const companyMap = {};
    createdCompanies.forEach(c => { companyMap[c.name] = c; });

    // 5. Create placements and update related records
    let placementCount = 0;
    let alumniCount = 0;

    for (const p of placementData) {
      const student = studentMap[p.studentRoll];
      const company = companyMap[p.companyName];

      if (!student || !company) continue;

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

      student.status = 'placed';
      student.placementId = placement._id;
      await student.save();

      company.studentsPlaced = (company.studentsPlaced || 0) + 1;
      await company.save();

      const gradYear = student.batch.includes('-')
        ? student.batch.split('-')[1]
        : student.batch;

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

    // 6. Seed Campus Placement Recruitment Drives for Student Portal
    console.log('🏢 Seeding Campus Placement Drives...');
    const now = new Date();
    const futureDate = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const drivesData = [
      {
        companyName: 'Google',
        title: 'Google Campus Recruitment Drive 2026',
        role: 'Software Engineer (SWE)',
        package: 34.5,
        jobLocation: 'Bangalore / Hyderabad',
        eligibleDepartments: ['CSE', 'IT', 'AIDS', 'AIML', 'ECE'],
        eligibleBatches: ['2022-2026', '2021-2025'],
        minCgpa: 8.0,
        minTenthMarks: 80,
        minTwelfthMarks: 80,
        maxCurrentArrears: 0,
        maxHistoryArrears: 0,
        driveDate: futureDate(14),
        registrationDeadline: futureDate(7),
        status: 'Upcoming',
        jobDescription: 'Design scalable distributed systems, microservices, and AI-first web technologies.',
        selectionProcess: 'Round 1: Online Coding (2 DSA problems), Round 2: Technical Interview 1, Round 3: Technical Interview 2, Round 4: Googliness & Leadership',
        applicationLink: 'https://careers.google.com/students',
      },
      {
        companyName: 'Microsoft',
        title: 'Microsoft Graduate Hire Program',
        role: 'Cloud & Data Engineer',
        package: 28.0,
        jobLocation: 'Hyderabad / Noida',
        eligibleDepartments: ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE'],
        eligibleBatches: ['2022-2026', '2021-2025'],
        minCgpa: 7.5,
        minTenthMarks: 75,
        minTwelfthMarks: 75,
        maxCurrentArrears: 0,
        maxHistoryArrears: 1,
        driveDate: futureDate(18),
        registrationDeadline: futureDate(10),
        status: 'Upcoming',
        jobDescription: 'Build next-generation Azure cloud infrastructure, AI models, and enterprise software.',
        selectionProcess: 'Round 1: Online Coding Test, Round 2: System Architecture & Problem Solving, Round 3: Technical & Cultural Fit',
        applicationLink: 'https://careers.microsoft.com',
      },
      {
        companyName: 'Zoho Corporation',
        title: 'Zoho Campus Hiring 2026',
        role: 'Software Developer',
        package: 8.5,
        jobLocation: 'Chennai / Tenkasi / Coimbatore',
        eligibleDepartments: ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'ME', 'CE'],
        eligibleBatches: ['2022-2026', '2023-2027'],
        minCgpa: 6.0,
        minTenthMarks: 60,
        minTwelfthMarks: 60,
        maxCurrentArrears: 1,
        maxHistoryArrears: 3,
        driveDate: futureDate(21),
        registrationDeadline: futureDate(12),
        status: 'Upcoming',
        jobDescription: 'Develop robust, high-performance web applications, databases, and enterprise productivity tools.',
        selectionProcess: 'Round 1: Written Aptitude & C Programming, Round 2: Basic Programming on Computer, Round 3: Advanced Programming, Round 4: Technical & HR',
        applicationLink: 'https://zoho.com/careers',
      },
      {
        companyName: 'PayPal',
        title: 'PayPal University Recruitment',
        role: 'Software Engineer - Payments',
        package: 22.0,
        jobLocation: 'Chennai / Bangalore',
        eligibleDepartments: ['CSE', 'IT', 'AIDS', 'AIML', 'ECE'],
        eligibleBatches: ['2022-2026'],
        minCgpa: 7.8,
        minTenthMarks: 75,
        minTwelfthMarks: 75,
        maxCurrentArrears: 0,
        maxHistoryArrears: 0,
        driveDate: futureDate(25),
        registrationDeadline: futureDate(15),
        status: 'Upcoming',
        jobDescription: 'Engineered high-throughput fintech APIs, fraud detection systems, and payment gateway infrastructure.',
        selectionProcess: 'Round 1: HackerRank Coding Challenge, Round 2: Tech Round 1 (Data Structures), Round 3: Tech Round 2 (Design), Round 4: HR',
        applicationLink: 'https://paypal.com/careers',
      },
      {
        companyName: 'Deloitte',
        title: 'Deloitte USI Campus Drive',
        role: 'Technology Analyst',
        package: 11.5,
        jobLocation: 'Bangalore / Hyderabad / Chennai',
        eligibleDepartments: ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'ME', 'CE'],
        eligibleBatches: ['2022-2026', '2021-2025'],
        minCgpa: 6.8,
        minTenthMarks: 65,
        minTwelfthMarks: 65,
        maxCurrentArrears: 0,
        maxHistoryArrears: 2,
        driveDate: futureDate(28),
        registrationDeadline: futureDate(18),
        status: 'Upcoming',
        jobDescription: 'Work on enterprise cloud implementations, business intelligence, data engineering, and ERP solutions.',
        selectionProcess: 'Round 1: Online Cognitive & Tech Assessment, Round 2: Group Discussion / Case Study, Round 3: Technical Interview, Round 4: Partner Interview',
        applicationLink: 'https://deloitte.com/careers',
      },
      {
        companyName: 'Bosch',
        title: 'Bosch Engineering Campus Recruitment',
        role: 'Embedded Systems & IoT Engineer',
        package: 10.5,
        jobLocation: 'Coimbatore / Bangalore',
        eligibleDepartments: ['ECE', 'EEE', 'ME', 'CSE', 'IT'],
        eligibleBatches: ['2022-2026', '2021-2025'],
        minCgpa: 7.0,
        minTenthMarks: 70,
        minTwelfthMarks: 70,
        maxCurrentArrears: 0,
        maxHistoryArrears: 1,
        driveDate: futureDate(30),
        registrationDeadline: futureDate(20),
        status: 'Upcoming',
        jobDescription: 'Develop firmware, automotive microcontrollers (AUTOSAR), IoT edge devices, and sensor networks.',
        selectionProcess: 'Round 1: Online Technical Aptitude & Core Test, Round 2: Technical Interview, Round 3: Managerial & HR Round',
        applicationLink: 'https://bosch.com/careers',
      },
      {
        companyName: 'TCS',
        title: 'TCS National Qualifier Test (NQT) - Digital & Prime',
        role: 'Digital Engineer / Prime Specialist',
        package: 9.0,
        jobLocation: 'Pan India',
        eligibleDepartments: ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'ME', 'CE'],
        eligibleBatches: ['2022-2026', '2023-2027'],
        minCgpa: 6.0,
        minTenthMarks: 60,
        minTwelfthMarks: 60,
        maxCurrentArrears: 1,
        maxHistoryArrears: 2,
        driveDate: futureDate(35),
        registrationDeadline: futureDate(22),
        status: 'Upcoming',
        jobDescription: 'Cloud transformation, full-stack application development, AI/ML pipelines, and automation.',
        selectionProcess: 'Round 1: TCS NQT Assessment (Cognitive + Advanced Coding), Round 2: Technical Interview, Round 3: HR Interview',
        applicationLink: 'https://tcs.com/careers',
      },
      {
        companyName: 'Infosys',
        title: 'Infosys HackWithInfy / SP Drive',
        role: 'Specialist Programmer (Power Programmer)',
        package: 9.5,
        jobLocation: 'Bangalore / Mysore / Chennai',
        eligibleDepartments: ['CSE', 'IT', 'AIDS', 'AIML', 'ECE'],
        eligibleBatches: ['2022-2026'],
        minCgpa: 6.5,
        minTenthMarks: 60,
        minTwelfthMarks: 60,
        maxCurrentArrears: 0,
        maxHistoryArrears: 1,
        driveDate: futureDate(40),
        registrationDeadline: futureDate(25),
        status: 'Upcoming',
        jobDescription: 'High-end engineering role working on complex algorithms, cloud architectures, and core software solutions.',
        selectionProcess: 'Round 1: Advanced Online Coding (3 algorithmic problems), Round 2: In-depth Technical Interview, Round 3: HR Round',
        applicationLink: 'https://infosys.com/careers',
      },
    ];

    let driveCount = 0;
    for (const d of drivesData) {
      const company = companyMap[d.companyName];
      if (company) {
        await Drive.create({
          ...d,
          companyId: company._id,
        });
        driveCount++;
      }
    }

    console.log(`✓ Seeded ${driveCount} Campus Placement Drives for Student Portal\n`);

    console.log('======================================================');
    console.log('       🎉 SEEDING COMPLETED SUCCESSFULLY! 🎉         ');
    console.log('======================================================');
    console.log(` 🔑 Admin Account : admin@placementcell.com / Admin@123`);
    console.log(` 👨‍🎓 Students     : ${createdStudents.length}`);
    console.log(` 🏢 Companies    : ${createdCompanies.length}`);
    console.log(` 🎯 Placements   : ${placementCount}`);
    console.log(` 🎓 Alumni       : ${alumniCount}`);
    console.log(` 💼 Drives       : ${driveCount}`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedData();
