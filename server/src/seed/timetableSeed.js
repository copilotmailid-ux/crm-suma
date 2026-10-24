// Official Placement Faculty and Conflict-Free Multi-Department Timetable Seed
const DEFAULT_FACULTIES = [
  {
    name: 'Dr. K. Ramesh',
    facultyCode: 'FAC-CSE-01',
    department: 'CSE',
    designation: 'Professor & Placement Coordinator',
    specialization: 'Data Structures & Algorithms',
    color: '#2563eb',
  },
  {
    name: 'Prof. M. Suresh',
    facultyCode: 'FAC-IT-02',
    department: 'IT',
    designation: 'Associate Professor',
    specialization: 'Full Stack & Web Technologies',
    color: '#0891b2',
  },
  {
    name: 'Mrs. S. Divya',
    facultyCode: 'FAC-AD-03',
    department: 'AIDS',
    designation: 'Assistant Professor',
    specialization: 'Python & Machine Learning',
    color: '#7c3aed',
  },
  {
    name: 'Dr. P. Senthil Kumar',
    facultyCode: 'FAC-ECE-04',
    department: 'ECE',
    designation: 'Associate Professor',
    specialization: 'Embedded Systems & IoT',
    color: '#d97706',
  },
  {
    name: 'Prof. V. Karthik',
    facultyCode: 'FAC-EEE-05',
    department: 'EEE',
    designation: 'Assistant Professor',
    specialization: 'Circuit Theory & Power Systems',
    color: '#059669',
  },
  {
    name: 'Prof. A. Balaji',
    facultyCode: 'FAC-ME-06',
    department: 'MECH',
    designation: 'Assistant Professor',
    specialization: 'Design & Automation',
    color: '#ea580c',
  },
  {
    name: 'Mrs. R. Priya',
    facultyCode: 'FAC-CE-07',
    department: 'CE',
    designation: 'Assistant Professor',
    specialization: 'Structural Engineering',
    color: '#dc2626',
  },
  {
    name: 'Mr. N. Anand',
    facultyCode: 'FAC-TR-08',
    department: 'Placement',
    designation: 'Lead Placement Trainer',
    specialization: 'Quantitative Aptitude & Logical Reasoning',
    color: '#4f46e5',
  },
  {
    name: 'Ms. T. Meena',
    facultyCode: 'FAC-TR-09',
    department: 'Placement',
    designation: 'Soft Skills Trainer',
    specialization: 'Verbal Ability & Interview Prep',
    color: '#db2777',
  },
];

