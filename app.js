const path    = require('path');
const express = require('express');
const app     = express();
const fs      = require('fs');
const _       = require('lodash');
const SpotifyWebApi = require('spotify-web-api-node');
const config  = require('config');
const async_iter = require('async');

const spotifyApi = new SpotifyWebApi({
  clientId: config.get('spotifyClientId'),
  clientSecret: config.get('spotifyClientSecret')
});

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
      month: url,
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

app.get('/february', function (req, res) {
  renderAlbums(res, 'feb.json', 'February');
});

app.get('/march', function (req, res) {
  renderAlbums(res, 'mar.json', 'March');
});

app.get('/april', function (req, res) {
  renderAlbums(res, 'apr.json', 'April');
});

app.get('/may', function (req, res) {
  renderAlbums(res, 'may.json', 'May');
});


app.get('/on-spotify', async function (req, res) {
  mapped_stuff = [];
  const month = req.query.month || 'albums';

  const [access, month_json] = await Promise.all([
    spotifyApi.clientCredentialsGrant(),
    getJson(`${month}.json`)
  ]);

  spotifyApi.setAccessToken(access.body.access_token);

  async_iter.map(month_json, lookup_album, function(err, mapped_stuff) {
    res.render('list', {
      title: 'Test',
      month: month,
      albums: mapped_stuff
    });
    //res.send(mapped_stuff);
  });
});

function lookup_album(album, cb) {
  spotifyApi.searchAlbums(`${album.artist} ${album.album}`).then(lookup => {
    if (lookup.body.albums.items.length) {
       cb(null, Object.assign({}, album, {
        link: lookup.body.albums.items[0].external_urls.spotify
      }));
     } else {
      cb(null, Object.assign({}, album));
     }
  });
}

app.listen(process.env.PORT || 8080);