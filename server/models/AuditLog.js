import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: { type: String, required: true }, // e.g. 'update_user_role', 'delete_user'
    targetType: { type: String, required: true }, // e.g. 'User', 'Note', 'Comment', 'Report'
    targetId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: mongoose.Schema.Types.Mixed }, // free-form context, e.g. { from: 'student', to: 'admin' }
  },
  { timestamps: true }
)

auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ admin: 1, createdAt: -1 })

export default mongoose.model('AuditLog', auditLogSchema)
