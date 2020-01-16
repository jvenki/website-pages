// @flow
import type {CheerioElemType} from "./BaseHandler";

import {assert} from "./Utils";

import BaseHandler from "./BaseHandler";
import SectionHandler from "./SectionHandler";
import TextHandler from "./TextHandler";
import {JumbotronHandler} from "./JumbotronHandler";
import {VideoHandler} from "./VideoHandler";
import UnwrapHandler from "./UnwrapHandler";
import {CTAHandlerVariant_ProductLandingBlock} from "./CTAHandler";
import { AccordionHandler } from "./AccordionHandler";
import {FeaturedOffersHandlerVariant_BorderBlue} from "./FeaturedOffersHandler";
import {FAQHandlerVariant_HeadingRegexAndDivWithSchema} from "./FAQHandler";
import { DeprecatedTOCHandlerVariant_ProductsInvest, DeprecatedTOCHandlerVariant_ULofAsOnly } from "./DeprecatedTOCHandler";

const handlers = [
    new DeprecatedTOCHandlerVariant_ProductsInvest(),
    new DeprecatedTOCHandlerVariant_ULofAsOnly(),
    new FAQHandlerVariant_HeadingRegexAndDivWithSchema(),
    new SectionHandler(), 
    new TextHandler(),
    new AccordionHandler(),
    new JumbotronHandler(),
    new VideoHandler(),
    new FeaturedOffersHandlerVariant_BorderBlue(),
    new CTAHandlerVariant_ProductLandingBlock(),
    new UnwrapHandler()
];

export const findHandlerForElement = ($e: CheerioElemType): BaseHandler => {
    const e = $e.get(0);
    const handler = handlers.find((h) => h.isCapableOfProcessingElement($e));
    assert(Boolean(handler), `IdentifyHandler for ${e.tagName}${$e.attr("class") ? "." + $e.attr("class").replace(/ /g, ".") : ""}`, $e);
    // $SuppressFlowCheck: assert would have ensured that handler is not null.
    return handler;
};
