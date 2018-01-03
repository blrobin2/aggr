const { cleanUp } = require("./stringCleanUp");
const { getToday, getPubDate, dateString } = require("./dateFormatting");
const today = getToday();

const cameOutThisMonth = pubDate => pubDate.getMonth() === today.getMonth();

const getFromDom = (node, ...elems) => {
  let elem = node;
  elems.forEach(className => {
    elem = elem.getElementsByClassName(className)[0];
  });
  return elem.innerHTML.trim();
};

const pitchforkReducer = (results, collection) =>
  results.reduce((acc, html, i) => {
    const score = parseFloat(html.$(".score").html());
    const bnmText = html.$(".bnm-txt").html() || "";
    const pubDate = getPubDate(collection[i]);
    const SUNDAY = 0;

    if (
      score > 7.8 &&
      cameOutThisMonth(pubDate) &&
      pubDate.getDay() !== SUNDAY &&
      bnmText != "Best new reissue"
    ) {
      let [artist, album] = collection[i].title[0].split(": ");
      if (!album) {
        album = artist;
        artist = "";
      }
      return acc.concat({
        artist: cleanUp(artist),
        album: cleanUp(album),
        date: dateString(pubDate)
      });
    }

    return acc;
  }, []);

const stereogumReucer = items =>
  items.reduce((acc, item) => {
    const pubDate = getPubDate(item);

    if (cameOutThisMonth(pubDate)) {
      const [artist, album] = item.title[0].split(" – ");
      if (album) {
        return acc.concat({
          artist: cleanUp(artist),
          album: cleanUp(album),
          date: dateString(pubDate)
        });
      }
    }

    return acc;
  }, []);

const metacriticReducer = html => {
  const albums = [];
  const currentYear = today.getFullYear();

  html.$(".release_product").each((index, li) => {
    const album = li
      .getElementsByClassName("product_title")[0]
      .getElementsByTagName("a")[0]
      .innerHTML.trim();
    // const artist = li
    //   .getElementsByClassName("product_artist")[0]
    //   .getElementsByClassName("data")[0]
    //   .innerHTML.trim();
    const artist = getFromDom(li, "product_artist", "data");
    // const score = li
    //   .getElementsByClassName("metascore_w")[0]
    //   .innerHTML.trim();
    const score = getFromDom(li, "metascore_w");
    // const release = li
    //   .getElementsByClassName("release_date")[0]
    //   .getElementsByClassName("data")[0]
    //   .innerHTML.trim();
    const release = getFromDom(li, "release_date", "data");
    const pubDate = new Date(release);
    pubDate.setFullYear(currentYear);

    if (parseInt(score) > 80 && cameOutThisMonth(pubDate)) {
      albums.push({
        artist: cleanUp(artist),
        album: cleanUp(album),
        date: dateString(pubDate)
      });
    }
  });

  return albums;
}

module.exports = {
  pitchforkReducer,
  stereogumReucer,
  metacriticReducer
};