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
    var query = 'label:gnoc "' + oltName + '"';
    var threads = GmailApp.search(query, 0, 15);
    var results = [];

    if (threads.length === 0) {
      return { results: [] };
    }

    for (var i = 0; i < threads.length; i++) {
      var messages = threads[i].getMessages();
      var latestMessage = messages[messages.length - 1]; 
      var subject = latestMessage.getSubject();

      if (subject.toLowerCase().indexOf(oltName.toLowerCase()) !== -1) {
        var body = latestMessage.getPlainBody();

        results.push({
          subject: subject,
          sfdcTicket: extractField(body, ['SFDC Ticket ID', 'SFDC Ticket', 'SFDC ID']),
          cmsTicket: extractField(body, ['CMS Ticket ID', 'CMS Ticket', 'CMS ID']),
          affectedArea: extractField(body, ['Affected Service/Area', 'Affected Area', 'Affected Service']),
          affectedNodes: extractField(body, ['Affected Nodes/Links', 'Affected Nodes', 'Affected Links']),
          affectedUsers: extractField(body, ['Affected Users (From IM)', 'Affected Users', 'Users Affected']),
          startTime: extractField(body, ['Start Time', 'Event Start Time', 'Start Date/Time']),
          completionTime: extractField(body, ['Completion Time', 'Estimated Completion Time', 'End Time', 'ETTR']),
          ticketStatus: extractField(body, ['Ticket Status', 'Status'])
        });

        break; // Kuhanin lang ang pinakabagong matching email
      }
    }

    return { results: results };
  } catch (e) {
    return { error: e.toString() };
  }
}

// Improved extraction function
function extractField(text, possibleLabels) {
  if (typeof possibleLabels === 'string') {
    possibleLabels = [possibleLabels];
  }

  for (var i = 0; i < possibleLabels.length; i++) {
    var label = possibleLabels[i];
    
    // Inilalayo sa asterisks, bold markers, at colon, e.g., "*SFDC Ticket ID:* 12345"
    var regex = new RegExp('(?:\\*\\*)?' + label + '(?:\\*\\*)?\\s*[:=-]?\\s*([^\\r\\n]+)', 'i');
    var match = text.match(regex);
    
    if (match && match[1].trim() !== '') {
      // Nililinis ang anumang natitirang markdown formatting
      return match[1].replace(/[\*\_]/g, '').trim();
    }
  }

  return 'N/A';
}
