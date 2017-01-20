const http        = require('http');
const path        = require('path');
const xml2js      = require('xml2js');
const concat      = require('concat-stream');
const jsdom       = require('jsdom');
const ProgressBar = require('progress');
const _           = require('lodash');
const jsonfile    = require('jsonfile');
const parser      = new xml2js.Parser();
parser.on('err', console.error);

const getXmlParse = (url, title) =>
  new Promise((res, rej) =>
    http.get(url, response => {
      response.on('error', err => rej(err));

      // const len = parseInt(response.headers['content-length'], 10);

      // const bar = new ProgressBar('   downloading ' + title + ' [:bar] :percent :etas', {
      //   complete: '=',
      //   incomplete: ' ',
      //   width: 20,
      //   total: len
      // });

      // response.on('data', function (chunk) {
      //   bar.tick(chunk.length);
      // });

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

const today              = new Date(Date.now());
const items              = xmlObj => xmlObj.rss.channel[0].item;
const getUrlPromise      = item => getjQueryDom(item.link[0]);
const getPubDate         = item => new Date(Date.parse(item.pubDate));
const dateString         = pubDate => pubDate.toDateString().slice(4);
const toTitleCase        = str => str.replace(/\w\S*/g, txt =>
  txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
const removeSpecialChars = str => str.replace(/[^\w\s]/gi, '');
const cleanUp            = str => toTitleCase(removeSpecialChars(str));

// The final collection of albums
let allAlbums = [];

// Collector where need to fetch scores
const buildReviewCollector = (url, title, reducer) =>
  getXmlParse(url, title)
    .then(xmlObj => {
      if (typeof xmlObj === 'undefined') {
        console.log('I am fucking undefined');
      } else {
        console.log('I am not fucking undefined');
      }
      const collection  = items(xmlObj);
      const urlPromises = collection.map(getUrlPromise);

      return Promise.all(urlPromises)
        .then(results => reducer(results, collection))
        .then(albums => {
          allAlbums = allAlbums.concat(albums);
        });
    },
    error => console.error(error));

// Collector where no need to fetch scores
const buildCollector = (url, title, reducer) =>
  getXmlParse(url, title)
    .then(xmlObj => {
      const collection = items(xmlObj);

      return Promise.resolve(collection)
        .then(reducer)
        .then(albums => {
          allAlbums = allAlbums.concat(albums);
        });
    },
    console.error);

const metacriticReducer = (results, collection) =>
  results.reduce((acc, html, i) => {
    const score   = parseInt(html.$('[itemprop=ratingValue]').html());
    const pubDate = getPubDate(collection[i]);

    if (score > 80
      && today.getMonth() === pubDate.getMonth()
    ) {
      const [album, artist] = collection[i].title[0].split(' by ');
      return acc.concat({
        artist: cleanUp(artist),
        album: cleanUp(album),
        date: dateString(pubDate)
      });
    }

    return acc;
  }, []);

const pitchforkReducer = (results, collection) =>
  results.reduce((acc, html, i) => {
    const score   = parseFloat(html.$('.score').html());
    const bnmText = html.$('.bnm-txt').html() || '';
    const pubDate = getPubDate(collection[i]);
    const SUNDAY  = 0;

    if (score > 7.8
      && today.getMonth() === pubDate.getMonth()
      && pubDate.getDay() !== SUNDAY
      && bnmText !== 'Best new reissue'
    ) {
      const [artist, album] = collection[i].title[0].split(': ');
      return acc.concat({
        artist: cleanUp(artist),
        album: cleanUp(album),
        date: dateString(pubDate)
      });
    }

    return acc;
  }, []);

const cosReducer = (results, items) =>
  results.reduce((acc, html, i) => {
    const acceptedScale = ['B', 'B+', 'A-', 'A', 'A+'];
    const score = html.$('.grade-badge').html();
    const pubDate = getPubDate(items[i]);

    if (acceptedScale.includes(score)
      && today.getMonth() === pubDate.getMonth()
    ) {
      const [_, artistAlbum] = items[i].title[0].split(': ');
      const [artist, album] = artistAlbum.split(' – ');
      return acc.concat({
        artist: cleanUp(artist),
        album: cleanUp(album),
        date: dateString(pubDate)
      });
    }

    return acc;
  }, []);

const stereogumReucer = (items) =>
  items.reduce((acc, item) => {
    const pubDate = getPubDate(item);

    if (today.getMonth() === pubDate.getMonth()) {
      const [artist, album] = item.title[0].split(' – ');
      return acc.concat({
        artist: cleanUp(artist),
        album: album ? cleanUp(album) : '',
        date: dateString(pubDate)
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

const getCosReviews = () =>
  buildReviewCollector(
    'http://consequenceofsound.net/category/reviews/album-reviews/feed/',
    'consequence of sound',
    cosReducer
  );

const getStereogumReviews = () =>
  buildCollector(
    'http://www.stereogum.com/heavy-rotation/feed/',
    'stereogum',
    stereogumReucer
  );

Promise.all([
    getPitchforkReviews(),
    //getMetacriticReviews(),
    getCosReviews(),
    getStereogumReviews()
  ])
  .then(() =>
    writeJson('./public/albums.json', {albums: _.uniqBy(allAlbums, 'album')}),
    console.error)
  .then(reply => console.log(reply));