const http   = require('http');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();
const concat = require('concat-stream');
const jsdom  = require('jsdom');
const ProgressBar = require('progress');
const jsonfile = require('jsonfile');

jsonfile.spaces = 4;
const file = './albums.json';

const today = new Date(Date.now());

parser.on('err', console.error);

const getXmlParse = (url, title) => new Promise((res, rej) => http.get(url, response => {
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
}));

const getjQueryDom = url => new Promise((res, rej) => jsdom.env(
  url,
  ["http://code.jquery.com/jquery.js"],
  function (err, window) {
    if (err) rej(err);
    res(window);
  }
));
let allAlbums = [];
const items = xmlObj => xmlObj.rss.channel[0].item;

const dateString = pubDate => new Date(Date.parse(pubDate)).toDateString().slice(4);

const getMetacriticReviews = () => getXmlParse('http://www.metacritic.com/rss/music', 'metacritic')
  .then(xmlObj => {
    const albums = [];
    const array = items(xmlObj);
    const urlPromises = array.map(item => getjQueryDom(item.link[0]));

    return Promise.all(urlPromises).then(results => {
      results.forEach((html, index) => {
        const score = parseInt(html.$('[itemprop=ratingValue]').html());
        const pubDate = new Date(Date.parse(array[index].pubDate));
        if (score > 80 && today.getMonth() === pubDate.getMonth()) {
          const [album, artist] = array[index].title[0].split(' by ');
          albums.push({
            artist: artist,
            album: album,
            date: dateString(array[index].pubDate),
            scores: {
              metacritic: score
            }
          });
        }
      });

      return albums;
    });
  })
  .then(albums => {
    allAlbums = allAlbums.concat(albums);
  });

const getPitchforkReviews = () => getXmlParse('http://pitchfork.com/rss/reviews/albums/', 'pitchfork')
  .then(xmlObj => {
    const albums      = [];
    const array       = items(xmlObj);
    const urlPromises = array.map(item => getjQueryDom(item.link[0]));

    return Promise.all(urlPromises).then(results => {
      results.forEach((html, index) => {
        const score = parseFloat(html.$('.score').html());
        const pubDate = new Date(Date.parse(array[index].pubDate));
        if (score > 7.4 && today.getMonth() === pubDate.getMonth()) {
          const [artist, album] = array[index].title[0].split(':');
          albums.push({
            artist: artist,
            album: album.trim(),
            date: dateString(array[index].pubDate),
            scores: {
              pitchfork: score
            }
          });
        }
      });

      return albums;
    });
  })
  .then(albums => {
    allAlbums = allAlbums.concat(albums);
  });

Promise.all([
  getPitchforkReviews(),
  getMetacriticReviews()
]).then(() => {
  jsonfile.writeFile(file, {albums: allAlbums}, err => {
    if (err) console.error(err);
    console.log('JSON Written!');
  })
});