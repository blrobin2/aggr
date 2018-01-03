const { xml, dom } = require("./read");

const items = xmlObj => xmlObj.rss.channel[0].item;
const getUrlPromise = item => dom(item.link[0]);

const collectReviewsAndScores = (url, reducer) =>
  xml(url).then(xmlObj => {
    const collection = items(xmlObj);
    const urlPromises = collection.map(getUrlPromise);

    return Promise.all(urlPromises).then(results =>
      reducer(results, collection)
    );
  }, console.error);

const collectReviews = (url, reducer) =>
  xml(url).then(xmlObj => {
    const collection = items(xmlObj);

    return Promise.resolve(collection).then(reducer);
  }, console.error);

module.exports = {
  collectReviews,
  collectReviewsAndScores
};
