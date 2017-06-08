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
      if (err) {
        rej(err);
        return;
      }
      res(_.orderBy(JSON.parse(content).albums, ['date','artist'], ['desc', 'asc']));
    })
  );

// Routes
app.get('*', function (req, res) {
  const path = req.url.replace('/', '');
  const file = path ? path.substring(0,3).toLowerCase() : undefined;
  const title = path ? path.charAt(0).toUpperCase() + path.slice(1) : 'Current Month';
  renderWithSpotify(res, title, file);
});

async function renderWithSpotify(res, title, month = 'albums') {
  try {
    const [access, month_json] = await Promise.all([
      spotifyApi.clientCredentialsGrant(),
      getJson(`${month}.json`)
    ]);

    spotifyApi.setAccessToken(access.body.access_token);

    async_iter.map(month_json, lookup_album, function(err, albums) {
      if (err) {
        res.render('error', { error })
        return
      }
      res.render('list', {
        title,
        month,
        albums
      });
    });
  } catch (err) {
    res.render('error', { error: err.message })
  }
}

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