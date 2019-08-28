const MigrationError = require("../MigrationError");

const textSupportedDomElemTypes = ["p", "ul", "ol", "li", "strong", "em", "a"].sort();

const assert = (condition, errorMsg, $e) => {
    if (!condition) {
        throw new MigrationError(MigrationError.Code.UNKNOWN_TAG, errorMsg, `<${$e.get(0).tagName}>${$e.html()}</${$e.get(0).tagName}>`);
    }
};

const computeColumnCount = ($e) => undefined;

const extractImgSrc = ($img) => $img.attr("data-original") || $img.attr("src");

const extractContentHtml = ($e, converter) => {
    const tagName = $e.get(0).tagName;
    if (textSupportedDomElemTypes.includes(tagName)) {
        return `<${$e.get(0).tagName}>${$e.html()}</${$e.get(0).tagName}>`;
    } else {
        return $e.html();
    }
};

// eslint-disable-next-line no-unused-vars
const containsOnlyPaddingClasses = ($element) => removePaddingClass($element.attr("class")) == "";
const containsOnlyPositioningClasses = ($element) => removePositioningClass($element.attr("class")) == "";

const removePaddingClass = (classNames) => {
    return (classNames || "")
        .replace(/lt-pad-\d+/, "").replace(/lt-pad/, "")
        .replace(/rt-pad-\d+/, "").replace(/rt-pad/, "")
        .replace(/btm-pad-\d+/, "").replace(/btm-pad/, "")
        .replace(/top-pad-\d+/, "").replace(/top-pad/, "")
        .replace(/pull-left/, "")
        .replace(/pull-right/, "")
        .trim();
};

const removePositioningClass = (classNames) => {
    return classNames
        .replace(/text-center/g, "")
        .replace(/text-right/g, "")
        .replace(/text-left/g, "")
        .trim();
};

module.exports = {removePositioningClass, removePaddingClass, containsOnlyPaddingClasses, containsOnlyPositioningClasses, extractImgSrc, extractContentHtml, assert, computeColumnCount};