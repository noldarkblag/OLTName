function doGet(e) {
  var oltName = e.parameter.olt;
  
  if (!oltName) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Please provide an OLT Name." }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Tawagin ang search function
  var data = searchGmail(oltName);

  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function searchGmail(oltName) {
  try {
    var query = 'label:gnoc ' + oltName;
    // Naghahanap ng matching threads
    var threads = GmailApp.search(query, 0, 10);

    if (threads.length === 0) {
      return { results: [] };
    }

    // Kuhain LAMANG ang pinakabagong thread (ang unang lumabas sa search)
    var latestThread = threads[0];
    var messages = latestThread.getMessages();
    var latestMessage = messages[messages.length - 1]; // Pinakabagong email sa thread na iyon
    var body = latestMessage.getPlainBody();

    // Isa lang ang ilalagay sa array ng results
    var results = [{
      subject: latestMessage.getSubject(),
      sfdcTicket: extractField(body, 'SFDC Ticket ID'),
      cmsTicket: extractField(body, 'CMS Ticket ID'),
      affectedArea: extractField(body, 'Affected Service/Area'),
      affectedNodes: extractField(body, 'Affected Nodes/Links'),
      affectedUsers: extractField(body, 'Affected Users'),
      startTime: extractField(body, 'Start Time'),
      completionTime: extractField(body, 'Completion Time'),
      ticketStatus: extractField(body, 'Ticket Status')
    }];

    return { results: results };
  } catch (e) {
    return { error: e.toString() };
  }
}

function extractField(text, labelName) {
  var regex = new RegExp(labelName + '\\s*:\\s*(.*)', 'i');
  var match = text.match(regex);
  return match ? match[1].trim() : 'N/A';
}
