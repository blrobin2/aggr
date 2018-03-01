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
  const filename = getFilenameFromUrl(req.url);
  const title = getTitle(filename);
  renderWithSpotify(res, title, filename);
});

function getFilenameFromUrl(url) {
  return url.replace("/", "") || undefined;
}

function getTitle(filename) {
  return filename ? toTitleCase(filename) : "Current Month";
}

function toTitleCase(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function renderWithSpotify(res, title, month = "albums") {
  try {
    const [access, albumJson] = await Promise.all([
      spotifyApi.clientCredentialsGrant(),
      getJson(`${month}.json`)
    ]);

    spotifyApi.setAccessToken(access.body.access_token);
    const albums = await getAlbumData(albumJson);

    const months = [
      "December",
      "November",
      "October",
      "September",
      "August",
      "July",
      "June",
      "May",
      "April",
      "March",
      "February",
      "January"
    ];

    res.render("list", {
      title,
      month,
      albums,
      months
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

async function getAlbumData(albumJson) {
  return await Promise.all(albumJson.map(lookup));
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
