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
app.get('/favicon.ico', function(req, res) {
  res.sendFile('favicon.ico', { root: __dirname + "/public" }, err => {
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
  const [year, month] = filename.split('/');
  return `${toTitleCase(month)} ${year}`;
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

    const months = getMonths();
    const years = getYearsActive();
    const currentYear = getCurrentYear();
    const monthsSoFarThisYear = getMonthsSoFarThisYear();

    res.render("main", {
      title,
      month,
      albums,
      months,
      years,
      currentYear,
      monthsSoFarThisYear
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
  return (new Date()).getFullYear();
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
  const currentMonth = (new Date()).getMonth();
  const months = getMonths();
  return months.slice(Math.max(months.length - currentMonth, 1));
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
