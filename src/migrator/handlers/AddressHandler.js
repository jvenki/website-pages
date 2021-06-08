// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {isElementAValidTextualNode} from "./Utils";
import MigrationError, { ConversionIssueCode, CleanserIssueCode } from "../MigrationError";

export class AddressHandler extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        if ($e.toString().includes("HDFC House, H T Parekh Marg")) {
            console.log($e.toString())
            console.log("address found");
            console.log($e.get(0).tagName);
        }
        return ($e.get(0).tagName == "address");
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $e = $(elements[0]);
        const lines = $e.html().split("<br/>");
        console.log("lines")
        console.log(lines);
        return {elements: [{type: "address", data: {lines}}]};
    }
}