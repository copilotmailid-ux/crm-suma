/**
 * High-Scale Seed Script: 2000 Students & 50 Companies
 * 
 * Usage:
 *   node src/utils/seed2000.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Placement = require('../models/Placement');
const Alumni = require('../models/Alumni');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement-crm';

// 50 Realistic Companies across diverse sectors
const companiesData = [
  // IT & Tech Giants (Tier 1 Product)
  { name: 'Google', industry: 'IT / Product', website: 'https://careers.google.com', contactPerson: 'Sundararajan V', contactEmail: 'campus-in@google.com', contactPhone: '9840112233', description: 'Global tech leader in search, cloud, AI, and systems software.' },
  { name: 'Microsoft', industry: 'IT / Product', website: 'https://careers.microsoft.com', contactPerson: 'Ritu Grover', contactEmail: 'university-india@microsoft.com', contactPhone: '9840112234', description: 'Enterprise software, Azure cloud computing, and developer tools.' },
  { name: 'Amazon', industry: 'E-Commerce / Cloud', website: 'https://amazon.jobs', contactPerson: 'Arun Shenoy', contactEmail: 'campus-recruitment@amazon.com', contactPhone: '9840112235', description: 'World leader in cloud services (AWS), logistics, and e-commerce.' },
  { name: 'Adobe', industry: 'IT / Product', website: 'https://adobe.com/careers', contactPerson: 'Megha Kapoor', contactEmail: 'ur-india@adobe.com', contactPhone: '9840112236', description: 'Digital media, creative software, and cloud document solutions.' },
  { name: 'Oracle', industry: 'IT / Enterprise', website: 'https://oracle.com/careers', contactPerson: 'Deepak Saxena', contactEmail: 'campus.india@oracle.com', contactPhone: '9840112237', description: 'Enterprise database, cloud applications, and hardware systems.' },
  { name: 'Cisco Systems', industry: 'Networking / IT', website: 'https://cisco.com/careers', contactPerson: 'Preethi Nair', contactEmail: 'university-cisco@cisco.com', contactPhone: '9840112238', description: 'Global leader in networking, telecommunications, and cybersecurity.' },
  { name: 'Salesforce', industry: 'Cloud / SaaS', website: 'https://salesforce.com/careers', contactPerson: 'Anand Kulkarni', contactEmail: 'futureforce-india@salesforce.com', contactPhone: '9840112239', description: 'Global #1 CRM platform and customer success cloud ecosystem.' },
  { name: 'Zoho Corporation', industry: 'SaaS / Product', website: 'https://zoho.com/careers', contactPerson: 'Karthikeyan S', contactEmail: 'careers@zohocorp.com', contactPhone: '9840112240', description: 'Bootstrapped SaaS unicorn providing cloud software for business.' },
  { name: 'Freshworks', industry: 'SaaS / Product', website: 'https://freshworks.com/careers', contactPerson: 'Sneha Ramachandran', contactEmail: 'campus@freshworks.com', contactPhone: '9840112241', description: 'Customer engagement software and AI-driven service desks.' },
  { name: 'Atlassian', industry: 'IT / Product', website: 'https://atlassian.com/careers', contactPerson: 'Vikram Seth', contactEmail: 'grad-recruitment@atlassian.com', contactPhone: '9840112242', description: 'Collaboration and agile developer tools including Jira and Confluence.' },
  { name: 'Uber Technologies', industry: 'Mobility / Tech', website: 'https://uber.com/careers', contactPerson: 'Pooja Bhatt', contactEmail: 'tech-campus@uber.com', contactPhone: '9840112243', description: 'Transportation, delivery, and real-time mapping platform.' },
  { name: 'PayPal', industry: 'Fintech', website: 'https://paypal.com/careers', contactPerson: 'Srinivasan M', contactEmail: 'university-paypal@paypal.com', contactPhone: '9840112244', description: 'Worldwide digital payments platform and security solutions.' },
  { name: 'SAP Labs', industry: 'Enterprise / Cloud', website: 'https://sap.com/careers', contactPerson: 'Nandini Das', contactEmail: 'campus-india@sap.com', contactPhone: '9840112245', description: 'Market leader in enterprise application software and ERP.' },
  { name: 'IBM India', industry: 'IT / Consulting', website: 'https://ibm.com/careers', contactPerson: 'Rajesh Mukherjee', contactEmail: 'university.ibm@in.ibm.com', contactPhone: '9840112246', description: 'Hybrid cloud, artificial intelligence, and quantum computing.' },
  { name: 'NVIDIA', industry: 'Semiconductors / AI', website: 'https://nvidia.com/careers', contactPerson: 'Manoj Pillai', contactEmail: 'university-india@nvidia.com', contactPhone: '9840112247', description: 'GPUs, AI accelerators, and high-performance computing.' },
  { name: 'Qualcomm', industry: 'Semiconductors / Telecom', website: 'https://qualcomm.com/careers', contactPerson: 'Harini Balan', contactEmail: 'college-relations@qualcomm.com', contactPhone: '9840112248', description: 'Wireless telecommunications products and Snapdragon chipsets.' },
  { name: 'Intel Corporation', industry: 'Semiconductors', website: 'https://intel.com/careers', contactPerson: 'Gautam Rao', contactEmail: 'campus-intel@intel.com', contactPhone: '9840112249', description: 'Microprocessors, semiconductor chips, and edge computing.' },
  { name: 'AMD', industry: 'Semiconductors', website: 'https://amd.com/careers', contactPerson: 'Shweta Joshi', contactEmail: 'careers-india@amd.com', contactPhone: '9840112250', description: 'High-performance computing, graphics, and visualization chips.' },

  // IT Services & Global Delivery
  { name: 'Tata Consultancy Services (TCS)', industry: 'IT Services', website: 'https://tcs.com', contactPerson: 'Kishore Kumar', contactEmail: 'campus.tcs@tcs.com', contactPhone: '9840223301', description: 'India’s largest IT services, digital business solutions, and consulting.' },
  { name: 'Infosys', industry: 'IT Services', website: 'https://infosys.com', contactPerson: 'Tanvi Shah', contactEmail: 'campus_connect@infosys.com', contactPhone: '9840223302', description: 'Next-generation digital services and consulting across 50+ nations.' },
  { name: 'Wipro Limited', industry: 'IT Services', website: 'https://wipro.com', contactPerson: 'Ramesh Krishnan', contactEmail: 'campus.helpdesk@wipro.com', contactPhone: '9840223303', description: 'Information technology, consulting, and business process services.' },
  { name: 'Cognizant (CTS)', industry: 'IT Services', website: 'https://cognizant.com', contactPerson: 'Bhavna Menon', contactEmail: 'campusrelations@cognizant.com', contactPhone: '9840223304', description: 'Digital transformations, engineering services, and cloud modernization.' },
  { name: 'Accenture India', industry: 'Consulting / Tech', website: 'https://accenture.com', contactPerson: 'Sameer Sen', contactEmail: 'campus-queries@accenture.com', contactPhone: '9840223305', description: 'Global management consulting, technology services, and digital innovation.' },
  { name: 'Capgemini', industry: 'IT Services', website: 'https://capgemini.com', contactPerson: 'Swati Deshmukh', contactEmail: 'campus.in@capgemini.com', contactPhone: '9840223306', description: 'Consulting, digital transformation, technology and engineering services.' },
  { name: 'HCLTech', industry: 'IT Services', website: 'https://hcltech.com', contactPerson: 'Prabhat Varma', contactEmail: 'firstcareers@hcltech.com', contactPhone: '9840223307', description: 'Supercharging progress through digital, engineering, and cloud capabilities.' },
  { name: 'LTIMindtree', industry: 'IT Services', website: 'https://ltimindtree.com', contactPerson: 'Anjali Verma', contactEmail: 'campus@ltimindtree.com', contactPhone: '9840223308', description: 'Global technology consulting and digital solutions enterprise.' },
  { name: 'Hexaware Technologies', industry: 'IT Services', website: 'https://hexaware.com', contactPerson: 'Saurabh Tiwari', contactEmail: 'campusrecruitment@hexaware.com', contactPhone: '9840223309', description: 'Automation-led IT services, cloud operations, and digital platforms.' },
  { name: 'Tech Mahindra', industry: 'IT / Telecom', website: 'https://techmahindra.com', contactPerson: 'Vipin Narang', contactEmail: 'connect@techmahindra.com', contactPhone: '9840223310', description: 'Connected world experiences and digital enterprise transformation.' },

  // Investment Banking, Consulting & BFSI
  { name: 'Goldman Sachs', industry: 'Banking / Fintech', website: 'https://goldmansachs.com/careers', contactPerson: 'Radhika Singhal', contactEmail: 'gs-campus@gs.com', contactPhone: '9840334401', description: 'Leading global investment banking, securities, and financial management.' },
  { name: 'Morgan Stanley', industry: 'Banking / Fintech', website: 'https://morganstanley.com/careers', contactPerson: 'Neil D’Souza', contactEmail: 'ms-university@morganstanley.com', contactPhone: '9840334402', description: 'Global financial services firm providing investment banking and wealth management.' },
  { name: 'JPMorgan Chase & Co.', industry: 'Banking / Fintech', website: 'https://jpmorganchase.com/careers', contactPerson: 'Rohit Agnihotri', contactEmail: 'campus-jpmc@jpmchase.com', contactPhone: '9840334403', description: 'Financial services leader in asset management, consumer banking, and markets.' },
  { name: 'Deloitte India', industry: 'Consulting', website: 'https://deloitte.com/in', contactPerson: 'Vandana Mittal', contactEmail: 'campus-deloitte@deloitte.com', contactPhone: '9840334404', description: 'Audit, consulting, financial advisory, risk management, and tax services.' },
  { name: 'PricewaterhouseCoopers (PwC)', industry: 'Consulting', website: 'https://pwc.in/careers', contactPerson: 'Abhishek Roy', contactEmail: 'pwc-campus@pwc.com', contactPhone: '9840334405', description: 'Professional services network providing assurance, advisory, and tax solutions.' },
  { name: 'Ernst & Young (EY)', industry: 'Consulting', website: 'https://ey.com/in/careers', contactPerson: 'Nidhi Bansal', contactEmail: 'eycampus@in.ey.com', contactPhone: '9840334406', description: 'Assurance, tax, transaction, and advisory services globally.' },
  { name: 'KPMG India', industry: 'Consulting', website: 'https://kpmg.com/in', contactPerson: 'Siddharth Chadha', contactEmail: 'kpmg-campus@kpmg.com', contactPhone: '9840334407', description: 'Financial and business advisory, tax, regulatory, and risk services.' },
  { name: 'Barclays Global Service Centre', industry: 'Banking / Tech', website: 'https://barclays.com/careers', contactPerson: 'Monica Sharma', contactEmail: 'barclays-india@barclays.com', contactPhone: '9840334408', description: 'Transatlantic consumer, corporate, and investment bank technological arm.' },
  { name: 'HDFC Bank', industry: 'Finance / Banking', website: 'https://hdfcbank.com/careers', contactPerson: 'Vinod Nair', contactEmail: 'recruitment@hdfcbank.com', contactPhone: '9840334409', description: 'India’s largest private-sector bank with extensive digital fintech adoption.' },
  { name: 'ICICI Bank', industry: 'Finance / Banking', website: 'https://icicicareers.com', contactPerson: 'Kavitha Ramesh', contactEmail: 'talent@icicibank.com', contactPhone: '9840334410', description: 'Leading Indian multinational banking and financial services institution.' },

  // Core Engineering, Automotive & Manufacturing
  { name: 'Robert Bosch Engineering', industry: 'Automotive / Core', website: 'https://bosch.in/careers', contactPerson: 'Markus Weber', contactEmail: 'campus.bosch@in.bosch.com', contactPhone: '9840445501', description: 'Automotive electronics, mobility solutions, IoT, and embedded software.' },
  { name: 'Larsen & Toubro (L&T)', industry: 'Civil / Core Engineering', website: 'https://larsentoubro.com/careers', contactPerson: 'Subramanian G', contactEmail: 'hrd@larsentoubro.com', contactPhone: '9840445502', description: 'Engineering, construction, manufacturing, technology, and financial services.' },
  { name: 'Tata Motors', industry: 'Automotive / Mechanical', website: 'https://tatamotors.com/careers', contactPerson: 'Chetan Jadhav', contactEmail: 'careers@tatamotors.com', contactPhone: '9840445503', description: 'Automobile manufacturing, electric vehicles, and commercial fleet mobility.' },
  { name: 'Siemens India', industry: 'Electrical / Automation', website: 'https://siemens.com/in/careers', contactPerson: 'Ananya Guha', contactEmail: 'campus.siemens@siemens.com', contactPhone: '9840445504', description: 'Electrification, automation, industrial digital software, and smart grids.' },
  { name: 'Schneider Electric', industry: 'Electrical / Energy', website: 'https://se.com/in/careers', contactPerson: 'Dinesh Iyer', contactEmail: 'careers.india@se.com', contactPhone: '9840445505', description: 'Digital transformation of energy management and automation solutions.' },
  { name: 'Texas Instruments', industry: 'Semiconductors / ECE', website: 'https://ti.com/careers', contactPerson: 'Kalyan Sundaram', contactEmail: 'ti-campus@ti.com', contactPhone: '9840445506', description: 'Design and manufacture of analog and embedded processing chips.' },
  { name: 'ABB India', industry: 'Robotics / Automation', website: 'https://abb.com/careers', contactPerson: 'Geetha Natarajan', contactEmail: 'abb-careers@in.abb.com', contactPhone: '9840445507', description: 'Pioneering technology leader in electrification, robotics, and discrete automation.' },
  { name: 'Honeywell India', industry: 'Industrial / Aerospace', website: 'https://honeywell.com/careers', contactPerson: 'Aravind Swaminathan', contactEmail: 'honeywell-campus@honeywell.com', contactPhone: '9840445508', description: 'Aerospace products, building technologies, performance materials, and IoT.' },
  { name: 'Caterpillar India', industry: 'Heavy Machinery / ME', website: 'https://caterpillar.com/careers', contactPerson: 'Joel Thomas', contactEmail: 'campus.cat@cat.com', contactPhone: '9840445509', description: 'Manufacturer of construction and mining equipment, diesel engines, and gas turbines.' },
  { name: 'Ashok Leyland', industry: 'Automotive / ME', website: 'https://ashokleyland.com/careers', contactPerson: 'Muruganathan P', contactEmail: 'careers@ashokleyland.com', contactPhone: '9840445510', description: 'Automotive manufacturing of heavy commercial vehicles, buses, and engines.' },
  { name: 'Tata Elxsi', industry: 'Design / Technology', website: 'https://tataelxsi.com/careers', contactPerson: 'Renuka Joseph', contactEmail: 'talent@tataelxsi.co.in', contactPhone: '9840445511', description: 'Design-led technology services for automotive, broadcast, and healthcare.' },
  { name: 'Titan Company', industry: 'Consumer Goods / Design', website: 'https://titancompany.in/careers', contactPerson: 'Shalini Venkat', contactEmail: 'campus@titan.co.in', contactPhone: '9840445512', description: 'Lifestyle brand across watches, precision engineering, eyewear, and jewelry.' }
];

// Names for Indian Engineering College Demographic
const firstNames = [
  'Aarav', 'Aditi', 'Aditya', 'Aishwarya', 'Akash', 'Amrita', 'Ananya', 'Anish', 'Anjali', 'Arjun',
  'Arun', 'Ashwin', 'Bhavna', 'Chetan', 'Deepa', 'Deepak', 'Dev', 'Dinesh', 'Divya', 'Ganesh',
  'Gautam', 'Geetha', 'Harini', 'Harish', 'Harsh', 'Ishita', 'Janani', 'Kalyan', 'Karthik', 'Kavya',
  'Keerthana', 'Kiran', 'Lakshmi', 'Madhav', 'Manish', 'Meera', 'Mithun', 'Monika', 'Naveen', 'Nidhi',
  'Nikhil', 'Nisha', 'Nitin', 'Pavithra', 'Pooja', 'Pranav', 'Prashant', 'Praveen', 'Preethi', 'Priya',
  'Rahul', 'Rajesh', 'Rakesh', 'Rhea', 'Rishabh', 'Rithika', 'Riya', 'Rohan', 'Rohit', 'Sahil',
  'Sakshi', 'Sameer', 'Sandhya', 'Sanjay', 'Santosh', 'Saravanan', 'Shalini', 'Shiva', 'Shreya', 'Shruti',
  'Siddharth', 'Sneha', 'Soundarya', 'Srinath', 'Subash', 'Sujith', 'Suresh', 'Swati', 'Tanvi', 'Tarun',
  'Tejas', 'Uday', 'Vaishnavi', 'Varun', 'Venkatesh', 'Vidyut', 'Vignesh', 'Vijay', 'Vikas', 'Vikram',
  'Vinay', 'Vishal', 'Vishesh', 'Vivek', 'Yash', 'Yukta', 'Advaith', 'Ahana', 'Dhruv', 'Diya'
];

const lastNames = [
  'Sharma', 'Verma', 'Patel', 'Iyer', 'Nair', 'Reddy', 'Kumar', 'Sundaram', 'Joshi', 'Gupta',
  'Rao', 'Singh', 'Menon', 'Bhat', 'Pillai', 'Agarwal', 'Balaji', 'Swaminathan', 'Subramanian', 'Krishnan',
  'Chopra', 'Saxena', 'Mehta', 'Kulkarni', 'Deshmukh', 'Mittal', 'Bhattacharya', 'Mukherjee', 'Chatterjee', 'Banerjee',
  'Natarajan', 'Ranganathan', 'Chidambaram', 'Ganesan', 'Murugan', 'Venkataraman', 'Mani', 'Anand', 'Chari', 'Somayaji',
  'Bansal', 'Goyal', 'Soni', 'Thakur', 'Chauhan', 'Yadav', 'Dubey', 'Tiwari', 'Pandey', 'Mishra'
];

const departments = ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'ME', 'CE'];

const batches = [
  { batch: '2021-2025', prefix: '21', placementRate: 0.85, isAlumniEligible: true },
  { batch: '2022-2026', prefix: '22', placementRate: 0.72, isAlumniEligible: false },
  { batch: '2023-2027', prefix: '23', placementRate: 0.35, isAlumniEligible: false },
  { batch: '2024-2028', prefix: '24', placementRate: 0.08, isAlumniEligible: false }
];

const deptSkills = {
  CSE: ['React', 'Node.js', 'Python', 'Java', 'Data Structures', 'Docker', 'AWS', 'MongoDB', 'SQL', 'TypeScript', 'Kubernetes'],
  IT: ['React', 'Node.js', 'Angular', 'Cloud Computing', 'PostgreSQL', 'REST APIs', 'Spring Boot', 'Next.js', 'Linux', 'Git'],
  AIDS: ['Python', 'Data Science', 'Machine Learning', 'Pandas', 'NumPy', 'Tableau', 'Power BI', 'Deep Learning', 'SQL', 'Scikit-Learn'],
  AIML: ['Python', 'PyTorch', 'TensorFlow', 'LLMs', 'Computer Vision', 'NLP', 'Reinforcement Learning', 'OpenCV', 'MLOps', 'Transformers'],
  ECE: ['Embedded C', 'VLSI Design', 'Verilog', 'Microcontrollers', 'IoT', 'MATLAB', 'Signal Processing', 'Arduino', 'Python', 'PCB Design'],
  EEE: ['Power Systems', 'PLC & SCADA', 'MATLAB', 'Electric Drives', 'Renewable Energy', 'IoT', 'C Programming', 'Power Electronics', 'AutoCAD Electrical'],
  ME: ['AutoCAD', 'SolidWorks', 'ANSYS', 'CATIA', 'Finite Element Analysis', 'GD&T', 'CNC Programming', 'Thermodynamics', '3D Printing'],
  CE: ['AutoCAD Civil', 'Revit Architecture', 'STAAD Pro', 'ETABS', 'GIS & Remote Sensing', 'Surveying', 'Structural Design', 'MS Project']
};

const deptRoles = {
  CSE: ['Software Engineer', 'Full Stack Developer', 'Cloud Engineer', 'DevOps Engineer', 'Backend Developer', 'Frontend Developer', 'System Architect'],
  IT: ['Systems Engineer', 'Web Applications Engineer', 'Cloud Solutions Analyst', 'Application Developer', 'Technical Consultant'],
  AIDS: ['Data Scientist', 'Data Analyst', 'Business Intelligence Engineer', 'Data Engineer', 'Big Data Developer'],
  AIML: ['AI Engineer', 'Machine Learning Engineer', 'Computer Vision Specialist', 'NLP Engineer', 'Deep Learning Researcher'],
  ECE: ['Embedded Software Engineer', 'VLSI Verification Engineer', 'Hardware Systems Engineer', 'IoT Solutions Specialist', 'Firmware Engineer'],
  EEE: ['Electrical Systems Engineer', 'Automation & Controls Engineer', 'Power Grid Specialist', 'SCADA Engineer', 'Energy Analyst'],
  ME: ['Design Engineer', 'Product Development Engineer', 'CAD/CAM Specialist', 'CAE Simulation Engineer', 'Quality Assurance Engineer'],
  CE: ['Structural Design Engineer', 'Project Planning Engineer', 'BIM Modeler', 'Site Operations Engineer', 'Civil Estimation Engineer']
};

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubset(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomNumber(min, max, decimals = 1) {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

async function runSeed() {
  console.log('🚀 Starting Large-Scale Seeding: 2000 Students & 50 Companies...\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log(`✅ Connected to MongoDB at: ${MONGO_URI}\n`);

    // Clear existing students, companies, placements, alumni (Admin is preserved!)
    await Student.deleteMany({});
    await Company.deleteMany({});
    await Placement.deleteMany({});
    await Alumni.deleteMany({});
    console.log('🧹 Cleaned existing student, company, placement, and alumni data.\n');

    // 1. Seed 50 Companies
    console.log('🏢 Seeding 50 Companies...');
    const createdCompanies = await Company.insertMany(companiesData);
    console.log(`✓ Inserted ${createdCompanies.length} companies successfully.\n`);

    // Separate companies by category for realistic department-to-company placements
    const techProductCompanies = createdCompanies.filter(c => c.industry.includes('Product') || c.industry.includes('E-Commerce') || c.industry.includes('Fintech'));
    const techServicesCompanies = createdCompanies.filter(c => c.industry.includes('Services') || c.industry.includes('Enterprise'));
    const consultingFinanceCompanies = createdCompanies.filter(c => c.industry.includes('Consulting') || c.industry.includes('Banking') || c.industry.includes('Finance'));
    const coreEngCompanies = createdCompanies.filter(c => c.industry.includes('Automotive') || c.industry.includes('Core') || c.industry.includes('Electrical') || c.industry.includes('Mechanical') || c.industry.includes('Semiconductors'));

    // 2. Generate 2000 Students
    console.log('👨‍🎓 Generating 2,000 Students across 8 Departments & 4 Batches...');
    const studentsToInsert = [];
    const studentPlacementMeta = []; // Stores helper data to generate placement records next

    // 2000 students = 500 students per batch
    // In each batch, 500 students distributed over 8 departments (~62-63 students per dept)
    let globalIndex = 1;

    for (const b of batches) {
      for (const dept of departments) {
        // Distribute: CSE, IT, AIDS, AIML have slightly higher intake
        const deptCount = ['CSE', 'IT', 'ECE'].includes(dept) ? 75 : ['AIDS', 'AIML'].includes(dept) ? 65 : 55;
        
        for (let i = 1; i <= deptCount; i++) {
          if (studentsToInsert.length >= 2000) break;

          const fName = getRandomElement(firstNames);
          const lName = getRandomElement(lastNames);
          const fullName = `${fName} ${lName}`;
          
          // Roll Number format: e.g. 21CSE001, 22AIDS045
          const rollNumber = `${b.prefix}${dept}${String(i).padStart(3, '0')}`;
          const email = `${fName.toLowerCase()}.${lName.toLowerCase()}.${rollNumber.toLowerCase()}@skcet.ac.in`;
          
          // Valid 10-digit phone
          const phone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
          
          // Realistic CGPA bell curve between 6.2 and 9.9
          const cgpa = getRandomNumber(6.4, 9.8, 2);
          
          // Select 3 to 5 realistic skills
          const skills = getRandomSubset(deptSkills[dept], Math.floor(Math.random() * 3) + 3);

          // Decide placement status based on batch rate and CGPA
          // Higher CGPA has higher chance of placement
          const cgpaFactor = cgpa >= 8.5 ? 1.25 : cgpa >= 7.5 ? 1.0 : 0.7;
          const isPlaced = Math.random() < (b.placementRate * cgpaFactor);

          studentsToInsert.push({
            name: fullName,
            rollNumber,
            email,
            phone,
            department: dept,
            batch: b.batch,
            cgpa,
            skills,
            status: isPlaced ? 'placed' : 'not_placed',
            placementId: null
          });

          studentPlacementMeta.push({
            rollNumber,
            isPlaced,
            batchMeta: b,
            department: dept,
            cgpa
          });

          globalIndex++;
        }
      }
    }

    // Top off to ensure exactly 2000 students
    while (studentsToInsert.length < 2000) {
      const b = getRandomElement(batches);
      const dept = getRandomElement(departments);
      const fName = getRandomElement(firstNames);
      const lName = getRandomElement(lastNames);
      const rollNumber = `${b.prefix}${dept}${String(globalIndex).padStart(4, '0')}`;
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}.${rollNumber.toLowerCase()}@skcet.ac.in`;
      const phone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
      const cgpa = getRandomNumber(6.5, 9.5, 2);
      const isPlaced = Math.random() < b.placementRate;

      studentsToInsert.push({
        name: `${fName} ${lName}`,
        rollNumber,
        email,
        phone,
        department: dept,
        batch: b.batch,
        cgpa,
        skills: getRandomSubset(deptSkills[dept], 4),
        status: isPlaced ? 'placed' : 'not_placed',
        placementId: null
      });

      studentPlacementMeta.push({
        rollNumber,
        isPlaced,
        batchMeta: b,
        department: dept,
        cgpa
      });

      globalIndex++;
    }

    console.log(`✓ Generated ${studentsToInsert.length} student data objects.`);

    // Insert students in bulk
    const insertedStudents = await Student.insertMany(studentsToInsert);
    console.log(`✓ Inserted ${insertedStudents.length} students into MongoDB.\n`);

    // Create lookup map
    const studentMap = new Map();
    insertedStudents.forEach(s => studentMap.set(s.rollNumber, s));

    // 3. Generate Placements and Alumni
    console.log('🎯 Generating Placements & Alumni for placed students...');
    const placementsToInsert = [];
    const alumniToInsert = [];
    const companyPlacedCount = new Map();

    const companyShiftRoles = [
      'Senior Software Engineer', 'Lead Consultant', 'Product Manager', 
      'Senior Data Engineer', 'Technical Lead', 'Staff Software Engineer'
    ];

    for (const meta of studentPlacementMeta) {
      if (!meta.isPlaced) continue;

      const studentDoc = studentMap.get(meta.rollNumber);
      if (!studentDoc) continue;

      // Select suitable company based on department and student CGPA
      let targetCompanyPool = [];
      if (['CSE', 'IT', 'AIDS', 'AIML'].includes(meta.department)) {
        if (meta.cgpa >= 8.8) {
          targetCompanyPool = [...techProductCompanies, ...consultingFinanceCompanies];
        } else if (meta.cgpa >= 7.8) {
          targetCompanyPool = [...techProductCompanies, ...techServicesCompanies, ...consultingFinanceCompanies];
        } else {
          targetCompanyPool = techServicesCompanies;
        }
      } else if (['ECE', 'EEE'].includes(meta.department)) {
        if (meta.cgpa >= 8.5) {
          targetCompanyPool = [...coreEngCompanies, ...techProductCompanies];
        } else {
          targetCompanyPool = [...coreEngCompanies, ...techServicesCompanies];
        }
      } else { // ME, CE
        if (meta.cgpa >= 8.0) {
          targetCompanyPool = [...coreEngCompanies, ...consultingFinanceCompanies];
        } else {
          targetCompanyPool = [...coreEngCompanies, ...techServicesCompanies];
        }
      }

      if (targetCompanyPool.length === 0) targetCompanyPool = createdCompanies;
      const selectedCompany = getRandomElement(targetCompanyPool);

      // Package based on company tier & CGPA
      let packageLPA;
      if (techProductCompanies.some(c => c._id.equals(selectedCompany._id))) {
        packageLPA = getRandomNumber(12.0, 44.0, 1);
      } else if (consultingFinanceCompanies.some(c => c._id.equals(selectedCompany._id))) {
        packageLPA = getRandomNumber(8.5, 24.0, 1);
      } else if (coreEngCompanies.some(c => c._id.equals(selectedCompany._id))) {
        packageLPA = getRandomNumber(6.0, 18.0, 1);
      } else {
        // Tech services
        packageLPA = getRandomNumber(4.0, 9.5, 1);
      }

      // Role selection
      const possibleRoles = deptRoles[meta.department] || ['Software Engineer'];
      const role = getRandomElement(possibleRoles);

      // Placement status: 
      // 2021-2025 batch: joined
      // 2022-2026 batch: accepted / joined
      // 2023-2027 batch: offered / accepted
      // 2024-2028 batch: offered
      let pStatus = 'offered';
      if (meta.batchMeta.prefix === '21') pStatus = 'joined';
      else if (meta.batchMeta.prefix === '22') pStatus = Math.random() < 0.7 ? 'joined' : 'accepted';
      else if (meta.batchMeta.prefix === '23') pStatus = Math.random() < 0.6 ? 'accepted' : 'offered';
      else pStatus = 'offered';

      // Placement Date
      const year = 2020 + parseInt(meta.batchMeta.prefix, 10) + 3; // e.g. 21 -> 2024, 22 -> 2025
      const month = Math.floor(Math.random() * 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1;
      const placementDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);

      const placementObj = {
        studentId: studentDoc._id,
        companyId: selectedCompany._id,
        role,
        package: packageLPA,
        placementDate,
        offerType: Math.random() < 0.85 ? 'on_campus' : 'off_campus',
        status: pStatus
      };

      placementsToInsert.push(placementObj);

      // Count placed per company
      companyPlacedCount.set(
        selectedCompany._id.toString(),
        (companyPlacedCount.get(selectedCompany._id.toString()) || 0) + 1
      );
    }

    console.log(`✓ Prepared ${placementsToInsert.length} placement records.`);
    const insertedPlacements = await Placement.insertMany(placementsToInsert);
    console.log(`✓ Inserted ${insertedPlacements.length} placements.`);

    // 4. Update Students with their placementId
    console.log('🔄 Linking placement IDs back to students...');
    const bulkStudentOps = insertedPlacements.map(p => ({
      updateOne: {
        filter: { _id: p.studentId },
        update: { $set: { placementId: p._id, status: 'placed' } }
      }
    }));
    await Student.bulkWrite(bulkStudentOps);
    console.log('✓ Successfully linked all student placement IDs.');

    // 5. Update Company studentsPlaced counters
    console.log('🔄 Updating company placement counters...');
    const bulkCompanyOps = [];
    companyPlacedCount.forEach((count, companyIdStr) => {
      bulkCompanyOps.push({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(companyIdStr) },
          update: { $set: { studentsPlaced: count } }
        }
      });
    });
    if (bulkCompanyOps.length > 0) {
      await Company.bulkWrite(bulkCompanyOps);
    }
    console.log('✓ Successfully updated company placement metrics.');

    // 6. Generate Alumni for graduated batch (2021-2025)
    console.log('🎓 Generating Alumni records for graduated students (2021-2025)...');
    for (const p of insertedPlacements) {
      const studentDoc = studentMap.get(
        insertedStudents.find(s => s._id.equals(p.studentId))?.rollNumber
      );
      if (!studentDoc || studentDoc.batch !== '2021-2025') continue;

      const comp = createdCompanies.find(c => c._id.equals(p.companyId));
      const compName = comp ? comp.name : 'Tech Corp';

      // 25% of alumni have shifted companies after 1-2 years
      const hasShifted = Math.random() < 0.25;
      let currentCompany = compName;
      let currentRole = p.role;
      const companyHistory = [];

      if (hasShifted) {
        // Pick a different company
        const otherCompanies = createdCompanies.filter(c => !c._id.equals(p.companyId));
        const newComp = getRandomElement(otherCompanies);
        currentCompany = newComp.name;
        currentRole = getRandomElement(companyShiftRoles);
        companyHistory.push({
          company: compName,
          role: p.role,
          changedAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000))
        });
      }

      alumniToInsert.push({
        studentId: studentDoc._id,
        placementId: p._id,
        companyId: p.companyId,
        currentCompany,
        currentRole,
        linkedIn: `https://linkedin.com/in/${studentDoc.name.toLowerCase().replace(/[^a-z]/g, '')}-${studentDoc.rollNumber.toLowerCase()}`,
        graduationYear: '2025',
        department: studentDoc.department,
        isActive: true,
        companyShifted: hasShifted,
        companyHistory
      });
    }

    if (alumniToInsert.length > 0) {
      const insertedAlumni = await Alumni.insertMany(alumniToInsert);
      console.log(`✓ Inserted ${insertedAlumni.length} alumni records.`);
    }

    // 7. Verification & Summary Report
    const totalStudents = await Student.countDocuments();
    const placedStudents = await Student.countDocuments({ status: 'placed' });
    const totalCompanies = await Company.countDocuments();
    const totalPlacements = await Placement.countDocuments();
    const totalAlumni = await Alumni.countDocuments();

    console.log('\n======================================================');
    console.log('       🎉 SEEDING COMPLETED SUCCESSFULLY! 🎉         ');
    console.log('======================================================');
    console.log(` 👨‍🎓 Total Students    : ${totalStudents}`);
    console.log(` 🎯 Placed Students   : ${placedStudents} (${((placedStudents / totalStudents) * 100).toFixed(1)}%)`);
    console.log(` ⌛ Unplaced Students : ${totalStudents - placedStudents}`);
    console.log(` 🏢 Total Companies   : ${totalCompanies}`);
    console.log(` 📄 Total Placements  : ${totalPlacements}`);
    console.log(` 🎓 Total Alumni      : ${totalAlumni}`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB. You can now refresh the CRM Dashboard!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runSeed();
