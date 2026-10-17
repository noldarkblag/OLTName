function doGet() {
  return HtmlService.createHtmlOutputFromFile('index');
}

function searchGmail(oltName) {
  try {
    // Naghahanap sa tiyak na Gmail Label/Folder na 'gnoc' at kasama ang OLT Name
    // Pwedeng gamitin ang `label:gnoc` o `label:"gnoc"`
    var query = 'label:gnoc ' + oltName;
    
    // Kukuhanin ang mga matching threads
    var threads = GmailApp.search(query, 0, 10);
    var results = [];

    if (threads.length === 0) {
      return { results: [] };
    }

    threads.forEach(function(thread) {
      var messages = thread.getMessages();
      // Kuhain ang pinakabagong email sa thread
      var message = messages[messages.length - 1]; 
      var body = message.getPlainBody();

      results.push({
        subject: message.getSubject(),
        sfdcTicket: extractField(body, 'SFDC Ticket ID'),
        cmsTicket: extractField(body, 'CMS Ticket ID'),
        affectedArea: extractField(body, 'Affected Service/Area'),
        affectedNodes: extractField(body, 'Affected Nodes/Links'),
        affectedUsers: extractField(body, 'Affected Users'),
        startTime: extractField(body, 'Start Time'),
        completionTime: extractField(body, 'Completion Time'),
        ticketStatus: extractField(body, 'Ticket Status')
      });
    });

    return { results: results };
  } catch (e) {
    return { error: e.toString() };
  }
}

// Helper function para mag-extract ng data sa tabi ng label mula sa email text
function extractField(text, labelName) {
  // Naghahanap ng format na "Label Name: Value"
  var regex = new RegExp(labelName + '\\s*:\\s*(.*)', 'i');
  var match = text.match(regex);
  return match ? match[1].trim() : 'N/A';
}
