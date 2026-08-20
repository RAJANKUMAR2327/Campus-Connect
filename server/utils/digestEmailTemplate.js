import { escapeHtml } from './escapeHtml.js'

// SECURITY FIX: every user-controlled string interpolated below (note
// titles/subjects, uploader names, event titles/venues, placement post
// titles/companies/packages, the recipient's own display name) used to be
// dropped straight into this HTML template with no escaping at all. Since
// this builds an outbound email sent to *other* students on a cron
// schedule — not just back to whoever set the text — a note titled
// something like `<img src=x onerror=...>` would render unescaped in
// every recipient's inbox. Everything user-controlled below now goes
// through escapeHtml() first; only server-computed values (counts,
// dates, the CLIENT_URL env var) are left as plain interpolation.
export const buildDigestHTML = (data) => {
  const { user, periodDays, topNotes, upcomingEvents, newPlacements, newListings, gamification, mentorshipUpdates } = data

  const periodLabel = periodDays === 1 ? 'today' : `this ${periodDays === 7 ? 'week' : periodDays + ' days'}`

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 32px 24px;">
            <p style="color:#fff;font-size:24px;font-weight:bold;margin:0;">🎓 CampusConnect</p>
            <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0;">Your digest for ${periodLabel}</p>
          </td></tr>

          <!-- Greeting -->
          <tr><td style="padding:24px 32px 8px;">
            <p style="font-size:16px;color:#1f2937;margin:0;">Hey ${escapeHtml(user.name.split(' ')[0])}! 👋</p>
            <p style="font-size:13px;color:#6b7280;margin:8px 0 0;">Here's what happened on campus ${periodLabel}.</p>
          </td></tr>

          ${gamification ? `
          <!-- Gamification -->
          <tr><td style="padding:16px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;border-radius:12px;padding:16px;">
              <tr>
                <td width="33%" align="center"><p style="font-size:20px;font-weight:bold;color:#4f46e5;margin:0;">+${gamification.xpEarnedThisPeriod}</p><p style="font-size:10px;color:#6366f1;margin:2px 0 0;">XP Earned</p></td>
                <td width="33%" align="center"><p style="font-size:20px;font-weight:bold;color:#4f46e5;margin:0;">Lvl ${gamification.currentLevel}</p><p style="font-size:10px;color:#6366f1;margin:2px 0 0;">Current Level</p></td>
                <td width="33%" align="center"><p style="font-size:20px;font-weight:bold;color:#4f46e5;margin:0;">🔥 ${gamification.streak}</p><p style="font-size:10px;color:#6366f1;margin:2px 0 0;">Day Streak</p></td>
              </tr>
            </table>
          </td></tr>` : ''}

          ${topNotes?.length ? `
          <!-- Notes -->
          <tr><td style="padding:8px 32px;">
            <p style="font-size:13px;font-weight:bold;color:#1f2937;margin:0 0 10px;">📚 Top Notes for You</p>
            ${topNotes.map(n => `
              <table width="100%" style="margin-bottom:6px;"><tr>
                <td style="background:#f9fafb;border-radius:8px;padding:10px 12px;">
                  <p style="font-size:12px;font-weight:600;color:#1f2937;margin:0;">${escapeHtml(n.title)}</p>
                  <p style="font-size:10px;color:#9ca3af;margin:2px 0 0;">${escapeHtml(n.subject)} · by ${escapeHtml(n.uploader?.name || 'Unknown')}</p>
                </td>
              </tr></table>
            `).join('')}
          </td></tr>` : ''}

          ${upcomingEvents?.length ? `
          <!-- Events -->
          <tr><td style="padding:8px 32px;">
            <p style="font-size:13px;font-weight:bold;color:#1f2937;margin:0 0 10px;">📅 Upcoming Events</p>
            ${upcomingEvents.map(e => `
              <table width="100%" style="margin-bottom:6px;"><tr>
                <td style="background:#f0fdf4;border-radius:8px;padding:10px 12px;">
                  <p style="font-size:12px;font-weight:600;color:#166534;margin:0;">${escapeHtml(e.title)}</p>
                  <p style="font-size:10px;color:#16a34a;margin:2px 0 0;">${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${escapeHtml(e.venue || 'TBD')}</p>
                </td>
              </tr></table>
            `).join('')}
          </td></tr>` : ''}

          ${newPlacements?.length ? `
          <!-- Placements -->
          <tr><td style="padding:8px 32px;">
            <p style="font-size:13px;font-weight:bold;color:#1f2937;margin:0 0 10px;">💼 New Placement Posts</p>
            ${newPlacements.map(p => `
              <table width="100%" style="margin-bottom:6px;"><tr>
                <td style="background:#eff6ff;border-radius:8px;padding:10px 12px;">
                  <p style="font-size:12px;font-weight:600;color:#1e3a8a;margin:0;">${escapeHtml(p.title)}</p>
                  <p style="font-size:10px;color:#3b82f6;margin:2px 0 0;">${escapeHtml(p.company || '')} ${p.package ? '· ' + escapeHtml(p.package) : ''}</p>
                </td>
              </tr></table>
            `).join('')}
          </td></tr>` : ''}

          ${mentorshipUpdates ? `
          <tr><td style="padding:8px 32px;">
            <table width="100%" style="background:#fffbeb;border-radius:8px;padding:12px;"><tr>
              <td><p style="font-size:12px;color:#92400e;margin:0;">⏰ You have ${mentorshipUpdates} pending mentorship request${mentorshipUpdates > 1 ? 's' : ''}</p></td>
            </tr></table>
          </td></tr>` : ''}

          <!-- CTA -->
          <tr><td style="padding:24px 32px;">
            <table width="100%"><tr><td align="center">
              <a href="${process.env.CLIENT_URL}/dashboard" style="display:inline-block;background:#6366f1;color:#fff;font-size:13px;font-weight:bold;padding:12px 32px;border-radius:10px;text-decoration:none;">Open CampusConnect</a>
            </td></tr></table>
          </td></tr>

          <!-- Footer -->
          <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
            <p style="font-size:10px;color:#9ca3af;margin:0;text-align:center;">
              You're receiving this because you opted in to email digests.
              <a href="${process.env.CLIENT_URL}/settings" style="color:#6366f1;">Manage preferences</a>
            </p>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `
}