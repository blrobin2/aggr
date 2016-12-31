const http        = require('http');
const xml2js      = require('xml2js');
const concat      = require('concat-stream');
const jsdom       = require('jsdom');
const ProgressBar = require('progress');
const jsonfile    = require('jsonfile');
const parser      = new xml2js.Parser();
parser.on('err', console.error);

const getXmlParse = (url, title) =>
  new Promise((res, rej) =>
    http.get(url, response => {
      response.on('error', err => rej(err));

      const len = parseInt(response.headers['content-length'], 10);

      const bar = new ProgressBar('   downloading ' + title + ' [:bar] :percent :etas', {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: len
      });

      response.on('data', function (chunk) {
        bar.tick(chunk.length);
      });

      response.pipe(concat(buffer => {
        const str = buffer.toString();
        parser.parseString(str, (err, result) => {
          if (err) rej(err);
          res(result);
        });
      }));
    })
  );

const getjQueryDom = url =>
  new Promise((res, rej) =>
    jsdom.env(
      url,
      ["http://code.jquery.com/jquery.js"],
      function (err, window) {
        if (err) rej(err);
        res(window);
      }
    )
  );

const writeJson = (fileName, data) =>
  new Promise((res, rej) =>
    jsonfile.writeFile(fileName, data, err => {
      if (err) rej(err);
      res('JSON Written!');
    })
  );

const today         = new Date(Date.now());
const items         = xmlObj => xmlObj.rss.channel[0].item;
const getUrlPromise = item => getjQueryDom(item.link[0]);
const getPubDate    = item => new Date(Date.parse(item.pubDate));
const dateString    = pubDate => pubDate.toDateString().slice(4);

// The final collection of albums
let allAlbums = [];

const buildReviewCollector = (url, title, reducer) =>
  getXmlParse(url, title)
    .then(xmlObj => {
      const collection  = items(xmlObj);
      const urlPromises = collection.map(getUrlPromise);

      return Promise.all(urlPromises)
        .then(results => reducer(results, collection))
        .then(albums => {
          allAlbums = allAlbums.concat(albums);
        });
    },
    error => console.error(error));

const metacriticReducer = (results, collection) =>
  results.reduce((acc, html, i) => {
    const score   = parseInt(html.$('[itemprop=ratingValue]').html());
    const pubDate = getPubDate(collection[i]);

    if (score > 80 && today.getMonth() === pubDate.getMonth()) {
      const [album, artist] = collection[i].title[0].split(' by ');
      return acc.concat({
        artist: artist,
        album: album,
        date: dateString(pubDate),
        scores: {
          metacritic: score
        }
      });
    }

    return acc;
  }, []);

const pitchforkReducer = (results, collection) =>
  results.reduce((acc, html, i) => {
    const score   = parseFloat(html.$('.score').html());
    const pubDate = getPubDate(collection[i]);

    if (score > 7.4 && today.getMonth() === pubDate.getMonth()) {
      const [artist, album] = collection[i].title[0].split(': ');
      return acc.concat({
        artist: artist,
        album: album,
        date: dateString(pubDate),
        scores: {
          pitchfork: score
        }
      });
    }

    return acc;
  }, []);

const getMetacriticReviews = () =>
  buildReviewCollector(
    'http://www.metacritic.com/rss/music',
    'metacritic',
    metacriticReducer
  );

const getPitchforkReviews = () =>
  buildReviewCollector(
    'http://pitchfork.com/rss/reviews/albums/',
    'pitchfork',
    pitchforkReducer
  );

Promise.all([
  getPitchforkReviews(),
  getMetacriticReviews()
])
.then(() =>
  writeJson('./albums.json', {albums: allAlbums}))
.then(res => console.log(res));