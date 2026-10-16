/**
 * Triggers the Web App execution to search YOUR Gmail inbox regardless of who clicks the button.
 */
function searchOltFromDashboard() {
  // PASTE YOUR WEB APP URL HERE AFTER DEPLOYING (Step 2)
  var webAppUrl = "https://script.google.com/macros/s/AKfycbyJule0qJyOS7OZJFuBHWSZM20uF7kqOsj_t4zwgn9eC3eWG2zZlLHdL4U3yBMqjItQOw/exec"; 
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var oltName = sheet.getRange('B4').getValue().toString().trim();
  
  if (!oltName) {
    SpreadsheetApp.getUi().alert('Error', 'Please enter an OLT Name in cell B4.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  if (webAppUrl === "https://script.google.com/macros/s/AKfycbyJule0qJyOS7OZJFuBHWSZM20uF7kqOsj_t4zwgn9eC3eWG2zZlLHdL4U3yBMqjItQOw/exec" || !webAppUrl) {
    SpreadsheetApp.getUi().alert('Setup Required', 'Please deploy the Web App and paste the Web App URL into line 6 of the script.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  // Call the Web App passing the OLT search query
  try {
    var response = UrlFetchApp.fetch(webAppUrl + "?oltName=" + encodeURIComponent(oltName));
    var data = JSON.parse(response.getContentText());

    clearResultsTable(sheet);

    if (data.results && data.results.length > 0) {
      sheet.getRange(10, 1, data.results.length, 7).setValues(data.results);
      sheet.getRange('A8').setValue('Last Search: ' + new Date().toLocaleString() + ' | Query: "' + oltName + '" | Matches Found: ' + data.results.length);
      SpreadsheetApp.getUi().alert('Success', data.results.length + ' latest email update(s) loaded into dashboard.', SpreadsheetApp.getUi().ButtonSet.OK);
    } else if (data.error) {
      SpreadsheetApp.getUi().alert('Error', data.error, SpreadsheetApp.getUi().ButtonSet.OK);
    } else {
      sheet.getRange('A8').setValue('Last Search: ' + new Date().toLocaleString() + ' | Query: "' + oltName + '" | Matches Found: 0');
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
  // Extract oltName safely from URL parameters
  var oltName = (e && e.parameter && e.parameter.oltName) ? e.parameter.oltName.trim() : '';

  // Return early if oltName is missing
  if (!oltName) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: 'Missing required parameter: oltName. Usage: ?oltName=YOUR_SEARCH' 
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // Construct query & fetch matching threads
  var query = '"' + oltName + '"';
  var threads = GmailApp.search(query, 0, 50);
  var results = [];

  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    var msg = messages[messages.length - 1]; 
    var body = msg.getPlainBody() || '';
    var subject = msg.getSubject() || '';
    
    // Case-insensitive search match
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
  if (lastRow >= 10) { sheet.getRange(10, 1, lastRow - 9, 7).clearContent(); }
  sheet.getRange('A8').setValue('Last Search: None');
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📡 OLT Search Dashboard')
    .addItem('Search OLT from Cell B4', 'searchOltFromDashboard')
    .addItem('Clear Results Table', 'clearResultsTable')
    .addToUi();
}
