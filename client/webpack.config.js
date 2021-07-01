const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
module.exports = {
    entry: "./src/index.ts",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: "/node_modules/",
        },
      ],
    },
    // plugins: [
    //   new HtmlWebpackPlugin({
    //     template: "src/index.html"
    //   })
    // ],
    // devtool: "source-map",
    devServer: {
      contentBase: "./src",
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    output: {
      filename: "index.js",
      path: path.resolve(__dirname, "dist"),
    },
  };