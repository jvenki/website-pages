/*eslint-disable no-undef*/
module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            "@babel/preset-react", 
            ["@babel/preset-env", {"targets": {"node": 8}}]
        ], 
        plugins: [
            "@babel/plugin-transform-flow-strip-types",
            ["@babel/plugin-proposal-class-properties", {loose: true}],
            ["@babel/plugin-proposal-object-rest-spread", {loose: true, useBuiltIns: true}],
            "@babel/plugin-transform-react-jsx",
        ]
    };
};