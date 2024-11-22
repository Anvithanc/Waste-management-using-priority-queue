const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 3000;

// Body parser middleware to handle POST data
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');

// Queue for complaints and resolved complaints stack
let complaintsQueue = [];
let resolvedComplaints = [];

// Serve static files like CSS
app.use(express.static('public'));

// Root Route: Display Complaints and Form
app.get('/', (req, res) => {
  // Sort complaints by priority: High = 1, Medium = 2, Low = 3
  complaintsQueue.sort((a, b) => {
    const priorityMap = { High: 1, Medium: 2, Low: 3 };
    return priorityMap[a.priority] - priorityMap[b.priority]; // High priority first
  });

  res.render('index', {
    complaints: complaintsQueue,
    totalComplaints: complaintsQueue.length
  });
});

// Route to add complaints
app.post('/add-complaint', (req, res) => {
  const { description, priority, area } = req.body;
  
  // Add the new complaint to the queue
  complaintsQueue.push({ description, priority, area });

  // Redirect back to home to show the updated list
  res.redirect('/');
});

// Route to resolve the highest priority complaint (no index needed)
app.post('/resolve-complaint', (req, res) => {
  if (complaintsQueue.length > 0) {
    // Sort complaints by priority before resolving (High priority first)
    complaintsQueue.sort((a, b) => {
      const priorityMap = { High: 1, Medium: 2, Low: 3 };
      return priorityMap[a.priority] - priorityMap[b.priority];
    });

    // Resolve the highest priority complaint (first in the sorted list)
    const resolvedComplaint = complaintsQueue.shift();
    resolvedComplaints.push(resolvedComplaint);

    // Log the resolved complaint to a CSV file
    const logData = `${resolvedComplaint.description},${resolvedComplaint.priority},${resolvedComplaint.area},true\n`;

    fs.appendFile('dailyLog.csv', logData, (err) => {
      if (err) {
        console.error('Error writing to file:', err);
      } else {
        console.log('Resolved complaint logged in CSV');
      }
    });

    // Redirect to the home page to update the complaint list
    res.redirect('/');
  } else {
    res.status(400).send('No complaints to resolve');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
