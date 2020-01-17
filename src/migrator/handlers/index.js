// @flow
import type {CheerioElemType} from "./BaseHandler";

import {assert} from "./Utils";

import BaseHandler from "./BaseHandler";
import SectionHandler from "./SectionHandler";
import TextHandler from "./TextHandler";
import {JumbotronHandler} from "./JumbotronHandler";
import {VideoHandler} from "./VideoHandler";
import UnwrapHandler from "./UnwrapHandler";
import NoopWarningHandler from "./NoopWarningHandler";
import {CTAHandlerVariant_ProductLandingBlock, CTAHandlerVariant_LonelyLink} from "./CTAHandler";
import { AccordionHandler } from "./AccordionHandler";
import {FeaturedOffersHandlerVariant_BorderBlue, FeaturedOffersHandlerVariant_Template} from "./FeaturedOffersHandler";
import {FAQHandlerVariant_HeadingRegexAndDivWithSchema, FAQHandlerVariant_HeadingRegexFollowedByPs} from "./FAQHandler";
import { DeprecatedTOCHandlerVariant_ProductsInvest, DeprecatedTOCHandlerVariant_ULofAsOnly } from "./DeprecatedTOCHandler";

const handlers = [
    new DeprecatedTOCHandlerVariant_ProductsInvest(),
    new DeprecatedTOCHandlerVariant_ULofAsOnly(),
    new FAQHandlerVariant_HeadingRegexAndDivWithSchema(),
    new FAQHandlerVariant_HeadingRegexFollowedByPs(),
    new SectionHandler(), 
    new CTAHandlerVariant_ProductLandingBlock(),
    new CTAHandlerVariant_LonelyLink(),
    new TextHandler(),
    new AccordionHandler(),
    new JumbotronHandler(),
    new VideoHandler(),
    new FeaturedOffersHandlerVariant_BorderBlue(),
    new FeaturedOffersHandlerVariant_Template(),
    new NoopWarningHandler(),
    new UnwrapHandler()
];

export const findHandlerForElement = ($e: CheerioElemType): BaseHandler => {
    const e = $e.get(0);
    const handler = handlers.find((h) => h.isCapableOfProcessingElement($e));
    assert(Boolean(handler), `IdentifyHandler for ${e.tagName}${$e.attr("class") ? "." + $e.attr("class").replace(/ /g, ".") : ""}`, $e);
    // $SuppressFlowCheck: assert would have ensured that handler is not null.
    return handler;
};
