// @flow
import type {CheerioElemType} from "./BaseHandler";

import {assert} from "./Utils";

import BaseHandler from "./BaseHandler";

const handlers = [
];

export const findHandlerForElement = ($e: CheerioElemType): BaseHandler => {
    const e = $e.get(0);
    const handler = handlers.find((h) => h.isCapableOfProcessingElement($e));
    assert(Boolean(handler), `IdentifyHandler for ${e.tagName}${$e.attr("class") ? "." + $e.attr("class").replace(/ /g, ".") : ""}`, $e);
    // $SuppressFlowCheck: assert would have ensured that handler is not null.
    return handler;
};
