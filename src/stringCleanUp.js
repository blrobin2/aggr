const {
  compose,
  join,
  keys,
  lensIndex,
  of,
  over,
  prop,
  replace,
  toUpper
} = require("ramda");

const toTitleCase = replace(
  /\w\S*/g,
  compose(join(""), over(lensIndex(0), toUpper))
);

const replaceUmlats = (replacements => {
  return replace(new RegExp(of(join(keys(replacements))), "g"), match =>
    prop(match, replacements)
  );
})({
  ä: "a",
  â: "a",
  ã: "a",
  é: "e",
  è: "e",
  ü: "u",
  ö: "o",
  ß: "ss"
});

const removeSpecialChars = compose(
  replace(/\B&amp;\B/gi, "&"),
  replace(/[^\w\s&amp;]/gi, "")
);

const cleanUp = compose(toTitleCase, removeSpecialChars, replaceUmlats);

module.exports = {
  cleanUp,
  toTitleCase
};
