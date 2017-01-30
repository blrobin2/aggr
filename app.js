const path    = require('path');
const express = require('express');
const app     = express();
const fs      = require('fs');

app.use(express.static('public'));
app.set('view engine', 'pug');

const getJson = url =>
  new Promise((res, rej) =>
    fs.readFile(path.join(__dirname, 'public', url), (err, content) => {
      if (err) rej(err);
      res(JSON.parse(content));
    })
  );

// Routes
app.get('/', function (req, res) {
  getJson('albums.json').then(content => {
    res.render('list', {
      title: '',
      albums: content.albums
    });
  });
});

app.get('/january', function (req, res) {
  getJson('jan.json').then(content => {
    res.render('list', {
      title: 'January',
      albums: content.albums
    });
  });
});

app.listen(process.env.PORT || 8080);