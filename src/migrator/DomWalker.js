// @flow
import cheerio from "cheerio";
import {logger} from "./Logger";
import MigrationError, {ErrorCode, ConversionIssueCode} from "./MigrationError";
import {findHandlerForElement} from "./handlers";
import {computeNodeName, computePathNameToElem} from "./handlers/Utils";
import {uniq} from "lodash";

type CheerioElemType = Function;
type CheerioDocType = Function;

export default class DomWalker {
    static for(html: string, onElement: (elem: Object) => void, onIssue: (err: Error) => void, onOpLog: (converterName: string, source: Array<CheerioElemType>, target: Array<Object>) => void) {
        return new DomWalker(html, onElement, onIssue, onOpLog);
    }

    html: string;
    $: CheerioDocType;
    $currElem: CheerioElemType;
    onElement: (elem: Object) => void;
    onIssue: (err: Error) => void;
    onOpLog: (converterName: string, source: Array<CheerioElemType>, target: Array<Object>) => void;

    constructor(html: string, onElement: (elem: Object) => void, onIssue: (err: Error) => void, onOpLog: (converterName: string, source: Array<CheerioElemType>, target: Array<Object>) => void) {
        this.html = html;
        this.onElement = onElement;
        this.onIssue = onIssue;
        this.onOpLog = onOpLog;
    }

    execute() {
        logger.verbose("    Walking our DOM...");

        const $ = cheerio.load(this.html, {decodeEntities: false});
        const rootElements = $("body").contents();
        if (rootElements.length == 0) {
            throw new MigrationError(ErrorCode.DOM_EMPTY);
        }

        let i=0;
        for (i=0; i<rootElements.length;) {
            const currElem = $(rootElements[i]);
            const elemsProcessed = handleElement(currElem, $, this.onElement, this.onIssue, this.onOpLog);
            i+=elemsProcessed.length;
        }
        return this;
    }
}

const handleElement = ($element, $, onElement, onIssue, onOpLog) => {
    const handler = findHandlerForElement($($element));
    logger.debug(`        Processing Node '${computeNodeName($element)}' : Identified Handler as '${handler.getName()}' : Path from BODY = '${computePathNameToElem($element)}'`);

    const sourceElements = handler.walkToPullRelatedElements($element, $);
    const {targetElements, issues} = handler.execute(sourceElements, $);
    const uniqIssues = uniq(issues);
    if (targetElements == undefined) {
        onIssue(new MigrationError(ConversionIssueCode.EMPTY_ELEMENT, uniqIssues.join(","), $element.toString()));
    } else {
        targetElements.forEach((convertedElement) => onElement(convertedElement));
        if (issues.length > 0) {
            onIssue(new MigrationError(ConversionIssueCode.OTHERS, uniqIssues.join(","), $element.toString()));
        }
    }

    onOpLog(handler.getName(), sourceElements, targetElements);
    logger.debug(`            ${sourceElements.join("")}`);
    logger.debug(`            ${JSON.stringify(targetElements)}`);
    return sourceElements;
};