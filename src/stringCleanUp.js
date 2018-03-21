const toTitleCase = str =>
  str.replace(
    /\w\S*/g,
    txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
const replaceUmlats = str => {
  const umlatReplacements = { ä: "a", â: "a", ü: "u", ö: "o", ß: "ss" };
  return str.replace(
    new RegExp(`[${Object.keys(umlatReplacements).join()}]`, "g"),
    match => umlatReplacements[match]
  );
}
const removeSpecialChars = str =>
  str.replace(/[^\w\s&amp;]/gi, "").replace(/\B&amp;\B/gi, "&");

const cleanUp = str => toTitleCase(removeSpecialChars(replaceUmlats(str)));

module.exports = { cleanUp };
