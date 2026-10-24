/**
 * Sync Drives & Attendance Script
 * 
 * Ensures all placed students have full drive attendance records,
 * round progression (R1, R2, R3 selected), and are included in
 * finalSelectedStudents of their placement drive.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Placement = require('../models/Placement');
const Company = require('../models/Company');
const Drive = require('../models/Drive');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement-crm';

async function syncDrivesAndAttendance(isStandalone = true) {
  console.log('\n======================================================');
  console.log('  🎯 SYNCING PLACED STUDENTS WITH DRIVES & ATTENDANCE  ');
  console.log('======================================================\n');

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
      console.log('✅ Connected to MongoDB');
    }

    // 1. Fetch all placements and students
    const placements = await Placement.find({}).populate('companyId').populate('studentId');
    console.log(`Found ${placements.length} total placement records in database.`);

    const allCompanies = await Company.find({});
    const companyMap = new Map();
    allCompanies.forEach((c) => companyMap.set(c._id.toString(), c));

    let updatedPlacedDrives = 0;
    let syncedStudentsCount = 0;

    for (const p of placements) {
      if (!p.studentId || !p.companyId) continue;

      const student = p.studentId;
      const company = p.companyId;

      // Find or create Drive for this company
      let drive = await Drive.findOne({
        $or: [
          { companyId: company._id },
          { companyName: new RegExp(`^${company.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        ],
      });

      const driveDate = p.placementDate ? new Date(p.placementDate) : new Date('2025-02-15');
      const regDeadline = new Date(driveDate.getTime() - 14 * 24 * 60 * 60 * 1000);

      if (!drive) {
        drive = await Drive.create({
          companyId: company._id,
          companyName: company.name,
          title: `${company.name} Campus Recruitment Drive`,
          role: p.role || 'Software Engineer',
          package: p.package || 12,
          jobLocation: 'Chennai / Bangalore / Hybrid',
          eligibleDepartments: ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'ME', 'CE'],
          eligibleBatches: ['2022-2026', '2021-2025'],
          minCgpa: 6.5,
          minTenthMarks: 60,
          minTwelfthMarks: 60,
          driveDate,
          registrationDeadline: regDeadline,
          status: 'Completed',
          jobDescription: `Campus recruitment drive for ${p.role || 'Software Engineer'} at ${company.name}.`,
          selectionProcess: 'Round 1: Online Technical Assessment, Round 2: Technical Interview, Round 3: HR & Management Discussion',
          registeredStudents: [],
          rounds: [
            {
              roundNumber: 1,
              name: 'Round 1: Online Assessment',
              type: 'Assessment',
              status: 'Completed',
              candidates: [],
            },
            {
              roundNumber: 2,
              name: 'Round 2: Technical Interview',
              type: 'Interview',
              status: 'Completed',
              candidates: [],
            },
            {
              roundNumber: 3,
              name: 'Round 3: HR & Management Discussion',
              type: 'Interview',
              status: 'Completed',
              candidates: [],
            },
          ],
          finalSelectedStudents: [],
        });
        updatedPlacedDrives++;
      }

      // Ensure rounds exist and has 3 standard rounds for placed drives
      if (!drive.rounds || drive.rounds.length === 0) {
        drive.rounds = [
          { roundNumber: 1, name: 'Round 1: Online Assessment', type: 'Assessment', status: 'Completed', candidates: [] },
          { roundNumber: 2, name: 'Round 2: Technical Interview', type: 'Interview', status: 'Completed', candidates: [] },
          { roundNumber: 3, name: 'Round 3: HR & Management Discussion', type: 'Interview', status: 'Completed', candidates: [] },
        ];
      } else if (drive.rounds.length === 1) {
        drive.rounds.push(
          { roundNumber: 2, name: 'Round 2: Technical Interview', type: 'Interview', status: 'Completed', candidates: [] },
          { roundNumber: 3, name: 'Round 3: HR & Management Discussion', type: 'Interview', status: 'Completed', candidates: [] }
        );
      } else if (drive.rounds.length === 2) {
        drive.rounds.push(
          { roundNumber: 3, name: 'Round 3: HR & Management Discussion', type: 'Interview', status: 'Completed', candidates: [] }
        );
      }

      // Ensure student is registered
      if (!drive.registeredStudents.some((id) => id.toString() === student._id.toString())) {
        drive.registeredStudents.push(student._id);
      }

      // Ensure student is in candidates of each round with proper round progression
      const totalRounds = drive.rounds.length;
      for (const round of drive.rounds) {
        if (!round.candidates) round.candidates = [];
        const isFinalRound = round.roundNumber === totalRounds;
        const existingCand = round.candidates.find((c) => c.studentId?.toString() === student._id.toString());
        const roundStatus = isFinalRound ? 'selected' : 'shortlisted';
        const feedback = round.roundNumber === 1
          ? 'High score in aptitude & domain test (94%). Qualified for Round 2.'
          : round.roundNumber === 2
          ? (isFinalRound ? 'Strong technical knowledge and excellent problem solving. Final offer extended.' : 'Strong technical knowledge and problem solving. Qualified for Round 3.')
          : 'Clear communication, high cultural fit. Final placement offer confirmed.';

        if (existingCand) {
          existingCand.status = roundStatus;
          existingCand.feedback = feedback;
        } else {
          round.candidates.push({
            studentId: student._id,
            status: roundStatus,
            feedback,
          });
        }
      }

      // Ensure student is in finalSelectedStudents
      if (!drive.finalSelectedStudents) drive.finalSelectedStudents = [];
      const existingFinal = drive.finalSelectedStudents.find((f) => f.studentId?.toString() === student._id.toString());
      if (existingFinal) {
        existingFinal.role = p.role || drive.role;
        existingFinal.package = p.package || drive.package;
        existingFinal.placementDate = p.placementDate || drive.driveDate;
        existingFinal.placementId = p._id;
        existingFinal.offerLetterUrl = p.offerLetterUrl || existingFinal.offerLetterUrl || '';
        existingFinal.offerLetterName = p.offerLetterName || existingFinal.offerLetterName || '';
      } else {
        drive.finalSelectedStudents.push({
          studentId: student._id,
          role: p.role || drive.role,
          package: p.package || drive.package,
          placementDate: p.placementDate || drive.driveDate,
          placementId: p._id,
          offerLetterUrl: p.offerLetterUrl || '',
          offerLetterName: p.offerLetterName || '',
        });
      }

      await drive.save();
      syncedStudentsCount++;
    }

    console.log(`✓ Successfully synced ${syncedStudentsCount} placed students to their placement drives.`);

    // 2. Also register placed students into 1 additional drive to show realistic multiple drive attendance history
    const allDrives = await Drive.find({});
    console.log(`Processing additional attended drives history across ${allDrives.length} drives...`);

    const placedStudents = await Student.find({ status: 'placed' });
    let additionalRegistrations = 0;

    for (let idx = 0; idx < placedStudents.length; idx++) {
      const student = placedStudents[idx];
      // Pick another drive that is NOT their placed drive
      const otherDrives = allDrives.filter(
        (d) => !d.finalSelectedStudents.some((f) => f.studentId?.toString() === student._id.toString())
      );

      if (otherDrives.length > 0) {
        const otherDrive = otherDrives[idx % otherDrives.length];
        if (!otherDrive.registeredStudents.some((id) => id.toString() === student._id.toString())) {
          otherDrive.registeredStudents.push(student._id);

          // Add to Round 1
          if (otherDrive.rounds && otherDrive.rounds.length > 0) {
            const r1 = otherDrive.rounds[0];
            if (!r1.candidates) r1.candidates = [];
            if (!r1.candidates.some((c) => c.studentId?.toString() === student._id.toString())) {
              const reachedR2 = idx % 2 === 0;
              r1.candidates.push({
                studentId: student._id,
                status: reachedR2 ? 'shortlisted' : 'eliminated',
                feedback: reachedR2 ? 'Cleared online test with 85%. Qualified for Technical Interview.' : 'Did not meet sectional cutoff in logical aptitude.',
                eliminationReason: reachedR2 ? '' : 'Aptitude sectional cutoff not met',
                eliminationRemarks: reachedR2 ? '' : 'Scored 62% against 75% cutoff threshold in logical reasoning.',
              });

              if (reachedR2 && otherDrive.rounds.length > 1) {
                const r2 = otherDrive.rounds[1];
                if (!r2.candidates) r2.candidates = [];
                if (!r2.candidates.some((c) => c.studentId?.toString() === student._id.toString())) {
                  r2.candidates.push({
                    studentId: student._id,
                    status: 'eliminated',
                    feedback: 'Good technical discussion, candidate opted for alternate Tier-1 offer.',
                    eliminationReason: 'Technical Round 2 - Candidate Withdrawn / Final Shortlist',
                    eliminationRemarks: 'Interview completed. Candidate accepted offer from primary company.',
                  });
                }
              }
            }
          }

          await otherDrive.save();
          additionalRegistrations++;
        }
      }
    }

    console.log(`✓ Added ${additionalRegistrations} additional attended drive records for realistic multi-drive progression.`);

    // 3. Audit all drives and sanitize intermediate round statuses:
    // If a round is NOT the final round, candidates who qualified must be 'shortlisted', NEVER 'selected'.
    // If a candidate was eliminated in a subsequent round, or is NOT in finalSelectedStudents, they cannot be 'selected'.
    const drivesToSanitize = await Drive.find({});
    let sanitizedRoundsCount = 0;

    for (const d of drivesToSanitize) {
      let modified = false;
      const totalR = (d.rounds || []).length;
      const finalSelectedIds = new Set(
        (d.finalSelectedStudents || []).map((f) => (f.studentId?._id || f.studentId)?.toString())
      );

      (d.rounds || []).forEach((r) => {
        const isFinal = r.roundNumber === totalR;
        (r.candidates || []).forEach((cand) => {
          const sId = (cand.studentId?._id || cand.studentId)?.toString();
          const isFinalPlaced = finalSelectedIds.has(sId);

          // In intermediate rounds, 'selected' must be 'shortlisted' (qualified for next round)
          if (!isFinal && cand.status === 'selected') {
            cand.status = 'shortlisted';
            if (!cand.feedback || cand.feedback.includes('Final offer')) {
              cand.feedback = `Qualified Round ${r.roundNumber} with strong score. Advanced to next round.`;
            }
            modified = true;
          }

          // If student is NOT placed in this drive, they must NEVER be 'selected' anywhere
          if (!isFinalPlaced && cand.status === 'selected') {
            const inLaterRound = (d.rounds || []).some(
              (laterR) => laterR.roundNumber > r.roundNumber && (laterR.candidates || []).some((c) => (c.studentId?._id || c.studentId)?.toString() === sId)
            );
            cand.status = inLaterRound ? 'shortlisted' : 'eliminated';
            modified = true;
          }
        });
      });

      if (modified) {
        await d.save();
        sanitizedRoundsCount++;
      }
    }
    console.log(`✓ Audited and sanitized candidate round progression across ${sanitizedRoundsCount} drives.`);

    console.log('\n======================================================');
    console.log('       🎉 DRIVES & ATTENDANCE SYNCED COMPLETED! 🎉     ');
    console.log('======================================================\n');

    if (isStandalone) {
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error syncing drives and attendance:', error);
    if (isStandalone) {
      await mongoose.disconnect();
      process.exit(1);
    }
    throw error;
  }
}

if (require.main === module) {
  syncDrivesAndAttendance(true);
}

module.exports = syncDrivesAndAttendance;
