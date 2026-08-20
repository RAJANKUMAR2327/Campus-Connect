import mongoose from 'mongoose'

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    credits: { type: Number, required: true, min: 0.5 },
    grade: { type: String, required: true }, // e.g. 'O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'
    gradePoint: { type: Number, required: true }, // e.g. 10, 9, 8...
  },
  { _id: false }
)

const gpaRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    semesterLabel: { type: String, required: true, trim: true }, // e.g. "Semester 5"
    courses: [courseSchema],
    sgpa: { type: Number, required: true },
    // CORRECTNESS FIX (GPA-01): totalPoints is the raw, unrounded
    // numerator (sum of credits × gradePoint) behind `sgpa`. It's stored
    // alongside the rounded sgpa specifically so CGPA can be computed by
    // summing these raw values across semesters, rather than
    // reconstructing them as `sgpa * totalCredits` — which multiplies an
    // already-rounded (2-decimal) average back out, introducing a small
    // but real, compounding rounding error that grows with every
    // additional semester on file. Optional (not `required`) so existing
    // records created before this fix don't fail validation — see
    // gpaController.js's getGpaRecords for the fallback that handles them.
    totalPoints: { type: Number },
    totalCredits: { type: Number, required: true },
  },
  { timestamps: true }
)

gpaRecordSchema.index({ user: 1, createdAt: -1 })

export default mongoose.model('GpaRecord', gpaRecordSchema)
