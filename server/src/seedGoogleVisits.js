const mongoose = require('mongoose');
const Company = require('./models/Company');
const Drive = require('./models/Drive');
const Placement = require('./models/Placement');
const Student = require('./models/Student');

async function seedGoogleVisits() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/placement-crm');
    console.log('Connected to MongoDB');

    let google = await Company.findOne({ name: { $regex: /^google$/i } });
    if (!google) {
      console.log('Google not found by exact regex, searching contains...');
      google = await Company.findOne({ name: { $regex: /google/i } });
    }

    if (!google) {
      console.log('Creating Google company...');
      google = await Company.create({
        name: 'Google',
        industry: 'IT',
        website: 'https://careers.google.com',
        location: 'Bangalore, Karnataka',
        description: 'Global technology leader in search, cloud, AI, and systems software.',
        visits: 2,
        contactPerson: 'Deva R',
        contactRole: 'Campus Hiring Lead / HR Manager',
        contactEmail: 'campus-in@google.com',
        contactPhone: '9840117777',
        studentsPlaced: 10,
      });
    }

    // Configure visitsList with distinct contacts for Visit 1 and Visit 2
    google.visits = 2;
    google.contactPerson = 'Deva R';
    google.contactRole = 'Campus Hiring Lead / HR Manager';
    google.contactEmail = 'campus-in@google.com';
    google.contactPhone = '9840117777';
    google.location = 'Google Campus, Bangalore';
    google.visitsList = [
      {
        visitNumber: 1,
        contactPerson: 'Priya Sharma / Sundararajan',
        contactRole: 'Director - University Relations',
        contactEmail: 'university-hiring@google.com',
        contactPhone: '9840117770',
        location: 'Google Campus, Bangalore',
        description: 'First campus recruitment drive for core SWE and Systems engineering.',
        date: new Date('2026-08-15'),
      },
      {
        visitNumber: 2,
        contactPerson: 'Deva R',
        contactRole: 'Campus Hiring Lead / HR Manager',
        contactEmail: 'campus-in@google.com',
        contactPhone: '9840117777',
        location: 'Google Campus, Bangalore',
        description: 'Second campus recruitment drive for Cloud and Data & AI roles.',
        date: new Date('2026-10-18'),
      },
    ];
    await google.save();
    console.log('Updated Google company visitsList successfully!');

    // Fetch students to link
    const allStudents = await Student.find().limit(35);
    console.log(`Found ${allStudents.length} students in DB`);

    // Ensure Drive 1 (Visit 1) is properly configured
    let drive1 = await Drive.findOne({ companyId: google._id, visitNumber: 1 });
    if (!drive1) {
      drive1 = await Drive.findOne({
        $or: [{ companyId: google._id }, { companyName: { $regex: /google/i } }],
      });
    }

    if (drive1) {
      drive1.visitNumber = 1;
      drive1.role = 'Software Engineer (SWE)';
      drive1.roles = ['Software Engineer (SWE)', 'Site Reliability Engineer (SRE)'];
      drive1.package = 34.5;
      await drive1.save();
      console.log('Updated Drive 1 for Google (visitNumber: 1, multi-roles)');
    } else {
      drive1 = await Drive.create({
        companyId: google._id,
        companyName: 'Google',
        title: 'Google Campus Recruitment Drive 2026 (Visit 1)',
        role: 'Software Engineer (SWE)',
        roles: ['Software Engineer (SWE)', 'Site Reliability Engineer (SRE)'],
        package: 34.5,
        jobLocation: 'Bangalore / Hyderabad',
        visitNumber: 1,
        eligibleDepartments: ['CSE', 'IT', 'AIDS', 'AIML', 'ECE'],
        eligibleBatches: ['2022-2026'],
        minCgpa: 8.0,
        maxCurrentArrears: 0,
        driveDate: new Date('2026-08-20'),
        registrationDeadline: new Date('2026-08-18'),
        status: 'Completed',
        registeredStudents: allStudents.slice(0, 20).map((s) => s._id),
      });
      console.log('Created Drive 1 for Google (visitNumber: 1)');
    }

    // Update placements associated with Drive 1 or Google to have visitNumber: 1
    const placedDrive1Ids = (drive1.finalSelectedStudents || []).map((f) => f.studentId?.toString());
    await Placement.updateMany(
      {
        companyId: google._id,
        $or: [
          { driveId: drive1._id },
          { studentId: { $in: placedDrive1Ids } },
          { visitNumber: { $exists: false } },
        ],
      },
      { $set: { visitNumber: 1, driveId: drive1._id } }
    );

    // Setup cohort for Drive 1 (24 students) and Drive 2 (16 students)
    const v1PlacedRolls = ['22CSE002', '22CSE003', '22AIML003', '22ME002', '21ME002', '21AIDS004'];
    const v1Placed = await Student.find({ rollNumber: { $in: v1PlacedRolls } });

    const v2PlacedRolls = ['21AIDS001', '21AIDS002', '21AIDS003', '21AIDS004'];
    const v2Placed = await Student.find({ rollNumber: { $in: v2PlacedRolls } });

    const v1Other = await Student.find({
      rollNumber: { $nin: [...v1PlacedRolls, ...v2PlacedRolls] },
    }).limit(18);

    const drive1Students = [...v1Placed, ...v1Other];
    const d1Rolls = drive1Students.map((s) => s.rollNumber);

    const v2Other = await Student.find({
      rollNumber: { $nin: [...d1Rolls, ...v2PlacedRolls] },
    }).limit(12);

    const drive2Students = [...v2Placed, ...v2Other];

    console.log(`Drive 1 students: ${drive1Students.length}, Drive 2 students: ${drive2Students.length}`);

    // Update Drive 1
    const d1Selected = v1Placed.map((s) => ({
      studentId: s._id,
      role: 'Software Engineer',
      package: 34.5,
      placementDate: s.rollNumber === '21ME002' || s.rollNumber === '21AIDS004' ? new Date('2025-02-15') : new Date('2026-03-01'),
      status: 'placed',
    }));

    const d1r1Candidates = [
      ...v1Placed.map((s) => ({ studentId: s._id, status: 'shortlisted', remarks: 'Cleared Round 1 Assessment' })),
      ...v1Other.slice(0, 12).map((s) => ({ studentId: s._id, status: 'shortlisted', remarks: 'Cleared Round 1 Assessment' })),
      ...v1Other.slice(12, 18).map((s) => ({ studentId: s._id, status: 'eliminated', remarks: 'Did not clear cutoff' })),
    ];

    const d1r2Candidates = [
      ...v1Placed.map((s) => ({ studentId: s._id, status: 'shortlisted', remarks: 'Advanced to Management Discussion' })),
      ...v1Other.slice(0, 12).map((s) => ({ studentId: s._id, status: 'eliminated', remarks: 'Eliminated in Technical Interview' })),
    ];

    const d1r3Candidates = v1Placed.map((s) => ({
      studentId: s._id,
      status: 'selected',
      remarks: 'Offered Software Engineer (₹34.5 LPA)',
    }));

    await Drive.updateOne(
      { _id: drive1._id },
      {
        $set: {
          title: 'Google Campus Recruitment Drive 2026',
          role: 'Software Engineer (SWE)',
          roles: ['Software Engineer (SWE)', 'Site Reliability Engineer (SRE)'],
          package: 34.5,
          visitNumber: 1,
          status: 'Ongoing',
          driveDate: new Date('2026-10-19'),
          registeredStudents: drive1Students.map((s) => s._id),
          finalSelectedStudents: d1Selected,
          rounds: [
            {
              roundNumber: 1,
              name: 'Round 1: Online Assessment / Aptitude',
              type: 'Online Assessment',
              candidates: d1r1Candidates,
            },
            {
              roundNumber: 2,
              name: 'Round 2: Technical Interview & Problem Solving',
              type: 'Technical Interview',
              candidates: d1r2Candidates,
            },
            {
              roundNumber: 3,
              name: 'Round 3: HR & Management Discussion',
              type: 'HR Interview',
              candidates: d1r3Candidates,
            },
          ],
        },
      }
    );

    // Update Drive 2
    let drive2 = await Drive.findOne({ companyId: google._id, visitNumber: 2 });
    if (!drive2) {
      drive2 = await Drive.create({
        companyId: google._id,
        companyName: 'Google',
        title: 'Google Second Recruitment Drive 2026 (Visit 2)',
        visitNumber: 2,
        role: 'Cloud Associate Consultant',
        package: 36.5,
      });
    }

    const d2Selected = [
      {
        studentId: v2Placed.find((s) => s.rollNumber === '21AIDS001')._id,
        role: 'Cloud Associate Consultant',
        package: 36.5,
        placementDate: new Date('2026-10-28'),
        status: 'placed',
      },
      {
        studentId: v2Placed.find((s) => s.rollNumber === '21AIDS002')._id,
        role: 'Data & AI Engineer',
        package: 36.5,
        placementDate: new Date('2026-10-28'),
        status: 'placed',
      },
      {
        studentId: v2Placed.find((s) => s.rollNumber === '21AIDS003')._id,
        role: 'Cloud Associate Consultant',
        package: 36.5,
        placementDate: new Date('2026-10-28'),
        status: 'placed',
      },
      {
        studentId: v2Placed.find((s) => s.rollNumber === '21AIDS004')._id,
        role: 'Data & AI Engineer',
        package: 36.5,
        placementDate: new Date('2026-10-28'),
        status: 'placed',
      },
    ];

    const d2r1Candidates = [
      ...v2Placed.map((s) => ({ studentId: s._id, status: 'shortlisted', remarks: 'Top percentile in Cloud/AI assessment' })),
      ...v2Other.map((s) => ({ studentId: s._id, status: 'eliminated', remarks: 'Eliminated in Round 1' })),
    ];

    const d2r2Candidates = v2Placed.map((s) => ({
      studentId: s._id,
      status: 'selected',
      remarks: 'Offered Specialized Role (₹36.5 LPA)',
    }));

    await Drive.updateOne(
      { _id: drive2._id },
      {
        $set: {
          title: 'Google Second Recruitment Drive 2026 (Visit 2)',
          role: 'Cloud Associate Consultant',
          roles: ['Cloud Associate Consultant', 'Data & AI Engineer'],
          package: 36.5,
          visitNumber: 2,
          status: 'Ongoing',
          driveDate: new Date('2026-10-25'),
          registeredStudents: drive2Students.map((s) => s._id),
          finalSelectedStudents: d2Selected,
          rounds: [
            {
              roundNumber: 1,
              name: 'Cloud & Algorithmic Assessment',
              type: 'Online Assessment',
              candidates: d2r1Candidates,
            },
            {
              roundNumber: 2,
              name: 'Technical & System Architecture Interview',
              type: 'Technical Interview',
              candidates: d2r2Candidates,
            },
          ],
        },
      }
    );

    // Update placements driveId references
    await Placement.updateMany({ companyId: google._id, visitNumber: 1 }, { $set: { driveId: drive1._id } });
    await Placement.updateMany({ companyId: google._id, visitNumber: 2 }, { $set: { driveId: drive2._id } });

    // Update Google total placements count
    const totalPlaced = await Placement.countDocuments({ companyId: google._id });
    google.studentsPlaced = totalPlaced;
    await google.save();

    console.log(`Successfully calibrated Google with 2 visits! Total Placements: ${totalPlaced}`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding Google visits:', err);
    process.exit(1);
  }
}

seedGoogleVisits();
