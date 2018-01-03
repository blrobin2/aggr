const getToday = () => new Date(Date.now());
const getPubDate = item => new Date(Date.parse(item.pubDate));
const dateString = pubDate => pubDate.toDateString().slice(4);

module.exports = {
  getToday,
  getPubDate,
  dateString
}