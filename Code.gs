JavaScript
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Outage Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function searchGmail(oltName) {
  if (!oltName) {
    return { error: 'Please enter an OLT Name.' };
  }

  try {
    var query = oltName.trim();
    var threads = GmailApp.search(query, 0, 10);
    var results = [];

    for (var i = 0; i < threads.length; i++) {
      var messages = threads[i].getMessages();
      var msg = messages[messages.length - 1]; 
      var body = msg.getPlainBody() || '';
      var subject = msg.getSubject() || '';

      results.push({
        subject: subject || 'N/A',
        sfdcTicket: extractFieldValue(body, 'SFDC Ticket ID') || extractFieldValue(body, 'SFDC Ticket') || 'N/A',
        cmsTicket: extractFieldValue(body, 'CMS Ticket ID') || extractFieldValue(body, 'CMS Ticket') || 'undefined',
        affectedArea: extractFieldValue(body, 'Affected Service/Area') || extractFieldValue(body, 'Affected Area') || 'N/A',
        affectedNodes: extractFieldValue(body, 'Affected Nodes/Links') || extractFieldValue(body, 'Affected Nodes') || 'N/A',
        affectedUsers: extractFieldValue(body, 'Affected Users') || extractFieldValue(body, 'Affected Users (From IM)') || 'N/A',
        startTime: extractFieldValue(body, 'Start Time') || 'N/A',
        completionTime: extractFieldValue(body, 'Completion Time') || 'N/A',
        ticketStatus: extractFieldValue(body, 'Ticket Status') || 'N/A'
      });
    }

    return { results: results };
  } catch (err) {
    return { error: err.toString() };
  }
}

function extractFieldValue(text, labelName) {
  var regex = new RegExp(labelName + '\\s*:?\\s*\t*([^\r\n]+)', 'i');
  var match = text.match(regex);
  return match ? match[1].trim() : '';
}
