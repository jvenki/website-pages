// const allRules = ["attr-spacing",
// "heading-level",
// "close-attr",
// "close-order",
// "deprecated",
// "deprecated-rule",
// "doctype-html",
// "element-name",
// "meta-refresh",
// "no-conditional-comment",
// "no-deprecated-attr",
// "no-dup-attr",
// "no-dup-class",
// "no-dup-id",
// "no-raw-characters",
// "no-redundant-for",
// "no-redundant-role",
// "no-style-tag",
// "no-unknown-elements",
// "prefer-button",
// "prefer-tbody",
// "require-sri",
// "script-type",
// "unrecognized-char-ref",
// "attribute-allowed-values",
// "element-permitted-content",
// "element-permitted-occurrences",
// "element-permitted-order",
// "element-required-attributes",
// "element-required-content",
// "no-multiple-main",
// "script-element",
// "void-content",
// "aria-label-misuse",
// "empty-heading",
// "empty-title",
// "input-missing-label",
// "multiple-labeled-controls",
// "no-autoplay",
// "prefer-native-element",
// "svg-focusable",
// "text-content",
// "wcag/h30",
// "wcag/h32",
// "wcag/h36",
// "wcag/h37",
// "wcag/h67",
// "wcag/h71",
// "long-title",
// "attr-case",
// "attr-quotes",
// "attribute-boolean-style",
// "attribute-empty-style",
// "class-pattern",
// "doctype-style",
// "element-case",
// "id-pattern",
// "no-implicit-close",
// "no-inline-style",
// "no-self-closing",
// "no-trailing-whitespace",
// "void",
// "void-style"];

export const rulesToBeKept = {
    root: true,
    rules: {
        "close-order": "error",
        // "close-attr",
        // "deprecated",
        // "deprecated-rule",
        // "element-name",
        // "no-dup-attr",
        // "no-dup-id",
        // "no-raw-characters",
        // "attribute-allowed-values",
        // "element-permitted-content",
        // "element-permitted-occurrences",
        // "element-permitted-order",
        // "wcag/h30"
}};

export const allRules = {
    rules: {
        'attribute-allowed-values': 'error',
        'close-attr': 'error',
        'close-order': 'error',
        deprecated: 'error',
        'deprecated-rule': 'error',
        'doctype-html': 'error',
        'element-name': 'error',
        'element-permitted-content': 'error',
        'element-permitted-occurrences': 'error',
        'element-permitted-order': 'error',
        'element-required-attributes': 'error',
        'element-required-content': 'error',
        // 'heading-level': 'error',
        'missing-doctype': 'error',
        'no-conditional-comment': 'error',
        'no-deprecated-attr': 'error',
        'no-dup-attr': 'error',
        'no-dup-id': 'error',
        'no-missing-references': 'error',
        'no-raw-characters': ['error', { relaxed: true }],
        'no-redundant-role': 'error',
        'no-unknown-elements': 'error',
        'script-element': 'error',
        'unrecognized-char-ref': 'error',
        'void-content': 'error',
        'wcag/h37': 'error'
      }
}

export const ignoredRules = allRules;