/* eslint-disable */
const Path = require("path");
const Webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const bodyParser = require('body-parser')

const projectDir = Path.resolve(__dirname, "../");
const buildDir = Path.resolve(projectDir, "build");
const appDir = Path.resolve(projectDir, "src");

const MongoClient = require(`${appDir}/migrator/MongoClient`).default;

const devServerConfig = {
    host: "0.0.0.0",
    port: 8082,
    disableHostCheck: true,
    publicPath: "/",
    contentBase: "public",
    stats: {colors: true},
    setup(app) {
        const mongoClient = new MongoClient();
        mongoClient.connect();
        app.get("/api/lpd/:id", (req, res) => {
            mongoClient.get(req.params.id).then((output) => {res.send(output)});
        });
        app.get("/api/lpd", (req, res) => {
            if (req.query.ids) {
                mongoClient.getAll(req.query.ids.split(",").map((i) => parseInt(i))).then((output) => {res.send(output)})
            // } else if (req.params.startingOffset) {
            //     mongoClient.getAllFromOffset(parseInt(req.query.startingOffset)).then((output) => {res.send(output)})
            } else {
                res.send("Invalid Request");
            }
        });
        app.post("/api/lpd/:id/validate", bodyParser.json(), (req, res) => {
            console.warn(req.body);
            mongoClient.saveValidationResult(req.params.id, req.body).then((output) => {res.send(output)});
        });
    },
    proxy: {
        "/images": {
            target: "https://www.bankbazaar.com",
            secure: false,
            changeOrigin: true
        }
    },
    stats: {
        children: false,
        warnings: false,
        modules: false,
        assets: true,
        entrypoints: true,
        builtAt: true,
        hash: false,
        timings: false,
        version: false
    }
};

module.exports = (env, argv) => {
    return {
        name: "app",
        entry: {
            main: appDir + "/view/app.js"
        },
        output: {
            path: buildDir,
            libraryTarget: "var",
            library: "wc"
        },
        module: {
            rules: [
                {
                    test: /\.jsx?/,
                    include: appDir,
                    use: {
                        loader: "babel-loader",
                    }
                },
                {
                    test: /\.s?css$/,
                    use: ["style-loader", "css-loader", "sass-loader"]
                },
                { 
                    test: /\.(jpg|png|woff|woff2|eot|ttf|svg)$/, 
                    loader: "url-loader" 
                }    
            ]
        },
        plugins: [
            new MiniCssExtractPlugin({filename: "vendor.css"})
        ],
        optimization: {
            runtimeChunk: "single",
            splitChunks: {
                cacheGroups: {
                    commons: {
                        test: /[\\/]node_modules[\\/]/,
                        name: "vendor",
                        chunks: "all"
                    }
                }
            }
        },
        devtool: "inline-source-map",
        devServer: devServerConfig
    };
}
