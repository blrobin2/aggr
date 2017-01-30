const path        = require('path');
const express     = require('express');
const app         = express();

app.use(express.static('public'));

// Routes

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/january', function(req, res) {
  res.sendFile(path.join(__dirname + '/jan.html'));
});

app.listen(process.env.PORT || 8080);