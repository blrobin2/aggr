module.exports = function(wallaby) {
  return {
    files: [
      {
        pattern: "node_modules/babel-polyfill/dist/polyfill.js",
        instrument: false
      },
      "src/*.js"
    ],
    tests: ["tests/*.test.js"],
    compilers: { "src/*.js": wallaby.compilers.babel() },
    env: { type: "node", runner: "node" },
    testFramework: "jest",
    debug: true
  };
};
