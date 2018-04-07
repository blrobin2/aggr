const R = require("ramda");

const { cleanUp } = require("./stringCleanUp");
const {
  getToday,
  getPubDate,
  dateString,
  cameOutThisMonth
} = require("./dateFormatting");
const { getFromDom } = require("./read");
const today = getToday();

const pitchforkReducer = (results, collection) =>
  results.reduce((acc, html, i) => {
    const score = parseFloat(html.$(".score").html());
    const bnmText = html.$(".bnm-txt").html() || "";
    const pubDate = getPubDate(collection[i]);
    const SUNDAY = 0;

    if (
      score > 7.8 &&
      cameOutThisMonth(pubDate, today) &&
      pubDate.getDay() !== SUNDAY &&
      bnmText != "Best new reissue"
    ) {
      let [artist, album] = collection[i].title[0].split(": ");
      if (artist === "Songs" && album === "Ohia") {
        artist = "Songs:Ohia";
        album = collection[i].title[0].split(": ")[2];
      }
      if (!album) {
        album = artist;
        artist = "";
      }
      if (artist === "Album Review") {
        [artist, album] = album.split(" - ");
      }
      return acc.concat({
        artist: cleanUp(artist),
        album: cleanUp(album),
        date: dateString(pubDate)
      });
    }

    return acc;
  }, []);

const getArtistAndAlbumStereogum = R.compose(
  R.split(" - "),
  R.head,
  R.prop("title")
);

const checkAlbumStereogum = R.ifElse(
  () => cameOutThisMonth(getPubDate(R.__), today),
  () => {
    const [artist, album] = getArtistAndAlbumStereogum(R.__);
    return album
      ? [
          {
            artist: cleanUp(artist),
            album: cleanUp(album),
            date: getPubDate(R.__)
          }
        ]
      : [];
  },
  R.always([])
);

const stereogumReducer = R.reduce(
  (acc, album) => R.concat(checkAlbumStereogum(album), acc),
  []
);

const metacriticReducer = html => {
  const albums = [];
  const currentYear = today.getFullYear();

  html.$(".release_product").each((index, li) => {
    const score = getFromDom(li, ".metascore_w");
    const pubDate = new Date(getFromDom(li, ".release_date > .data"));
    pubDate.setFullYear(currentYear);

    if (parseInt(score) > 80 && cameOutThisMonth(pubDate, today)) {
      const album = getFromDom(li, ".product_title > a");
      const artist = getFromDom(li, ".product_artist > .data");
      albums.push({
        artist: cleanUp(artist),
        album: cleanUp(album),
        date: dateString(pubDate)
      });
    }
  });

  return albums;
};

module.exports = {
  pitchforkReducer,
  stereogumReducer,
  metacriticReducer
};
