// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {findHandlerForElement} from ".";
import {logger} from "../Logger";
import {computePathNameToElem, removePaddingClass, removePositioningClass} from "./Utils";

export default class UnwrapHandler extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType): boolean {
        return $element.get(0).tagName == "div" && isDivUnnecessary($element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        return {elements: processElementsInsideDiv(elements[0], $, this.getName())};
    }
}

const isDivUnnecessary = ($e) => {
    if (removePositioningClass(removePaddingClass($e.attr("class"))).trim() == "") {
        return true;
    } else if (containsOnlyGridRowClasses($e.attr("class"))) {
        // Looks like there is just one child within the Grid styled DIV. Why?
        return true;
    } else if ($e.attr("class").match(/border-gallery border-left-malibu bg-blue/)) {
        // Just does some prominence to the section. They should have used a different type like Jumbotron. Used in 859
        return true;
    }
    return false;
};

export const containsOnlyGridRowClasses = (classNames: string) => {
    classNames = removePositioningClass(removePaddingClass(classNames));
    if (["row"].includes(classNames)) {
        return true;
    } else if (classNames.match(/col-xs-12 col-sm-12 col-md-12/) || classNames.match(/col-md-12/)) {
        return true;
    }
    return false;
};

export const containsOnlyGridCellClasses = (classNames: string) => {
    classNames = removePositioningClass(removePaddingClass(classNames));
    if (classNames.match(/^((?:col-xs-\d+\s*|col-sm-\d+\s*|col-md-\d+\s*|col-lg-\d+\s*)+)$/)) {
        // Refer https://www.regular-expressions.info/captureall.html on why we need ?: before
        return true;
    }
    return false;
};

export const processElementsInsideDiv = ($element: CheerioElemType, $: CheerioDocType, handlerName: string) => {
    const output = [];
    const process = (elements, handler) => {
        if (elements.length == 0 || !handler) {
            return;
        }
        const executionResult = handler.execute(elements, $);
        output.push(...executionResult.targetElements);
        elements.splice(0, elements.length);
        currHandler = undefined;
    };

    let i = 0;
    const currElements = [];
    let currHandler;
    
    while (i < $element.children().length) {
        const $currElem = $element.children().eq(i);
        const childElemHandler = findHandlerForElement($currElem);
        if (!currHandler || (currHandler.getName() == childElemHandler.getName())) {
            logger.debug(`            ${handlerName}: Processing Child Node '${computePathNameToElem($currElem, $)}' : Identified Handler as '${childElemHandler.getName()}'`);
            currHandler = childElemHandler;
            currElements.push($currElem);
            i++;
        } else {
            process(currElements, currHandler);
        }
    }
    process(currElements, currHandler);
    return output;
};