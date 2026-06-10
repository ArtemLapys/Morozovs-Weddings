const SHEET_ID = "PASTE_GOOGLE_SHEET_ID_HERE";
const OWNER_EMAIL = "owner@example.com";
const SHEET_NAME = "RSVP";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    sheet.appendRow([
      new Date(),
      data.name,
      data.attendance,
      data.guests,
      (data.drinks || []).join(", "),
      data.message,
      data.source,
    ]);

    MailApp.sendEmail({
      to: OWNER_EMAIL,
      subject: "Новый RSVP-ответ",
      htmlBody: `
        <h2>Новый ответ гостя</h2>
        <p><b>Имя:</b> ${data.name}</p>
        <p><b>Статус:</b> ${data.attendance}</p>
        <p><b>Гостей:</b> ${data.guests}</p>
        <p><b>Напитки:</b> ${(data.drinks || []).join(", ")}</p>
        <p><b>Сообщение:</b> ${data.message || "-"}</p>
      `,
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
