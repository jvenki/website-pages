// @flow
import type {CheerioElemType} from "./BaseHandler";

import {assert} from "./Utils";

import BaseHandler from "./BaseHandler";
import SectionHandler from "./SectionHandler";
import TextHandler from "./TextHandler";
import {JumbotronHandler} from "./JumbotronHandler";
import {VideoHandler} from "./VideoHandler";
import IFrameHandler from "./IFrameHandler";
import UnwrapHandler from "./UnwrapHandler";
import NoopWarningHandler from "./NoopWarningHandler";
import {CTAHandlerVariant_ProductLandingBlock, CTAHandlerVariant_LonelyLink, CTAHandlerVariant_CtaSection} from "./CTAHandler";
import { AccordionHandler } from "./AccordionHandler";
import {FeaturedOffersHandlerVariant_BorderBlue, FeaturedOffersHandlerVariant_Template} from "./FeaturedOffersHandler";
import {FAQHandlerVariant_HeadingRegexAndDivWithSchema, FAQHandlerVariant_HeadingRegexFollowedByPs, FAQHandlerVariant_HeadingRegexFollowedByDetails, FAQHandlerVariant_HeadingRegexFollowedByDivOfDetails, FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisLIofP, FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofPofStrong, FAQHandlerVariant_HeadingRegexFollowedByUL_QisLIofH3, FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisP, FAQHandlerVariant_HeadingRegexFollowedByULAsQAndPAsA, FAQHandlerVariant_HeadingRegexFollowedByOL_QisLI_AisP} from "./FAQHandler";
import { DeprecatedTOCHandlerVariant_ProductsInvest, DeprecatedTOCHandlerVariant_ULofAsOnly } from "./DeprecatedTOCHandler";
import GridHandler from "./GridHandler";
import BlockQuoteHandler from "./BlockQuoteHandler";
import { ReferencesHandlerVariant_Nav, ReferencesHandlerVariant_HeadingRegex, ReferencesHandlerVariant_InterlinksOfAccordion, ReferencesHandlerVariant_InterlinksOfNav } from "./ReferencesHandler";
import {DisclaimerHandlerVariant_Regex} from "./DisclaimerHandler";
import ResponsiveTableHandler from "./ResponsiveTableHandler";

const handlers = [
    new DisclaimerHandlerVariant_Regex(),
    new DeprecatedTOCHandlerVariant_ProductsInvest(),
    new DeprecatedTOCHandlerVariant_ULofAsOnly(),
    new ReferencesHandlerVariant_Nav(),
    new ReferencesHandlerVariant_HeadingRegex(),
    new ReferencesHandlerVariant_InterlinksOfAccordion(),
    new ReferencesHandlerVariant_InterlinksOfNav(),
    new FAQHandlerVariant_HeadingRegexAndDivWithSchema(),
    new FAQHandlerVariant_HeadingRegexFollowedByPs(),
    new FAQHandlerVariant_HeadingRegexFollowedByDetails(),
    new FAQHandlerVariant_HeadingRegexFollowedByDivOfDetails(),
    new FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisLIofP(),
    new FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofPofStrong(),
    new FAQHandlerVariant_HeadingRegexFollowedByUL_QisLIofH3(),
    new FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisP(),
    new FAQHandlerVariant_HeadingRegexFollowedByULAsQAndPAsA(),
    new FAQHandlerVariant_HeadingRegexFollowedByOL_QisLI_AisP(),
    new SectionHandler(), 
    new CTAHandlerVariant_ProductLandingBlock(),
    new CTAHandlerVariant_LonelyLink(),
    new CTAHandlerVariant_CtaSection(),
    new TextHandler(),
    new AccordionHandler(),
    new JumbotronHandler(),
    new BlockQuoteHandler(),
    new ResponsiveTableHandler(),
    new VideoHandler(),
    new IFrameHandler(),
    new FeaturedOffersHandlerVariant_BorderBlue(),
    new FeaturedOffersHandlerVariant_Template(),
    new NoopWarningHandler(),
    new GridHandler(),
    new UnwrapHandler()
];

export const findHandlerForElement = ($e: CheerioElemType): BaseHandler => {
    const e = $e.get(0);
    const handler = handlers.find((h) => h.isCapableOfProcessingElement($e));
    assert(Boolean(handler), `IdentifyHandler for ${e.tagName}${$e.attr("class") ? "." + $e.attr("class").replace(/ /g, ".") : ""}`, $e);
    // $SuppressFlowCheck: assert would have ensured that handler is not null.
    return handler;
};
