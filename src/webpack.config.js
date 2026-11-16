const path = require("path");
const base = require("../monero-ts/webpack.base.js");
module.exports = Object.assign({}, base, {
  name: "Grox web wallet",
  context: __dirname,
  entry: process.env.TEST ? "./src/app.test.js" : "./src/app.js",
  devtool: false,
  output: { path: path.resolve(__dirname, process.env.TEST ? "../wwtest" : "public"), filename: "app.js" },
  resolve: Object.assign({}, base.resolve, { modules: [path.resolve(__dirname, "../monero-ts/node_modules"), "node_modules"] }),
  resolveLoader: { modules: [path.resolve(__dirname, "../monero-ts/node_modules")] },
  performance: { hints: false },
});
