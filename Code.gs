function searchOltFromDashboard() {
  var webAppUrl = "https://script.google.com/macros/s/AKfycbyJule0qJyOS7OZJFuBHWSZM20uF7kqOsj_t4zwgn9eC3eWG2zZlLHdL4U3yBMqjItQOw/exec"; 
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var oltName = sheet.getRange('E4').getValue().toString().trim();
  
  if (!oltName) {
    SpreadsheetApp.getUi().alert('Error', 'Please enter an OLT Name in cell E4.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  if (webAppUrl === "https://script.google.com/macros/s/AKfycbyJule0qJyOS7OZJFuBHWSZM20uF7kqOsj_t4zwgn9eC3eWG2zZlLHdL4U3yBMqjItQOw/exec" || !webAppUrl) {
    SpreadsheetApp.getUi().alert('Setup Required', 'Please deploy the Web App and paste the Web App URL into line 6 of the script.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  try {
    var response = UrlFetchApp.fetch(webAppUrl + "?oltName=" + encodeURIComponent(oltName));
    var data = JSON.parse(response.getContentText());

    clearResultsTable(sheet);

    if (data.results && data.results.length > 0) {
      sheet.getRange(11, 1, data.results.length, 7).setValues(data.results);
      sheet.getRange('A9').setValue('Last Search: ' + new Date().toLocaleString() + ' | Query: "' + oltName + '" | Matches Found: ' + data.results.length);
      SpreadsheetApp.getUi().alert('Success', data.results.length + ' latest email update(s) loaded into dashboard.', SpreadsheetApp.getUi().ButtonSet.OK);
    } else if (data.error) {
      SpreadsheetApp.getUi().alert('Error', data.error, SpreadsheetApp.getUi().ButtonSet.OK);
    } else {
      sheet.getRange('A9').setValue('Last Search: ' + new Date().toLocaleString() + ' | Query: "' + oltName + '" | Matches Found: 0');
      SpreadsheetApp.getUi().alert('No Results', 'No matching emails found for: ' + oltName, SpreadsheetApp.getUi().ButtonSet.OK);
    }
  } catch (err) {
    SpreadsheetApp.getUi().alert('Error', 'Failed to execute search: ' + err.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Web App endpoint running under YOUR account.
 */
function doGet(e) {
  var oltName = (e && e.parameter && e.parameter.oltName) ? e.parameter.oltName.trim() : '';

  if (!oltName) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: 'Missing required parameter: oltName. Usage: ?oltName=YOUR_SEARCH' 
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var query = '"' + oltName + '"';
  var threads = GmailApp.search(query, 0, 50);
  var results = [];

  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    var msg = messages[messages.length - 1]; 
    var body = msg.getPlainBody() || '';
    var subject = msg.getSubject() || '';
    
    if (body.toLowerCase().includes(oltName.toLowerCase()) || subject.toLowerCase().includes(oltName.toLowerCase())) {
      var sfdcTicket = extractFieldValue(body, 'SFDC Ticket ID');
      var status = extractFieldValue(body, 'Ticket Status');
      var affectedNodes = extractFieldValue(body, 'Affected Nodes/Links');
      var latestUpdate = extractFieldValue(body, 'Update');

      results.push([
        msg.getDate().toLocaleString(),
        msg.getFrom(),
        subject,
        sfdcTicket || 'N/A',
        status || 'N/A',
        affectedNodes || 'N/A',
        latestUpdate || body.substring(0, 100).replace(/\s+/g, ' ') + '...'
      ]);
    }
  }

  results.sort(function(a, b) { 
    return new Date(b[0]) - new Date(a[0]); 
  });

  return ContentService.createTextOutput(JSON.stringify({ results: results }))
    .setMimeType(ContentService.MimeType.JSON);
}

function extractFieldValue(text, labelName) {
  var regex = new RegExp(labelName + '\\s*:?\\s*\t*([^\r\n]+)', 'i');
  var match = text.match(regex);
  return match ? match[1].trim() : '';
}

function clearResultsTable(sheet) {
  if (!sheet) { sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet(); }
  var lastRow = sheet.getLastRow();
  if (lastRow >= 11) { sheet.getRange(11, 1, lastRow - 10, 7).clearContent(); }
  sheet.getRange('A9').setValue('Last Search: None');
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📡 OLT Search Dashboard')
    .addItem('🎨 Setup Dashboard Design', 'setupDashboardLayout')
    .addItem('Search OLT from Cell E4', 'searchOltFromDashboard')
    .addItem('Clear Results Table', 'clearResultsTable')
    .addToUi();
}

/**
 * Automatically applies the design layout matching the image provided.
 */
function setupDashboardLayout() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clear();
  
  var softBlue = '#D0E1F9';
  var borderGray = '#666666';

  // 1. Title Banner: OUTAGE DASHBOARD
  var titleRange = sheet.getRange('B2:H2');
  titleRange.merge();
  titleRange.setValue('OUTAGE DASHBOARD');
  titleRange.setBackground(softBlue);
  titleRange.setFontSize(20);
  titleRange.setFontWeight('bold');
  titleRange.setHorizontalAlignment('center');
  titleRange.setVerticalAlignment('middle');
  titleRange.setBorder(true, true, true, true, false, false, borderGray, SpreadsheetApp.BorderStyle.SOLID);
  sheet.setRowHeight(2, 55);

  // 2. Label: Type OLTName:
  var labelRange = sheet.getRange('B4:D4');
  labelRange.merge();
  labelRange.setValue('Type OLTName:');
  labelRange.setFontSize(14);
  labelRange.setFontWeight('normal');
  labelRange.setHorizontalAlignment('right');
  labelRange.setVerticalAlignment('middle');

  // 3. Input Box (E4)
  var inputArea = sheet.getRange('E4:H4');
  inputArea.merge();
  inputArea.setBackground(softBlue);
  inputArea.setFontSize(14);
  inputArea.setHorizontalAlignment('left');
  inputArea.setVerticalAlignment('middle');
  inputArea.setBorder(true, true, true, true, false, false, borderGray, SpreadsheetApp.BorderStyle.SOLID);
  sheet.setRowHeight(4, 45);

  // 4. SEARCH Button Placeholder (C6:D6)
  var buttonRange = sheet.getRange('C6:D6');
  buttonRange.merge();
  buttonRange.setValue('SEARCH');
  buttonRange.setBackground(softBlue);
  buttonRange.setFontSize(12);
  buttonRange.setFontWeight('bold');
  buttonRange.setHorizontalAlignment('center');
  buttonRange.setVerticalAlignment('middle');
  buttonRange.setBorder(true, true, true, true, false, false, borderGray, SpreadsheetApp.BorderStyle.SOLID);
  sheet.setRowHeight(6, 35);

  // 5. Table Headers
  var headers = [['Date/Time', 'From', 'Subject', 'SFDC Ticket ID', 'Ticket Status', 'Affected Nodes/Links', 'Latest Update']];
  var headerRange = sheet.getRange('A10:G10');
  headerRange.setValues(headers);
  headerRange.setBackground('#4A90E2');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');

  sheet.getRange('A9').setValue('Last Search: None').setFontStyle('italic').setFontSize(10);
  
  SpreadsheetApp.getUi().alert('Dashboard design successfully applied!');
}
