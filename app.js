const path = require("path");
const express = require("express");
const app = express();
const fs = require("fs");
const _ = require("lodash");
const SpotifyWebApi = require("spotify-web-api-node");
const config = require("config");

const spotifyApi = new SpotifyWebApi({
  clientId: config.get("spotifyClientId"),
  clientSecret: config.get("spotifyClientSecret")
});

app.use(express.static("public"));
app.set("view engine", "pug");

// Routes
app.get("*", function(req, res) {
  const file = getFilenameFromUrl(req.url);
  const title = getTitle(file);
  renderWithSpotify(res, title, file);
});

function getFilenameFromUrl(url) {
  return url.replace("/", "") || undefined;
}

function getTitle(file) {
  return file ? file.charAt(0).toUpperCase() + file.slice(1) : "Current Month";
}

async function renderWithSpotify(res, title, month = "albums") {
  try {
    const [access, month_json] = await Promise.all([
      spotifyApi.clientCredentialsGrant(),
      getJson(`${month}.json`)
    ]);

    spotifyApi.setAccessToken(access.body.access_token);
    const albums = await getAlbums(month_json);

    res.render("list", {
      title,
      month,
      albums
    });
  } catch (err) {
    res.render("error", { error: err.message });
  }
}

const getJson = url =>
  new Promise((res, rej) =>
    fs.readFile(path.join(__dirname, "public", url), (err, content) => {
      if (err) {
        rej(err);
        return;
      }
      res(
        _.orderBy(
          JSON.parse(content).albums,
          ["date", "artist"],
          ["desc", "asc"]
        )
      );
    })
  );

async function getAlbums(month_json) {
  return await Promise.all(month_json.map(lookup));
}

function lookup(album) {
  return spotifyApi.searchAlbums(`${album.artist} ${album.album}`).then(
    lookup =>
      lookup.body.albums.items.length
        ? Object.assign({}, album, {
            link: lookup.body.albums.items[0].external_urls.spotify
          })
        : Object.assign({}, album)
  );
}

app.listen(process.env.PORT || 8080);
