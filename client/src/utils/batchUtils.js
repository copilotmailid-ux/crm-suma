/**
 * Dynamic Academic Batch Utilities
 * 
 * College Rule:
 * - 4-Year B.E./B.Tech degree format: "YYYY-(YYYY+4)" (e.g. 2023-2027).
 * - Academic years conclude in May.
 * - From June 1st onwards (after the month of May), the academic year transitions
 *   and the next graduating batch automatically becomes the "Current Final Year" batch.
 * - Example transitions:
 *   - Up to May 31, 2027: Current Final Year is '2023-2027'
 *   - After May 2027 (June 1, 2027 - May 31, 2028): Current Final Year is '2024-2028'
 *   - After May 2028 (June 1, 2028 - May 31, 2029): Current Final Year is '2025-2029'
 */

/**
 * Returns the current final-year graduating batch string dynamically.
 * Switches every year after the month of May (from June 1st onwards).
 *
 * @param {Date} [date=new Date()]
 * @returns {string} Batch string, e.g. "2023-2027"
 */
export const getCurrentFinalYearBatch = (date = new Date()) => {
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth(); // 0 = Jan, 4 = May, 5 = Jun
  // After May (month > 4 / June onwards), academic year shifts to the next graduating year
  const graduatingYear = currentMonth > 4 ? currentYear + 1 : currentYear;
  const startYear = graduatingYear - 4;
  return `${startYear}-${graduatingYear}`;
};

/**
 * Extracts graduation year from a batch string (e.g. '2023-2027' -> 2027).
 *
 * @param {string} batch
 * @returns {number|null}
 */
export const getGraduationYear = (batch) => {
  if (!batch) return null;
  const parts = batch.toString().split('-');
  return parts.length > 1 ? parseInt(parts[1], 10) : parseInt(batch, 10);
};

/**
 * Determines whether a student's batch is eligible to enter placements.
 * - Final year graduating students (current final year): Eligible
 * - Previous graduates / Alumni: Eligible
 * - Third-year and junior students (graduating in future years): Ineligible until their final year
 *
 * @param {string} batch
 * @param {Date} [date=new Date()]
 * @returns {boolean}
 */
export const isBatchEligibleForPlacement = (batch, date = new Date()) => {
  const currentFinalYear = getCurrentFinalYearBatch(date);
  const currentGradYear = getGraduationYear(currentFinalYear);
  const studentGradYear = getGraduationYear(batch);
  if (!studentGradYear || !currentGradYear) return false;
  return studentGradYear <= currentGradYear;
};

/**
 * Returns the categorical placement standing of a batch:
 * - 'final_year': Current final-year graduating class (preferred first)
 * - 'alumni': Previous graduating class
 * - 'junior': Third-year or lower (not eligible for placements yet)
 *
 * @param {string} batch
 * @param {Date} [date=new Date()]
 * @returns {'final_year' | 'alumni' | 'junior'}
 */
export const getBatchType = (batch, date = new Date()) => {
  const currentFinalYear = getCurrentFinalYearBatch(date);
  if (batch === currentFinalYear) return 'final_year';
  const currentGradYear = getGraduationYear(currentFinalYear);
  const studentGradYear = getGraduationYear(batch);
  if (studentGradYear && currentGradYear && studentGradYear < currentGradYear) {
    return 'alumni';
  }
  return 'junior';
};
