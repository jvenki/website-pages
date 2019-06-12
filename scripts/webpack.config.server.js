/* eslint-disable */
const Path = require("path");
const Webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HTMLWebpackPlugin = require("html-webpack-plugin");

const projectDir = Path.resolve(__dirname, "../");
const buildDir = Path.resolve(projectDir, "build");
const appDir = Path.resolve(projectDir, "src");

const Database = require(`${appDir}/migrator/Database`);
const convert = require(`${appDir}/migrator/main`);

const devServerConfig = {
    host: "0.0.0.0",
    port: 8082,
    disableHostCheck: true,
    publicPath: "/",
    contentBase: "public",
    stats: {colors: true},
    setup(app) {
        const database = new Database();
        database.connect();
        app.get("/lpd/:id", (req, res) => {
            convert(req.params.id, database).then((output) => res.send(output));
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
            main: appDir + "/app.js"
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
                        options: {
                            envName: "bundle_es2016"
                        }
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
