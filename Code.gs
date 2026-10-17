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
    // I-search ang Gmail label para sa OLT Name
    var query = 'label:gnoc "' + oltName + '"';
    var threads = GmailApp.search(query, 0, 15);
    var results = [];

    if (threads.length === 0) {
      return { results: [] };
    }

    // Mag-loop sa threads para mahanap ang unang email na may OLT Name sa mismong Subject
    for (var i = 0; i < threads.length; i++) {
      var messages = threads[i].getMessages();
      var latestMessage = messages[messages.length - 1]; // Pinakabagong email sa thread
      var subject = latestMessage.getSubject();

      // Tiyakin na ang Subject ay talagang naglalaman ng eksaktong OLT Name (Case-insensitive)
      if (subject.toLowerCase().indexOf(oltName.toLowerCase()) !== -1) {
        var body = latestMessage.getPlainBody();

        results.push({
          subject: subject,
          sfdcTicket: extractField(body, 'SFDC Ticket ID'),
          cmsTicket: extractField(body, 'CMS Ticket ID'),
          affectedArea: extractField(body, 'Affected Service/Area'),
          affectedNodes: extractField(body, 'Affected Nodes/Links'),
          affectedUsers: extractField(body, 'Affected Users'),
          startTime: extractField(body, 'Start Time'),
          completionTime: extractField(body, 'Completion Time'),
          ticketStatus: extractField(body, 'Ticket Status')
        });

        // Hihinto agad pagkatapos makuha ang pinakabagong valid matching notification
        break; 
      }
    }

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
