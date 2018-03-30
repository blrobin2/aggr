const { compose } = require("ramda");

const toTitleCase = str =>
  str.replace(
    /\w\S*/g,
    txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
const replaceUmlats = str => {
  const umlatReplacements = {
    ä: "a",
    â: "a",
    é: "e",
    è: "e",
    ü: "u",
    ö: "o",
    ß: "ss"
  };
  return str.replace(
    new RegExp(`[${Object.keys(umlatReplacements).join()}]`, "g"),
    match => umlatReplacements[match]
  );
};
const removeSpecialChars = str =>
  str.replace(/[^\w\s&amp;]/gi, "").replace(/\B&amp;\B/gi, "&");

const cleanUp = compose(toTitleCase, removeSpecialChars, replaceUmlats);

module.exports = {
  cleanUp,
  toTitleCase
};
