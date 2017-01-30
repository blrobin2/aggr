const path        = require('path');
const express     = require('express');
const app         = express();
const fs          = require('fs');

app.use(express.static('public'));

// Templating
app.engine('ntl', function (filePath, options, callback) {
  fs.readFile(filePath, function (err, content) {
    if (err) return callback(err);
    const rendered = content.toString()
      .replace('#title#', options.title)
      .replace('#json#', options.json);

    return callback(null, rendered);
  });
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ntl');

// Routes
app.get('/', function (req, res) {
  res.render('list', {
    title: '',
    json: 'albums.json'
  });
});

app.get('/january', function (req, res) {
  res.render('list', {
    title: 'January',
    json: 'jan.json'
  });
});

app.listen(process.env.PORT || 8080);