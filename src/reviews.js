const { flatten } = require("ramda");
const { dom } = require("./read");
const {
  pitchforkReducer,
  stereogumReucer,
  metacriticReducer
} = require("./reducers");
const { collectReviews, collectReviewsAndScores } = require("./collectors");

const getMetacriticReviews = () => {
  return dom(
    "https://www.metacritic.com/browse/albums/release-date/new-releases/date"
  ).then(metacriticReducer, console.error);
};

const getPitchforkReviews = () =>
  collectReviewsAndScores(
    "https://pitchfork.com/rss/reviews/albums/",
    pitchforkReducer
  );

const getStereogumReviews = () =>
  collectReviews(
    "https://www.stereogum.com/heavy-rotation/feed/",
    stereogumReucer
  );

const getAllReviews = async () => {
  const allReviews = await Promise.all([
    getPitchforkReviews(),
    getMetacriticReviews(),
    getStereogumReviews()
  ]);
  return flatten(allReviews);
};

module.exports = {
  getAllReviews
};
