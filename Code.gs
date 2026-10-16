Conversation with Gemini

please design the script with this sample desgn

Here is a complete, single-file HTML/CSS/JS template matching your design mock-up:

HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Outage Dashboard</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
        }

        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #ffffff;
        }

        .dashboard-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 25px;
            width: 100%;
            max-width: 600px;
            padding: 20px;
        }

        /* Large Header Block */
        .title-box {
            width: 100%;
            background-color: #dbe7f5;
            border: 1px solid #000000;
            border-radius: 20px;
            padding: 30px;
            text-align: center;
        }

        .title-box h1 {
            font-size: 28px;
            font-weight: normal;
            color: #000000;
            letter-spacing: 1px;
        }

        /* Input Field Block */
        .input-box {
            width: 70%;
            background-color: #dbe7f5;
            border: 1px solid #000000;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #000000;
            outline: none;
        }

        .input-box::placeholder {
            color: #000000;
            text-align: center;
        }

        /* Search Button */
        .search-btn {
            background-color: #dbe7f5;
            border: 1px solid #000000;
            padding: 10px 30px;
            font-size: 14px;
            color: #000000;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }

        .search-btn:hover {
            background-color: #c5daee;
        }
    </style>
</head>
<body>

    <div class="dashboard-container">
        <!-- Header -->
        <div class="title-box">
            <h1>OUTAGE DASHBOARD</h1>
        </div>

        <!-- Input -->
        <input 
            type="text" 
            id="oltInput" 
            class="input-box" 
            placeholder="TYPE OLT NAME" 
            autocomplete="off"
        />

        <!-- Button -->
        <button class="search-btn" onclick="handleSearch()">SEARCH</button>
    </div>

    <script>
        function handleSearch() {
            const oltName = document.getElementById('oltInput').value.trim();
            if (oltName) {
                alert(`Searching outage for OLT: ${oltName}`);
                // Add your search logic or redirection here
            } else {
                alert('Please enter an OLT Name');
            }
        }
    </script>

</body>
</html>
this is may existing script
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
Here is the complete Apps Script designed to work seamlessly with your Google Sheets layout based on the design mockup.

What Was Updated:
Cell Locations Aligned to Mockup:

Title Banner (A1:G3): Styled block labeled "OUTAGE DASHBOARD".

Input Box (C5:E5): Merged center block for "TYPE OLT NAME".

Search Button Trigger: Linked directly to searchOltFromDashboard() via script or sheet menu.

Status / Last Search Bar (A7:G7): Displays search metadata and match count.

Results Table (A9:G9 and row 10+): Displays extracted Gmail data.

Complete Google Apps Script
JavaScript
/**
 * Main function triggered by clicking the "SEARCH" button in Google Sheets.
 */
function searchOltFromDashboard() {
  var webAppUrl = "https://script.google.com/macros/s/AKfycbyJule0qJyOS7OZJFuBHWSZM20uF7kqOsj_t4zwgn9eC3eWG2zZlLHdL4U3yBMqjItQOw/exec"; 
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // OLT Input value extracted from cell C5 (center block from mockup)
  var oltName = sheet.getRange('C5').getValue().toString().trim();
  
  if (!oltName || oltName === "TYPE OLT NAME") {
    SpreadsheetApp.getUi().alert('Error', 'Please type a valid OLT Name in the input box.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  if (!webAppUrl || webAppUrl.includes("YOUR_WEB_APP_URL_HERE")) {
    SpreadsheetApp.getUi().alert('Setup Required', 'Please ensure your deployed Web App URL is correctly set on line 6.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  try {
    var response = UrlFetchApp.fetch(webAppUrl + "?oltName=" + encodeURIComponent(oltName));
    var data = JSON.parse(response.getContentText());

    clearResultsTable(sheet);

    if (data.results && data.results.length > 0) {
      // Write fetched records starting at Row 10 across 7 columns (A to G)
      sheet.getRange(10, 1, data.results.length, 7).setValues(data.results);
      sheet.getRange('A7').setValue('Last Search: ' + new Date().toLocaleString() + ' | Query: "' + oltName + '" | Matches Found: ' + data.results.length);
      SpreadsheetApp.getUi().alert('Success', data.results.length + ' latest email update(s) loaded into dashboard.', SpreadsheetApp.getUi().ButtonSet.OK);
    } else if (data.error) {
      SpreadsheetApp.getUi().alert('Error', data.error, SpreadsheetApp.getUi().ButtonSet.OK);
    } else {
      sheet.getRange('A7').setValue('Last Search: ' + new Date().toLocaleString() + ' | Query: "' + oltName + '" | Matches Found: 0');
      SpreadsheetApp.getUi().alert('No Results', 'No matching emails found for: ' + oltName, SpreadsheetApp.getUi().ButtonSet.OK);
    }
  } catch (err) {
    SpreadsheetApp.getUi().alert('Error', 'Failed to execute search: ' + err.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Web App endpoint running under your account to query Gmail.
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

/**
 * Helper to parse labeled values out of email bodies.
 */
function extractFieldValue(text, labelName) {
  var regex = new RegExp(labelName + '\\s*:?\\s*\t*([^\r\n]+)', 'i');
  var match = text.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Clears search results from Row 10 downwards.
 */
function clearResultsTable(sheet) {
  if (!sheet) { sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet(); }
  var lastRow = sheet.getLastRow();
  if (lastRow >= 10) { sheet.getRange(10, 1, lastRow - 9, 7).clearContent(); }
  sheet.getRange('A7').setValue('Last Search: None');
}

/**
 * Automatically builds the layout in your Google Sheet matching the design mockup.
 */
function setupDashboardUI() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clear();
  sheet.gridlines = true;

  // Set Column Widths for a balanced layout
  sheet.setColumnWidth(1, 140); // Date
  sheet.setColumnWidth(2, 180); // Sender
  sheet.setColumnWidth(3, 220); // Subject
  sheet.setColumnWidth(4, 130); // SFDC Ticket
  sheet.setColumnWidth(5, 120); // Status
  sheet.setColumnWidth(6, 160); // Affected Nodes
  sheet.setColumnWidth(7, 300); // Latest Update

  // 1. OUTAGE DASHBOARD Title Block (A1:G3)
  var titleRange = sheet.getRange('A1:G3');
  titleRange.merge();
  titleRange.setValue('OUTAGE DASHBOARD');
  titleRange.setFontSize(22);
  titleRange.setFontWeight('bold');
  titleRange.setHorizontalAlignment('center');
  titleRange.setVerticalAlignment('middle');
  titleRange.setBackground('#D0E1F9');
  titleRange.setBorder(true, true, true, true, false, false, '#4A90E2', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // 2. TYPE OLT NAME Input Block (C5:E5)
  var inputRange = sheet.getRange('C5:E5');
  inputRange.merge();
  inputRange.setValue(''); // Empty for typing
  inputRange.setFontSize(12);
  inputRange.setHorizontalAlignment('center');
  inputRange.setVerticalAlignment('middle');
  inputRange.setBackground('#E8F1F5');
  inputRange.setBorder(true, true, true, true, false, false, '#4A90E2', SpreadsheetApp.BorderStyle.SOLID);
  
  // Note hint above input box
  sheet.getRange('C4').setValue('▼ Enter OLT Name Below ▼').setFontSize(9).setFontItalic(true).setHorizontalAlignment('center');

  // 3. SEARCH Button Block (D6)
  var btnCell = sheet.getRange('D6');
  btnCell.setValue('🔎 SEARCH');
  btnCell.setFontWeight('bold');
  btnCell.setHorizontalAlignment('center');
  btnCell.setVerticalAlignment('middle');
  btnCell.setBackground('#D0E1F9');
  btnCell.setBorder(true, true, true, true, false, false, '#4A90E2', SpreadsheetApp.BorderStyle.SOLID);

  // 4. Status Bar (A7:G7)
  var statusRange = sheet.getRange('A7:G7');
  statusRange.merge();
  statusRange.setValue('Last Search: None');
  statusRange.setFontSize(10);
  statusRange.setFontItalic(true);
  statusRange.setHorizontalAlignment('left');

  // 5. Results Table Headers (A9:G9)
  var headers = [['Date/Time', 'From', 'Subject', 'SFDC Ticket ID', 'Status', 'Affected Nodes/Links', 'Latest Update']];
  var headerRange = sheet.getRange('A9:G9');
  headerRange.setValues(headers);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4A90E2');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  
  SpreadsheetApp.getUi().alert('Dashboard Layout Created!', 'Your layout matching the mockup design has been created successfully.', SpreadsheetApp.getUi().ButtonSet.OK);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📡 OLT Dashboard')
    .addItem('Build/Reset UI Layout', 'setupDashboardUI')
    .addItem('Search OLT Outages', 'searchOltFromDashboard')
    .addItem('Clear Results', 'clearResultsTable')
    .addToUi();
}
Instructions to Set Up:
In your Google Sheet, go to Extensions > Apps Script.

Replace all existing code with the script above and save.

Reload your Google Sheet. A new menu named 📡 OLT Dashboard will appear.

Click 📡 OLT Dashboard > Build/Reset UI Layout to automatically generate the styled layout (Header, Input box, Search button location, and Results table).

Assign searchOltFromDashboard to the drawing button or simply use the top menu to run searches.

Skip to the latest Gemini result
