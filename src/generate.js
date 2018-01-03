
const { getAllReviews } = require("./reviews");
const { writeAlbumsToJson } = require("./write");

async function generateReviewsJson() {
  try {
    const allAlbums = await getAllReviews();
    return await writeAlbumsToJson(allAlbums);
  } catch (e) {
    console.error(e);
  }
}

generateReviewsJson().then(console.log);
