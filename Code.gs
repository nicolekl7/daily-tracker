// ─────────────────────────────────────────────────────────────────────────────
// NICOLE OS — Google Apps Script
// Paste this entire file into Google Apps Script, then deploy as a Web App.
// Set: Execute as → Me | Who has access → Anyone
// Copy the deployment URL and paste it into the Nicole OS app → Daily Log → Sync
// ─────────────────────────────────────────────────────────────────────────────

const SHEET_NAME_DAILY  = "Daily Log";
const SHEET_NAME_SPEND  = "Spend Items";

// Column headers for each sheet — these will be written on first run
const DAILY_HEADERS = [
  "Date", "Mood", "Anxiety", "Anger", "Energy", "Notes",
  "Bedtime", "Wake Time", "Sleep Hours", "Sleep Quality", "Sleep Supplements",
  "Hair Washed",
  "Breakfast", "Breakfast Flags",
  "Lunch", "Lunch Flags",
  "Dinner", "Dinner Flags",
  "Snacks", "Snack Flags",
  "Day Flags", "Food Notes",
  "Symptoms",
  "Vyvanse", "Adderall IR", "Adderall XR", "Ativan", "Propranolol",
  "Supplements", "Habits",
  "Skin Rating", "Skin Concerns", "Skincare AM", "Skincare PM", "Skin Notes",
  "Total Spend", "Net Spend",
  "Cycle Day", "Cycle Phase"
];

const SPEND_HEADERS = [
  "Date", "Note", "Category", "Amount", "Return Likely"
];

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Write daily log row
    if (payload.dailyRow) {
      const sheet = getOrCreateSheet(ss, SHEET_NAME_DAILY, DAILY_HEADERS);
      const d = payload.dailyRow;
      const existingRow = findRowByDate(sheet, d.date);
      const row = [
        d.date, d.mood, d.anxiety, d.anger, d.energy, d.notes,
        d.bedtime, d.wakeTime, d.sleepHours, d.sleepQuality, d.sleepSupps,
        d.hairWashed,
        d.breakfast, d.breakfastFlags,
        d.lunch, d.lunchFlags,
        d.dinner, d.dinnerFlags,
        d.snacks, d.snackFlags,
        d.dayFlags, d.foodNotes,
        d.symptoms,
        d.vyvanse, d.adderallIR, d.adderallXR, d.ativan, d.propranolol,
        d.supplements, d.habits,
        d.skinRating, d.skinConcerns, d.skincareAM, d.skincarePM, d.skinNotes,
        d.totalSpend, d.netSpend,
        d.cycleDay, d.cyclePhase
      ];

      if (existingRow > 0) {
        // Update existing row for this date
        sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
      } else {
        // Append new row
        sheet.appendRow(row);
      }
    }

    // Write spend item rows (append only — don't deduplicate)
    if (payload.spendRows && payload.spendRows.length > 0) {
      const spendSheet = getOrCreateSheet(ss, SHEET_NAME_SPEND, SPEND_HEADERS);
      // Remove existing spend rows for this date first, then re-append
      if (payload.spendRows[0]) {
        const date = payload.spendRows[0].date;
        removeRowsByDate(spendSheet, date);
      }
      payload.spendRows.forEach(item => {
        spendSheet.appendRow([item.date, item.note, item.category, item.amount, item.returnLikely]);
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle CORS preflight (not always needed but safe to include)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", message: "Nicole OS Script is live" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    // Style the header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#1A1814");
    headerRange.setFontColor("#C4856A");
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findRowByDate(sheet, date) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === date) return i + 1; // 1-indexed
  }
  return -1;
}

function removeRowsByDate(sheet, date) {
  const data = sheet.getDataRange().getValues();
  // Delete from bottom to avoid index shifting
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === date) sheet.deleteRow(i + 1);
  }
}
