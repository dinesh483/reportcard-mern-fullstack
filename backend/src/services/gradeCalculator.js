/**
 * Grade calculation — runs ONLY on the server.
 * Client-submitted grades are always ignored.
 */

function calculateGrade(total, maxTotal = 100) {
  if (maxTotal <= 0) return 'F';
  const pct = (total / maxTotal) * 100;
  if (pct >= 100) return 'O';   // Outstanding
  if (pct >= 90) return 'A+';
  if (pct >= 70) return 'A';
  if (pct >= 60) return 'B+';
  if (pct >= 50) return 'B';
  if (pct >= 40) return 'C';
  return 'F';
}

function isPass(grade) {
  return grade !== 'F';
}

/**
 * Validate marks and compute total + grade.
 * Throws Error with a message if marks are out of range.
 * Returns { total, grade }
 */
function calculateMarks(internal, external, maxInternal = 40, maxExternal = 60) {
  if (internal < 0 || external < 0) throw new Error('Marks cannot be negative');
  if (internal > maxInternal)
    throw new Error(`Internal marks ${internal} exceed maximum ${maxInternal}`);
  if (external > maxExternal)
    throw new Error(`External marks ${external} exceed maximum ${maxExternal}`);

  const total = parseFloat((internal + external).toFixed(2));
  const grade = calculateGrade(total, maxInternal + maxExternal);
  return { total, grade };
}

module.exports = { calculateMarks, calculateGrade, isPass };
