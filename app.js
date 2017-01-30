const path    = require('path');
const express = require('express');
const app     = express();
const fs      = require('fs');
const _       = require('lodash');

app.use(express.static('public'));
app.set('view engine', 'pug');

const getJson = url =>
  new Promise((res, rej) =>
    fs.readFile(path.join(__dirname, 'public', url), (err, content) => {
      if (err) rej(err);
      res(_.orderBy(JSON.parse(content).albums, ['date','artist'], ['desc', 'asc']));
    })
  );

const renderAlbums = (res, url, title) =>
  getJson(url).then(albums => {
    res.render('list', {
      title: title,
      albums: albums
    });
  });

// Routes
app.get('/', function (req, res) {
  renderAlbums(res, 'albums.json', 'Current Month');
});

app.get('/january', function (req, res) {
  renderAlbums(res, 'jan.json', 'January');
});

app.listen(process.env.PORT || 8080);