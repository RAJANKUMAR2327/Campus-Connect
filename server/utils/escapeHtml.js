// Escapes HTML metacharacters in user-supplied text before it's
// interpolated into an HTML template string. Without this, a note title,
// display name, event title, or any other free-text field a user controls
// can inject arbitrary markup into anything that renders that text as
// HTML — most notably utils/digestEmailTemplate.js, which builds outbound
// digest emails sent to other students on a cron schedule (not just back
// to the person who set the text). Every user-controlled string
// interpolated into an HTML template anywhere in this codebase should run
// through this first.
export const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
