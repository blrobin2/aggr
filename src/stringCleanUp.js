const toTitleCase = str =>
  str.replace(
    /\w\S*/g,
    txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
const umlatReplacements = { ä: "a", ü: "u", ö: "o", ß: "ss" };
const replaceUmlats = str =>
  str.replace(/[äöüß]/g, match => umlatReplacements[match]);
const removeSpecialChars = str =>
  str.replace(/[^\w\s&amp;]/gi, "").replace(/\B&amp;\B/gi, "&");

const cleanUp = str => toTitleCase(removeSpecialChars(replaceUmlats(str)));

module.exports = { cleanUp };