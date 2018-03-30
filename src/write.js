const jsonfile = require("jsonfile");
const { uniqWith, eqProps } = require("ramda");

const writeJson = (fileName, data) =>
  new Promise((res, rej) =>
    jsonfile.writeFile(fileName, data, err => {
      if (err) rej(err);
      res("JSON Written!");
    })
  );

const uniqueByAlbumName = uniqWith(eqProps('album'));

const writeAlbumsToJson = albums =>
  writeJson("./public/albums.json", {
    albums: uniqueByAlbumName(albums)
  });

module.exports = { writeAlbumsToJson };
