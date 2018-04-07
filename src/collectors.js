const { compose, head, map, path, prop } = require("ramda");
const { xml, dom } = require("./read");

const items = compose(prop("item"), head, path(["rss", "channel"]));
const getUrlPromise = compose(dom, head, prop("link"));

const collectReviewsAndScores = (url, reducer) =>
  xml(url).then(
    xmlObj =>
      Promise.all(map(getUrlPromise, items(xmlObj))).then(results =>
        reducer(results, items(xmlObj))
      ),
    console.error
  );

const collectReviews = (url, reducer) =>
  xml(url).then(
    xmlObj => Promise.resolve(items(xmlObj)).then(reducer),
    console.error
  );

module.exports = {
  collectReviews,
  collectReviewsAndScores
};
