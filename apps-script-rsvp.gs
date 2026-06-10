const SHEET_NAME = 'RSVP';
const OWNER_EMAIL = 'your-email@example.com';

function doPost(event) {
  const payload = event.parameter || {};
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
    || SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Дата отправки',
      'Имя и фамилия',
      'Гость',
      'Дни',
      'Напитки',
      'Пожелания по еде'
    ]);
  }

  sheet.appendRow([
    payload.submittedAt || new Date().toISOString(),
    payload.name || '',
    payload.guest || '',
    payload.events || '',
    payload.drink || '',
    payload.notes || ''
  ]);

  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: 'Новый RSVP на свадьбу',
    htmlBody: [
      '<h2>Новый ответ RSVP</h2>',
      `<p><b>Имя:</b> ${escapeHtml(payload.name)}</p>`,
      `<p><b>Гость:</b> ${escapeHtml(payload.guest)}</p>`,
      `<p><b>Дни:</b> ${escapeHtml(payload.events)}</p>`,
      `<p><b>Напитки:</b> ${escapeHtml(payload.drink)}</p>`,
      `<p><b>Пожелания по еде:</b> ${escapeHtml(payload.notes)}</p>`
    ].join('')
  });

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
