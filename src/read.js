const jsdom = require("jsdom");
const https = require("https");
const concat = require("concat-stream");
const xml2js = require("xml2js");
const parser = new xml2js.Parser();
parser.on("err", console.error);

const xml = url =>
  new Promise((res, rej) =>
    https.get(url, response => {
      response.on("error", rej);
      response.pipe(
        concat(buffer => {
          const str = buffer.toString();
          parser.parseString(str, (err, result) => {
            if (err) rej(err);
            res(result);
          });
        })
      );
    })
  );

const dom = url =>
  new Promise((res, rej) =>
    jsdom.env(url, ["http://code.jquery.com/jquery.js"], function(err, window) {
      if (err) rej(err);
      res(window);
    })
  );

module.exports = { xml, dom };
