module.exports = {
    "env": {
        "node": true,
        "browser": true,
        "es6": true
    },
    "parser": "babel-eslint",
    "parserOptions": {
        "ecmaVersion": 6,
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true,
            "jsx": true,
            "impliedStrict": true
        },
        "sourceType": "module"
    },
    "plugins": [
        "react",
        "flowtype"
    ],
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:flowtype/recommended"
    ],
    "settings": {
        "flowtype": {
            "onlyFilesWithFlowAnnotation": true
        }
    },
    "rules": {
        // General Coding Style Guidelines
        "indent": ["error", 4, {SwitchCase: 1}],
        "linebreak-style": ["error","unix"],
        "quotes": ["error", "double"],
        "semi": ["error", "always"],
        "brace-style": ["error", "1tbs", {"allowSingleLine": true}],
        "keyword-spacing": ["error", {"before": true, "after": true}],
        "comma-spacing": ["error", {"before": false, "after": true}],
        "space-before-blocks":  "error",
        "no-floating-decimal": "error",
        "arrow-parens": ["error", "always"],
        "arrow-spacing": ["error", {"before": true, "after": true}],
        "no-alert": "error",
        "no-console": "off",
        // "no-undef": "off",

        // Possible Coding Errors - The other recommendations from http://eslint.org/docs/rules/#possible-errors are enabled by default and good enough for us 
        "curly": ["error", "multi-line"],
        "no-var": "error",
        "prefer-const": "error",
        "no-eq-null": "error",
        "no-empty-function": "error",
        "no-implicit-coercion": "error",
        "no-iterator": "error",
        "no-implicit-globals": "error",
        "no-new": "error",
        "no-new-func": "error",
        "no-new-wrappers": "error",
        "no-self-compare": "error",
        "no-unmodified-loop-condition": "error",
        "no-constant-condition": ["error", { "checkLoops": false }],
        "no-unused-vars": ["error", { "args": "none" }],

        "no-void": "error",
        "no-with": "error",

        // Readability
        "prefer-spread": "error",
        "no-labels": "error",
        "no-sequences": "error",
        "no-throw-literal": "error",

        // React specific Rules
        "react/jsx-uses-react": "error",
        "react/jsx-uses-vars": "error",
        "react/jsx-filename-extension": ["error", {"extensions": [".js", ".jsx"]}],
        "react/no-find-dom-node": "error",
        "react/display-name": "off",
        "react/jsx-no-bind": ["warn", {"ignoreRefs": true}]
    }
};