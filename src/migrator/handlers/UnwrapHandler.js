// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {findHandlerForElement} from ".";
import {logger} from "../Logger";
import {computePathNameToElem, removePaddingClass, removePositioningClass, removeBorderClasses, removeBGClasses, hasClass} from "./Utils";

export default class UnwrapHandler extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType): boolean {
        return $element.get(0).tagName == "div" && isDivUnnecessary($element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const targetElements = [];
        elements.forEach((e) => {
            targetElements.push(...processElementsInsideDiv(elements[0], $, this.getName()));
        });
        return {elements: targetElements};
    }
}

const isDivUnnecessary = ($e) => {
    const allChildrenAreGridCell = () => $e.children().get().every((c) => hasClass(c, /col-[a-z]{2}-\d\d?/));
    const isOnlyChild = () => $e.parent().children.length == 1;

    let classNames = $e.attr("class");
    classNames = removeBGClasses(removeBorderClasses(removePositioningClass(removePaddingClass(classNames))));
    if (classNames == "") {
        return true;
    } else if ($e.hasClass("hungry-table") || $e.hasClass("js-hungry-table")) {
        // We dont care about this DIV. We care only about the table inside. Therefore lets remove this.
        return true;
    } else if (containsOnlyGridRowClasses(classNames) && ($e.children().length == 1 || !allChildrenAreGridCell())) {
        return true;
    } else if (containsOnlyGridCellClasses(classNames) && isOnlyChild()) {
        return true;
    } else if ($e.attr("class").match(/list-group-item list-group-[a-z]*/)) {
        // Just does some prominence to the section. They should have used a different type like Jumbotron. Used in 4
        return true;
    }
    return false;
};

export const containsOnlyGridRowClasses = (classNames: string) => {
    classNames = removePositioningClass(removePaddingClass(classNames));
    if (["row"].includes(classNames)) {
        return true;
    } else if (classNames.match(/^col-xs-12 col-sm-12 col-md-12$/) || classNames.match(/^col-md-12$/)) {
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
    
    while (i < $element.contents().length) {
        const $currElem = $element.contents().eq(i);
        const childElemHandler = findHandlerForElement($currElem, $);
        if (!currHandler || (currHandler.getName() == childElemHandler.getName())) {
            logger.debug(`                ${handlerName}: Processing Child Node '${computePathNameToElem($currElem, $)}' : Identified Handler as '${childElemHandler.getName()}' - Adding it to collection`);
            currHandler = childElemHandler;
            const elementsExpandedFromI = childElemHandler.walkToPullRelatedElements($currElem, $);
            currElements.push(...elementsExpandedFromI);
            i+=elementsExpandedFromI.length;
        } else {
            logger.debug(`            ${handlerName}: Processing Collection  of size ${currElements.length} using '${currHandler.getName()}'`);
            process(currElements, currHandler);
        }
    }
    process(currElements, currHandler);
    return output;
};
