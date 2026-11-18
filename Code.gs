// transceive.eu contact form -> email
// Paste into script.google.com (signed in as john.younis@transceive.eu),
// then Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).

const TO = 'john.younis@transceive.eu';
const MAX_PER_HOUR = 20;   // stops anyone flooding the mailbox

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Spam traps: hidden field must be empty; form must have been open for at least 3 seconds
  if (p.website) return reply_(true);
  const openedAt = Number(p.t || 0);
  if (!openedAt || Date.now() - openedAt < 3000) return reply_(true);

  const name = String(p.name || '').trim().slice(0, 200);
  const email = String(p.email || '').trim().slice(0, 200);
  const message = String(p.message || '').trim().slice(0, 5000);

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reply_(false, 'Please fill in all fields with a valid email address.');
  }

  // Simple hourly limit
  const cache = CacheService.getScriptCache();
  const key = 'count_' + new Date().toISOString().slice(0, 13);
  const count = Number(cache.get(key) || 0);
  if (count >= MAX_PER_HOUR) return reply_(false, 'Too many messages right now. Please try again later.');
  cache.put(key, String(count + 1), 3600);

  MailApp.sendEmail({
    to: TO,
    replyTo: email,
    name: 'transceive.eu contact form',
    subject: 'Website message from ' + name,
    body: 'From: ' + name + ' <' + email + '>\n\n' + message,
  });

  return reply_(true);
}

function reply_(ok, error) {
  return ContentService
    .createTextOutput(JSON.stringify(ok ? { ok: true } : { ok: false, error: error }))
    .setMimeType(ContentService.MimeType.JSON);
}
