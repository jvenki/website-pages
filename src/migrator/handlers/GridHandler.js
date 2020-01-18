// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {containsOnlyGridRowClasses, containsOnlyGridCellClasses, processElementsInsideDiv} from "./UnwrapHandler";
import MigrationError, {ConversionIssueCode} from "../MigrationError";
import { assert } from "./Utils";

export default class GridHandler extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType): boolean {
        return $element.get(0).tagName == "div" && containsOnlyGridRowClasses($element.attr("class"))
            && $element.children().length > 1
            && $element.children().get().every((child) => containsOnlyGridCellClasses(child.attribs.class));
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const cells = [];
        const output = [];

        $element.children().each((i, child) => {
            const parsedItems = processElementsInsideDiv($(child), $, this.getName());
            const prunedItems = [];
            parsedItems.forEach((item) => {
                if (item.type == "section") {
                    if (!sectionAlreadyAdded(output)) {
                        output.push(item);
                    } else {
                        throw new MigrationError(ConversionIssueCode.GRID_MULTIPLE_H2, undefined, $element);
                    }
                } else {
                    prunedItems.push(item);
                }
            });

            if (prunedItems.length > 1) {
                throw new MigrationError(ConversionIssueCode.GRID_MULTIPLE_ITEMS_IN_CELL, undefined, $element);
            }

            assert(Boolean(prunedItems[0]), "GridHandler-CannotExtractCell", $(child));
            cells.push({width: computeGridCellWidth($(child)), body: prunedItems[0]});
        });
        assert(cells.length > 1,  "GridHandler-CannotExtractRow", $element);
        output.push({type: "grid", cells});
        return {elements: output};
    }
}

const sectionAlreadyAdded = (output) => {
    return output.some((i) => i.type == "section");
};

const computeGridCellWidth = ($cell) => {
    const className = $cell.attr("class");
    let matchedGroups = className.match(/col-md-(\d+)/);
    if (!matchedGroups) {
        matchedGroups = className.match(/col-sm-(\d+)/);
    }
    return ((parseInt(matchedGroups[1])/12)*100).toFixed(2) + "%";
};