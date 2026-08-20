import AuditLog from '../models/AuditLog.js'

/**
 * Records an admin action for the audit log. Never throws — a logging
 * failure should never block the actual admin action from completing.
 */
export const logAdminAction = async ({ adminId, action, targetType, targetId, details }) => {
  try {
    await AuditLog.create({ admin: adminId, action, targetType, targetId, details })
  } catch {
    // logging is best-effort; swallow failures silently
  }
}
