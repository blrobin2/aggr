const jsonfile = require("jsonfile");
const _ = require("lodash");

const writeJson = (fileName, data) =>
  new Promise((res, rej) =>
    jsonfile.writeFile(fileName, data, err => {
      if (err) rej(err);
      res("JSON Written!");
    })
  );

const writeAlbumsToJson = albums =>
  writeJson("./public/albums.json", {
    albums: _.uniqBy(albums, "album")
  });

module.exports = { writeAlbumsToJson };