// Multi-Department Timetable Slots across all 6 Days and 7 Periods
// RULE: Every staff is assigned to AT MOST ONE slot per (day, period). ZERO collisions!
const DEFAULT_SLOTS = [
  // ==================== MON ====================
  // MON P1: 4 distinct departments running concurrently
  { day: 'MON', period: 1, span: 1, className: 'I- CSE', department: 'CSE', year: '1', facultyName: 'Dr. K. Ramesh', topic: 'Python Programming Fundamentals' },
  { day: 'MON', period: 1, span: 1, className: 'II- IT', department: 'IT', year: '2', facultyName: 'Prof. M. Suresh', topic: 'Object-Oriented Programming & C++' },
  { day: 'MON', period: 1, span: 1, className: 'III- EEE', department: 'EEE', year: '3', facultyName: 'Prof. V. Karthik', topic: 'Circuit Theory & Power Systems' },
  { day: 'MON', period: 1, span: 1, className: 'I- AIDS', department: 'AIDS', year: '1', facultyName: 'Mrs. S. Divya', topic: 'Mathematical Foundations & Logic' },

  // MON P2
  { day: 'MON', period: 2, span: 1, className: 'I- IT', department: 'IT', year: '1', facultyName: 'Prof. M. Suresh', topic: 'Computer Fundamentals & C Programming' },
  { day: 'MON', period: 2, span: 1, className: 'II- CSE', department: 'CSE', year: '2', facultyName: 'Dr. K. Ramesh', topic: 'Data Structures Foundation & Algorithms' },
  { day: 'MON', period: 2, span: 1, className: 'II- ECE', department: 'ECE', year: '2', facultyName: 'Dr. P. Senthil Kumar', topic: 'Digital Electronics & Logic Circuits' },
  { day: 'MON', period: 2, span: 1, className: 'III- MECH', department: 'MECH', year: '3', facultyName: 'Prof. A. Balaji', topic: 'Thermal Engineering & Aptitude' },

  // MON P3
  { day: 'MON', period: 3, span: 1, className: 'III- EEE', department: 'EEE', year: '3', facultyName: 'Prof. V. Karthik', topic: 'Circuit Theory & Technical Aptitude' },
  { day: 'MON', period: 3, span: 1, className: 'III- CE', department: 'CE', year: '3', facultyName: 'Mrs. R. Priya', topic: 'Surveying & Structural Analysis' },
  { day: 'MON', period: 3, span: 1, className: 'II- AD', department: 'AIDS', year: '2', facultyName: 'Mrs. S. Divya', topic: 'Python Programming & Problem Solving' },

  // MON P4
  { day: 'MON', period: 4, span: 1, className: 'II- MECH', department: 'MECH', year: '2', facultyName: 'Prof. A. Balaji', topic: 'Engineering Mechanics & Aptitude' },
  { day: 'MON', period: 4, span: 1, className: 'II- CE', department: 'CE', year: '2', facultyName: 'Mrs. R. Priya', topic: 'Construction Materials & Aptitude' },
  { day: 'MON', period: 4, span: 1, className: 'IV- CSE', department: 'CSE', year: '4', facultyName: 'Dr. K. Ramesh', topic: 'Product Company DSA & System Design Prep' },
  { day: 'MON', period: 4, span: 1, className: 'I- ECE', department: 'ECE', year: '1', facultyName: 'Dr. P. Senthil Kumar', topic: 'Electronic Devices & Circuits' },

  // MON P5
  { day: 'MON', period: 5, span: 1, className: 'III- CSE', department: 'CSE', year: '3', facultyName: 'Dr. K. Ramesh', topic: 'Competitive Programming & DSA' },
  { day: 'MON', period: 5, span: 1, className: 'II- EEE', department: 'EEE', year: '2', facultyName: 'Prof. V. Karthik', topic: 'Electrical Machines & Technical Fundamentals' },
  { day: 'MON', period: 5, span: 1, className: 'IV - EEE, CE, & MECH', department: 'Placement', year: '4', facultyName: 'Mr. N. Anand', topic: 'Quantitative Aptitude & Core Interview Prep' },

  // MON P6
  { day: 'MON', period: 6, span: 1, className: 'IV- ECE', department: 'ECE', year: '4', facultyName: 'Dr. P. Senthil Kumar', topic: 'Embedded Systems & Core Assessment' },
  { day: 'MON', period: 6, span: 1, className: 'III- AD', department: 'AIDS', year: '3', facultyName: 'Mrs. S. Divya', topic: 'Machine Learning & Predictive Modeling' },
  { day: 'MON', period: 6, span: 1, className: 'IV - EEE, CE, & MECH', department: 'Placement', year: '4', facultyName: 'Ms. T. Meena', topic: 'Verbal Ability & Soft Skills Interview Prep' },

  // MON P7
  { day: 'MON', period: 7, span: 1, className: 'II- ECE', department: 'ECE', year: '2', facultyName: 'Dr. P. Senthil Kumar', topic: 'Microprocessors & Interfacing' },
  { day: 'MON', period: 7, span: 1, className: 'III- EE', department: 'EEE', year: '3', facultyName: 'Prof. V. Karthik', topic: 'Power Electronics & Control Systems' },
  { day: 'MON', period: 7, span: 1, className: 'I- CE', department: 'CE', year: '1', facultyName: 'Mrs. R. Priya', topic: 'Building Materials & Applied Mechanics' },

  // ==================== TUE ====================
  // TUE P1: Note: Prof. M. Suresh is FREE here (NOT assigned on TUE P1)
  { day: 'TUE', period: 1, span: 1, className: 'I- EEE', department: 'EEE', year: '1', facultyName: 'Prof. V. Karthik', topic: 'Engineering Physics & Electrical Basics' },
  { day: 'TUE', period: 1, span: 1, className: 'II- CSE', department: 'CSE', year: '2', facultyName: 'Dr. K. Ramesh', topic: 'Object Oriented Programming with Java' },
  { day: 'TUE', period: 1, span: 1, className: 'I- MECH', department: 'MECH', year: '1', facultyName: 'Prof. A. Balaji', topic: 'Engineering Graphics & Modeling' },

  // TUE P2: Note: Prof. M. Suresh is FREE here too
  { day: 'TUE', period: 2, span: 1, className: 'I- CSE', department: 'CSE', year: '1', facultyName: 'Dr. K. Ramesh', topic: 'Problem Solving and Algorithmic Thinking' },
  { day: 'TUE', period: 2, span: 1, className: 'II- ECE', department: 'ECE', year: '2', facultyName: 'Dr. P. Senthil Kumar', topic: 'Signals and Systems' },
  { day: 'TUE', period: 2, span: 1, className: 'III- CE', department: 'CE', year: '3', facultyName: 'Mrs. R. Priya', topic: 'Structural Analysis & Design' },

  // TUE P3: Prof. M. Suresh is assigned to II- IT
  { day: 'TUE', period: 3, span: 1, className: 'II- IT', department: 'IT', year: '2', facultyName: 'Prof. M. Suresh', topic: 'C++ & Object-Oriented Programming' },
  { day: 'TUE', period: 3, span: 1, className: 'II- AD', department: 'AIDS', year: '2', facultyName: 'Mrs. S. Divya', topic: 'Data Analysis with Pandas & Numpy' },
  { day: 'TUE', period: 3, span: 1, className: 'III- EEE', department: 'EEE', year: '3', facultyName: 'Prof. V. Karthik', topic: 'Transmission and Distribution' },
  { day: 'TUE', period: 3, span: 1, className: 'II- MECH', department: 'MECH', year: '2', facultyName: 'Prof. A. Balaji', topic: 'Engineering Mechanics & Aptitude' },

  // TUE P4
  { day: 'TUE', period: 4, span: 1, className: 'II- MECH', department: 'MECH', year: '2', facultyName: 'Prof. A. Balaji', topic: 'Engineering Mechanics & Aptitude' },
  { day: 'TUE', period: 4, span: 1, className: 'II- CE', department: 'CE', year: '2', facultyName: 'Mrs. R. Priya', topic: 'Fluid Mechanics & Hydraulics' },
  { day: 'TUE', period: 4, span: 1, className: 'I- ECE', department: 'ECE', year: '1', facultyName: 'Dr. P. Senthil Kumar', topic: 'Basic Electronics & Network Theory' },

  // TUE P5
  { day: 'TUE', period: 5, span: 1, className: 'II- AD', department: 'AIDS', year: '2', facultyName: 'Mrs. S. Divya', topic: 'Python Programming & Problem Solving' },
  { day: 'TUE', period: 5, span: 1, className: 'III- CSE', department: 'CSE', year: '3', facultyName: 'Dr. K. Ramesh', topic: 'Advanced Algorithms & Dynamic Programming' },
  { day: 'TUE', period: 5, span: 1, className: 'IV - EEE, CE, & MECH', department: 'Placement', year: '4', facultyName: 'Ms. T. Meena', topic: 'Business English & Group Discussion' },

  // TUE P6
  { day: 'TUE', period: 6, span: 1, className: 'IV- ECE', department: 'ECE', year: '4', facultyName: 'Dr. P. Senthil Kumar', topic: 'VLSI Design & Embedded Systems' },
  { day: 'TUE', period: 6, span: 1, className: 'III- EEE', department: 'EEE', year: '3', facultyName: 'Prof. V. Karthik', topic: 'Power Electronics & Drives' },
  { day: 'TUE', period: 6, span: 1, className: 'IV- IT & AD', department: 'Placement', year: '4', facultyName: 'Mr. N. Anand', topic: 'Logical Reasoning & Aptitude Test' },

  // TUE P7
  { day: 'TUE', period: 7, span: 1, className: 'II- ECE', department: 'ECE', year: '2', facultyName: 'Dr. P. Senthil Kumar', topic: 'Digital Electronics & Logic Circuits' },
  { day: 'TUE', period: 7, span: 1, className: 'II- EEE', department: 'EEE', year: '2', facultyName: 'Prof. V. Karthik', topic: 'Electromagnetic Field Theory' },
  { day: 'TUE', period: 7, span: 1, className: 'I- CE', department: 'CE', year: '1', facultyName: 'Mrs. R. Priya', topic: 'Engineering Mechanics' },

  // ==================== WED ====================
  // WED P1
  { day: 'WED', period: 1, span: 1, className: 'I- AIDS', department: 'AIDS', year: '1', facultyName: 'Mrs. S. Divya', topic: 'Mathematics & Logical Problem Solving' },
  { day: 'WED', period: 1, span: 1, className: 'II- CSE', department: 'CSE', year: '2', facultyName: 'Dr. K. Ramesh', topic: 'Data Structures Laboratory & Concepts' },
  { day: 'WED', period: 1, span: 1, className: 'III- EEE', department: 'EEE', year: '3', facultyName: 'Prof. V. Karthik', topic: 'Linear Integrated Circuits' },

  // WED P2
  { day: 'WED', period: 2, span: 1, className: 'I- CSE', department: 'CSE', year: '1', facultyName: 'Dr. K. Ramesh', topic: 'C Programming & Pointers' },
  { day: 'WED', period: 2, span: 1, className: 'II- ECE', department: 'ECE', year: '2', facultyName: 'Dr. P. Senthil Kumar', topic: 'Analog Circuits' },
  { day: 'WED', period: 2, span: 1, className: 'II- MECH', department: 'MECH', year: '2', facultyName: 'Prof. A. Balaji', topic: 'Fluid Mechanics and Machinery' },

  // WED P3
  { day: 'WED', period: 3, span: 1, className: 'III- MECH', department: 'MECH', year: '3', facultyName: 'Prof. A. Balaji', topic: 'Thermal Engineering & Aptitude' },
  { day: 'WED', period: 3, span: 1, className: 'III- IT', department: 'IT', year: '3', facultyName: 'Prof. M. Suresh', topic: 'Node.js & Backend Architecture' },
  { day: 'WED', period: 3, span: 1, className: 'III- AD', department: 'AIDS', year: '3', facultyName: 'Mrs. S. Divya', topic: 'Deep Learning & Neural Networks' },
  { day: 'WED', period: 3, span: 1, className: 'I- EEE', department: 'EEE', year: '1', facultyName: 'Prof. V. Karthik', topic: 'Electric Circuit Analysis' },

  // WED P4
  { day: 'WED', period: 4, span: 1, className: 'III- CE', department: 'CE', year: '3', facultyName: 'Mrs. R. Priya', topic: 'Surveying & Structural Analysis' },
  { day: 'WED', period: 4, span: 1, className: 'I- ECE', department: 'ECE', year: '1', facultyName: 'Dr. P. Senthil Kumar', topic: 'Electronic Principles' },
  { day: 'WED', period: 4, span: 1, className: 'IV- CSE', department: 'Placement', year: '4', facultyName: 'Ms. T. Meena', topic: 'Technical Presentation & Interview Skills' },
  { day: 'WED', period: 4, span: 1, className: 'IV- IT & AD', department: 'Placement', year: '4', facultyName: 'Mr. N. Anand', topic: 'Quantitative Aptitude - Probability' },

  // WED P5
  { day: 'WED', period: 5, span: 1, className: 'II- CSE', department: 'CSE', year: '2', facultyName: 'Dr. K. Ramesh', topic: 'Data Structures Foundation & Algorithms' },
  { day: 'WED', period: 5, span: 1, className: 'II- AD', department: 'AIDS', year: '2', facultyName: 'Mrs. S. Divya', topic: 'Database Technologies for AI' },
  { day: 'WED', period: 5, span: 1, className: 'II- CE', department: 'CE', year: '2', facultyName: 'Mrs. R. Priya', topic: 'Strength of Materials' },
  { day: 'WED', period: 5, span: 1, className: 'III- MECH', department: 'MECH', year: '3', facultyName: 'Prof. A. Balaji', topic: 'Design of Machine Elements' },

  // WED P6
  { day: 'WED', period: 6, span: 1, className: 'IV- ECE', department: 'ECE', year: '4', facultyName: 'Dr. P. Senthil Kumar', topic: 'Wireless & Sensor Networks' },
  { day: 'WED', period: 6, span: 1, className: 'III- EEE', department: 'EEE', year: '3', facultyName: 'Prof. V. Karthik', topic: 'Control Systems Engineering' },
  { day: 'WED', period: 6, span: 1, className: 'IV - EEE, CE, & MECH', department: 'Placement', year: '4', facultyName: 'Mr. N. Anand', topic: 'Company Technical Aptitude Round' },

  // WED P7
  { day: 'WED', period: 7, span: 1, className: 'III- CSE', department: 'CSE', year: '3', facultyName: 'Dr. K. Ramesh', topic: 'Competitive Programming & DSA' },
  { day: 'WED', period: 7, span: 1, className: 'II- IT', department: 'IT', year: '2', facultyName: 'Prof. M. Suresh', topic: 'Software Engineering Principles' },
  { day: 'WED', period: 7, span: 1, className: 'I- CE', department: 'CE', year: '1', facultyName: 'Mrs. R. Priya', topic: 'Engineering Surveying' },

  // ==================== THU ====================
  // THU P1
  { day: 'THU', period: 1, span: 1, className: 'III- IT', department: 'IT', year: '3', facultyName: 'Prof. M. Suresh', topic: 'Full Stack Web Development & Database' },
  { day: 'THU', period: 1, span: 1, className: 'I- CSE', department: 'CSE', year: '1', facultyName: 'Dr. K. Ramesh', topic: 'Computer Organization & Logic' },
  { day: 'THU', period: 1, span: 1, className: 'II- AD', department: 'AIDS', year: '2', facultyName: 'Mrs. S. Divya', topic: 'Machine Learning Algorithms' },
  { day: 'THU', period: 1, span: 1, className: 'I- EEE', department: 'EEE', year: '1', facultyName: 'Prof. V. Karthik', topic: 'Electrical Engineering Science' },

  // THU P2
  { day: 'THU', period: 2, span: 1, className: 'I- ECE', department: 'ECE', year: '1', facultyName: 'Dr. P. Senthil Kumar', topic: 'Basic Electrical & Electronics' },
  { day: 'THU', period: 2, span: 1, className: 'II- CSE', department: 'CSE', year: '2', facultyName: 'Dr. K. Ramesh', topic: 'Object Oriented Programming with Java' },
  { day: 'THU', period: 2, span: 1, className: 'III- MECH', department: 'MECH', year: '3', facultyName: 'Prof. A. Balaji', topic: 'Applied Thermodynamics' },

  // THU P3
  { day: 'THU', period: 3, span: 1, className: 'III- AD', department: 'AIDS', year: '3', facultyName: 'Mrs. S. Divya', topic: 'Machine Learning & Predictive Modeling' },
  { day: 'THU', period: 3, span: 1, className: 'II- ECE', department: 'ECE', year: '2', facultyName: 'Dr. P. Senthil Kumar', topic: 'Microcontrollers & Architecture' },
  { day: 'THU', period: 3, span: 1, className: 'III- CE', department: 'CE', year: '3', facultyName: 'Mrs. R. Priya', topic: 'Geotechnical Engineering' },
  { day: 'THU', period: 3, span: 1, className: 'IV- CSE', department: 'Placement', year: '4', facultyName: 'Mr. N. Anand', topic: 'Advanced Quantitative Aptitude' },

  // THU P4
  { day: 'THU', period: 4, span: 1, className: 'II- CE', department: 'CE', year: '2', facultyName: 'Mrs. R. Priya', topic: 'Construction Materials & Aptitude' },
  { day: 'THU', period: 4, span: 1, className: 'II- MECH', department: 'MECH', year: '2', facultyName: 'Prof. A. Balaji', topic: 'Kinematics of Machinery' },
  { day: 'THU', period: 4, span: 1, className: 'III- EEE', department: 'EEE', year: '3', facultyName: 'Prof. V. Karthik', topic: 'High Voltage Engineering' },

  // THU P5
  { day: 'THU', period: 5, span: 1, className: 'III- EE', department: 'EEE', year: '3', facultyName: 'Prof. V. Karthik', topic: 'Power Electronics & Control Systems' },
  { day: 'THU', period: 5, className: 'III- CSE', department: 'CSE', year: '3', facultyName: 'Dr. K. Ramesh', topic: 'Design & Analysis of Algorithms' },
  { day: 'THU', period: 5, className: 'I- AIDS', department: 'AIDS', year: '1', facultyName: 'Mrs. S. Divya', topic: 'Discrete Mathematics' },
  { day: 'THU', period: 5, className: 'IV- IT & AD', department: 'Placement', year: '4', facultyName: 'Ms. T. Meena', topic: 'Resume Writing & HR Interview Skills' },

  // THU P6
  { day: 'THU', period: 6, className: 'IV- ECE', department: 'ECE', year: '4', facultyName: 'Dr. P. Senthil Kumar', topic: 'Automotive Electronics & IoT' },
  { day: 'THU', period: 6, className: 'IV - EEE, CE, & MECH', department: 'Placement', year: '4', facultyName: 'Mr. N. Anand', topic: 'Quantitative Aptitude - Data Interpretation' },
  { day: 'THU', period: 6, className: 'III- MECH', department: 'MECH', year: '3', facultyName: 'Prof. A. Balaji', topic: 'Metrology & Quality Control' },

  // THU P7
  { day: 'THU', period: 7, className: 'II- EEE', department: 'EEE', year: '2', facultyName: 'Prof. V. Karthik', topic: 'Electrical Machines & Technical Fundamentals' },
  { day: 'THU', period: 7, className: 'I- CE', department: 'CE', year: '1', facultyName: 'Mrs. R. Priya', topic: 'Basic Civil Engineering' },

  // ==================== FRI ====================
  // FRI P1
  { day: 'FRI', period: 1, className: 'I- CSE', department: 'CSE', year: '1', facultyName: 'Dr. K. Ramesh', topic: 'Programming in C - Data Structures' },
  { day: 'FRI', period: 1, className: 'I- AIDS', department: 'AIDS', year: '1', facultyName: 'Mrs. S. Divya', topic: 'Python Programming Lab' },
  { day: 'FRI', period: 1, className: 'III- EEE', department: 'EEE', year: '3', facultyName: 'Prof. V. Karthik', topic: 'Microprocessors and Microcontrollers' },

  // FRI P2
  { day: 'FRI', period: 2, className: 'IV- IT & AD', department: 'IT', year: '4', facultyName: 'Prof. M. Suresh', topic: 'Placement Mock Coding & Technical Rounds' },
  { day: 'FRI', period: 2, className: 'II- CSE', department: 'CSE', year: '2', facultyName: 'Dr. K. Ramesh', topic: 'Relational Database Design' },
  { day: 'FRI', period: 2, className: 'I- ECE', department: 'ECE', year: '1', facultyName: 'Dr. P. Senthil Kumar', topic: 'Circuit Theory & Components' },
  { day: 'FRI', period: 2, className: 'II- MECH', department: 'MECH', year: '2', facultyName: 'Prof. A. Balaji', topic: 'Material Science & Metallurgy' },

  // FRI P3
  { day: 'FRI', period: 3, className: 'IV- IT & AD', department: 'IT', year: '4', facultyName: 'Prof. M. Suresh', topic: 'Placement Mock Coding & Technical Rounds' },
  { day: 'FRI', period: 3, className: 'III- AD', department: 'AIDS', year: '3', facultyName: 'Mrs. S. Divya', topic: 'Natural Language Processing' },
  { day: 'FRI', period: 3, className: 'III- CE', department: 'CE', year: '3', facultyName: 'Mrs. R. Priya', topic: 'Concrete Technology & Structures' },
  { day: 'FRI', period: 3, className: 'I- EEE', department: 'EEE', year: '1', facultyName: 'Prof. V. Karthik', topic: 'Electrical Circuit Laboratory' },

  // FRI P4
  { day: 'FRI', period: 4, className: 'II- AD', department: 'AIDS', year: '2', facultyName: 'Mrs. S. Divya', topic: 'AI & Heuristic Search Techniques' },
  { day: 'FRI', period: 4, className: 'II- ECE', department: 'ECE', year: '2', facultyName: 'Dr. P. Senthil Kumar', topic: 'Digital Communication Systems' },
  { day: 'FRI', period: 4, className: 'III- MECH', department: 'MECH', year: '3', facultyName: 'Prof. A. Balaji', topic: 'Dynamics of Machinery' },
  { day: 'FRI', period: 4, className: 'IV- CSE', department: 'Placement', year: '4', facultyName: 'Mr. N. Anand', topic: 'Logical Reasoning - Puzzles & Coding' },

  // FRI P5
  { day: 'FRI', period: 5, className: 'IV - EEE, CE, & MECH', department: 'Placement', year: '4', facultyName: 'Mr. N. Anand', topic: 'Quantitative Aptitude & Core Interview Prep' },
  { day: 'FRI', period: 5, className: 'III- CSE', department: 'CSE', year: '3', facultyName: 'Dr. K. Ramesh', topic: 'Web Tech & Cloud Deployment' },
  { day: 'FRI', period: 5, className: 'II- CE', department: 'CE', year: '2', facultyName: 'Mrs. R. Priya', topic: 'Environmental Engineering' },

  // FRI P6
  { day: 'FRI', period: 6, className: 'IV - EEE, CE, & MECH', department: 'Placement', year: '4', facultyName: 'Mr. N. Anand', topic: 'Quantitative Aptitude & Core Interview Prep' },
  { day: 'FRI', period: 6, className: 'IV- ECE', department: 'ECE', year: '4', facultyName: 'Dr. P. Senthil Kumar', topic: 'Embedded Linux & RTOS' },
  { day: 'FRI', period: 6, className: 'III- EE', department: 'EEE', year: '3', facultyName: 'Prof. V. Karthik', topic: 'Power System Operation & Control' },

  // FRI P7
  { day: 'FRI', period: 7, className: 'IV - EEE, CE, & MECH', department: 'Placement', year: '4', facultyName: 'Mr. N. Anand', topic: 'Quantitative Aptitude & Core Interview Prep' },
  { day: 'FRI', period: 7, className: 'II- EEE', department: 'EEE', year: '2', facultyName: 'Prof. V. Karthik', topic: 'Electrical Measurements' },
  { day: 'FRI', period: 7, className: 'IV- CSE', department: 'Placement', year: '4', facultyName: 'Ms. T. Meena', topic: 'Mock Technical & HR Interviews' },

  // ==================== SAT ====================
  // SAT P1
  { day: 'SAT', period: 1, className: 'IV - CSE', department: 'CSE', year: '4', facultyName: 'Dr. K. Ramesh', topic: 'Product Company DSA & System Design Prep' },
  { day: 'SAT', period: 1, className: 'II- IT', department: 'IT', year: '2', facultyName: 'Prof. M. Suresh', topic: 'Java & Spring Boot Fundamentals' },
  { day: 'SAT', period: 1, className: 'II- AD', department: 'AIDS', year: '2', facultyName: 'Mrs. S. Divya', topic: 'Statistical Modeling for Machine Learning' },
  { day: 'SAT', period: 1, className: 'I- EEE', department: 'EEE', year: '1', facultyName: 'Prof. V. Karthik', topic: 'Fundamental Engineering Physics' },

  // SAT P2
  { day: 'SAT', period: 2, className: 'IV - CSE', department: 'CSE', year: '4', facultyName: 'Dr. K. Ramesh', topic: 'Product Company DSA & System Design Prep' },
  { day: 'SAT', period: 2, className: 'II- ECE', department: 'ECE', year: '2', facultyName: 'Dr. P. Senthil Kumar', topic: 'Digital Signal Processing' },
  { day: 'SAT', period: 2, className: 'III- CE', department: 'CE', year: '3', facultyName: 'Mrs. R. Priya', topic: 'Design of Reinforced Concrete' },

  // SAT P3
  { day: 'SAT', period: 3, className: 'IV - CSE', department: 'CSE', year: '4', facultyName: 'Dr. K. Ramesh', topic: 'Product Company DSA & System Design Prep' },
  { day: 'SAT', period: 3, className: 'III- IT', department: 'IT', year: '3', facultyName: 'Prof. M. Suresh', topic: 'REST API Design & Security' },
  { day: 'SAT', period: 3, className: 'III- AD', department: 'AIDS', year: '3', facultyName: 'Mrs. S. Divya', topic: 'Computer Vision & Image Processing' },
  { day: 'SAT', period: 3, className: 'II- MECH', department: 'MECH', year: '2', facultyName: 'Prof. A. Balaji', topic: 'Manufacturing Processes' },

  // SAT P4
  { day: 'SAT', period: 4, className: 'II- ECE', department: 'ECE', year: '2', facultyName: 'Dr. P. Senthil Kumar', topic: 'Embedded Systems Programming' },
  { day: 'SAT', period: 4, className: 'II- CE', department: 'CE', year: '2', facultyName: 'Mrs. R. Priya', topic: 'Water Resources Engineering' },
  { day: 'SAT', period: 4, className: 'IV- IT & AD', department: 'Placement', year: '4', facultyName: 'Mr. N. Anand', topic: 'Aptitude Speed Test & Analysis' },

  // SAT P5
  { day: 'SAT', period: 5, className: 'III- CSE', department: 'CSE', year: '3', facultyName: 'Dr. K. Ramesh', topic: 'Graph Algorithms & Dynamic Programming' },
  { day: 'SAT', period: 5, className: 'III- EEE', department: 'EEE', year: '3', facultyName: 'Prof. V. Karthik', topic: 'Power Electronics Applications' },
  { day: 'SAT', period: 5, className: 'IV - EEE, CE, & MECH', department: 'Placement', year: '4', facultyName: 'Ms. T. Meena', topic: 'Group Discussions & Soft Skills Review' },

  // SAT P6
  { day: 'SAT', period: 6, className: 'IV- ECE', department: 'ECE', year: '4', facultyName: 'Dr. P. Senthil Kumar', topic: 'IoT Cloud Integrations & Protocols' },
  { day: 'SAT', period: 6, className: 'III- MECH', department: 'MECH', year: '3', facultyName: 'Prof. A. Balaji', topic: 'CAD/CAM Modeling & Simulations' },

  // SAT P7
  { day: 'SAT', period: 7, className: 'II- EEE', department: 'EEE', year: '2', facultyName: 'Prof. V. Karthik', topic: 'Electrical Drives & Inverters' },
  { day: 'SAT', period: 7, className: 'I- CE', department: 'CE', year: '1', facultyName: 'Mrs. R. Priya', topic: 'Structural Drawing & Building Planning' },
];

// Helper: Assert 0 collisions across all (day, period)
function validateSlots(slotList) {
  const map = {};
  const collisions = [];
  slotList.forEach((s) => {
    const key = `${s.day}-P${s.period}`;
    if (!map[key]) map[key] = [];
    map[key].push(s);
  });

  Object.entries(map).forEach(([dp, list]) => {
    const facCounts = {};
    list.forEach((s) => {
      facCounts[s.facultyName] = (facCounts[s.facultyName] || 0) + 1;
      if (facCounts[s.facultyName] > 1) {
        collisions.push(`COLLISION on ${dp}: ${s.facultyName} in ${s.className}`);
      }
    });
  });

  return collisions;
}

module.exports = {
  DEFAULT_FACULTIES,
  DEFAULT_SLOTS,
  validateSlots,
};
