require("dotenv").config();
const path = require("path");
const express = require("express");
const app = express();
const fs = require("fs");
const R = require("ramda");
const SpotifyWebApi = require("spotify-web-api-node");
const { MongoClient } = require('mongodb');

const { toTitleCase } = require("./src/stringCleanUp");

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

app.use(express.static("public"));
app.set("view engine", "pug");

// Routes
app.get("/favicon.ico", function(req, res) {
  res.sendFile("favicon.ico", { root: path.join(__dirname, "public") }, err => {
    if (err) {
      console.error(err);
    }
  });
});

app.get("*", function(req, res) {
  const filename = getFilenameFromUrl(req.url);
  const title = getTitle(filename);
  renderWithSpotify(res, title, filename);
});

function getFilenameFromUrl(url) {
  return url.replace("/", "") || undefined;
}

function getTitle(filename) {
  return filename ? translateFileNameToTitle(filename) : "Current Month";
}

function translateFileNameToTitle(filename) {
  const [year, month] = filename.split("/");
  return `${toTitleCase(month)} ${year}`;
}

async function renderWithSpotify(res, title, month = "albums") {
  try {
    const [access, albumJson] = await Promise.all([
      spotifyApi.clientCredentialsGrant(),
      getJson(`${month}.json`)
    ]);

    spotifyApi.setAccessToken(access.body.access_token);
    const albums = await getAlbumData(albumJson);

    await writeAlbumsToMongo(albums);

    res.render("main", {
      title,
      month,
      albums,
      months: getMonths(),
      years: getYearsActive(),
      currentYear: getCurrentYear(),
      monthsSoFarThisYear: getMonthsSoFarThisYear()
    });
  } catch (err) {
    console.trace(err);
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
        R.sortWith(
          [R.descend(R.prop("date")), R.ascend(R.prop("artist"))],
          JSON.parse(content).albums
        )
      );
    })
  );

async function getAlbumData(albumJson) {
  return await Promise.all(albumJson.map(lookup));
}

function getMonths() {
  return [
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
}

function getCurrentYear() {
  return new Date().getFullYear();
}

function getYearsActive() {
  const yearStarted = 2017;
  let year = getCurrentYear() - 1;
  const yearsActive = [];
  while (year >= yearStarted) {
    yearsActive.push(year);
    year--;
  }
  return yearsActive;
}

function getMonthsSoFarThisYear() {
  const currentMonth = new Date().getMonth();
  const months = getMonths();
  return months.slice(Math.max(months.length - currentMonth, 1));
}

async function lookup(album) {
  return spotifyApi.searchAlbums(`${album.artist} ${album.album}`).then(
    lookup =>
      lookup.body.albums.items.length
        ? Object.assign({}, album, {
            link: lookup.body.albums.items[0].external_urls.spotify,
            artwork: lookup.body.albums.items[0].images[0].url
          })
        : Object.assign({}, album)
  );
}

async function writeAlbumsToMongo(albums) {
  const getUri = (admin, password) => `mongodb+srv://${admin}:${password}@cluster0-mv18n.mongodb.net/reviews?retryWrites=true&w=majority`;

  const uri = getUri(process.env.MONGO_ADMIN, process.env.MONGO_PASSWORD);
  const client = await MongoClient(uri, { useNewUrlParser: true }).connect();
  const collection = client.db(process.env.MONGO_DB).collection('recommended');
  await collection.deleteMany({});
  await collection.insertMany(albums);
  client.close();
}

app.listen(process.env.PORT || 8080);
