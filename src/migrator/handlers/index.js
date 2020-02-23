// @flow
import type {CheerioElemType, CheerioDocType} from "./BaseHandler";

import {assert} from "./Utils";

import BaseHandler from "./BaseHandler";
import SectionHandler from "./SectionHandler";
import {TextHandlerVariant_Main, TextHandlerVariant_PointerView} from "./TextHandler";
import {JumbotronHandlerVariant_Main, JumbotronHandlerVariant_PrimaryKeyDetails_SingleP, JumbotronHandlerVariant_PrimaryKeyDetails_HeadingAndPs, JumbotronHandlerVariant_InsuranceWeek, JumbotronHandlerVariant_LpRelatedInfo} from "./JumbotronHandler";
import {VideoHandler} from "./VideoHandler";
import IFrameHandler from "./IFrameHandler";
import UnwrapHandler from "./UnwrapHandler";
import NoopWarningHandler from "./NoopWarningHandler";
import {CTAHandlerVariant_ProductLandingBlock, CTAHandlerVariant_LonelyLink, CTAHandlerVariant_CtaSection, CTAHandlerVariant_TabularData, CTAHandlerVariant_InsuranceWeekPick} from "./CTAHandler";
import { AccordionHandler } from "./AccordionHandler";
import {FeaturedOffersHandlerVariant_BorderBlue, FeaturedOffersHandlerVariant_Template} from "./FeaturedOffersHandler";
import {FAQHandlerVariant_HeadingRegexAndDivWithSchema, FAQHandlerVariant_HeadingRegexFollowedByPs, FAQHandlerVariant_HeadingRegexFollowedByDetails, FAQHandlerVariant_HeadingRegexFollowedByDivOfDetails, FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisLIofP, FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofPofStrong, FAQHandlerVariant_HeadingRegexFollowedByUL_QisLIofH3, FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisP, FAQHandlerVariant_HeadingRegexFollowedByULAsQAndPAsA, FAQHandlerVariant_HeadingRegexFollowedByOL_QisLI_AisP, FAQHandlerVariant_HeadingRegexFollowedByOLofH3, FAQHandlerVariant_HeadingRegexFollowedByOL_QisText_AisP, FAQHandlerVariant_HeadingRegexFollowedByH3AndPs, FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofH3_AisP, FAQHandlerVariant_HeadingRegexFollowedByOL_QisLI_AisText, FAQHandlerVariant_HeadingRegexFollowedByStrongAndPs} from "./FAQHandler";
import { DeprecatedTOCHandlerVariant_ProductsInvest, DeprecatedTOCHandlerVariant_ULofAsOnly, DeprecatedTOCHandlerVariant_TableOfULofLIofAsOnly, DeprecatedTOCHandlerVariant_TableOfAsOnly, DeprecatedTOCHandlerVariant_DivOfULOfLinks } from "./DeprecatedTOCHandler";
import GridHandler from "./GridHandler";
import BlockQuoteHandler from "./BlockQuoteHandler";
import { ReferencesHandlerVariant_Nav, ReferencesHandlerVariant_HeadingRegex, ReferencesHandlerVariant_InterlinksOfAccordion, ReferencesHandlerVariant_InterlinksOfNav, ReferencesHandlerVariant_Accordion, ReferencesHandlerVariant_NewsWidget, ReferencesHandlerVariant_InterlinkOfStrongAndUL, ReferencesHandlerVariant_GridOfAccordions, ReferencesHandlerVariant_UsefulLinks, ReferencesHandlerVariant_GridOfInterlink, ReferencesHandlerVariant_HeadingRegexAndCntrOfLinks, ReferencesHandlerVariant_TableOfLinks, ReferencesHandlerVariant_HeadingRegex_Buggy, ReferencesHandlerVariant_ProductsInvest } from "./ReferencesHandler";
import {DisclaimerHandlerVariant_Regex, DisclaimerHandlerVariant_GridOfAccordions, DisclaimerHandlerVariant_Link, DisclaimerHandlerVariant_Accordion} from "./DisclaimerHandler";
import ResponsiveTableHandler from "./ResponsiveTableHandler";
import { LandingBannerHandlerVariant_Main, LandingBannerHandlerVariant_Simplified } from "./LandingBannerHandler";
import { SitemapHandler_Link } from "./SitemapHandler";
import { NewsFeedHandlerVariant_Main } from "./NewsFeedHandler";
import { NewsFeedFullPostHandlerVariant_Main } from "./NewsFeedFullPostHandler";

const handlers = [
    new DisclaimerHandlerVariant_Regex(),
    new DisclaimerHandlerVariant_GridOfAccordions(),
    new DisclaimerHandlerVariant_Accordion(),
    new DisclaimerHandlerVariant_Link(),
    new SitemapHandler_Link(),
    new DeprecatedTOCHandlerVariant_ProductsInvest(),
    new DeprecatedTOCHandlerVariant_ULofAsOnly(),
    new DeprecatedTOCHandlerVariant_TableOfULofLIofAsOnly(),
    new DeprecatedTOCHandlerVariant_TableOfAsOnly(),
    new DeprecatedTOCHandlerVariant_DivOfULOfLinks(),
    new ReferencesHandlerVariant_Nav(),
    new ReferencesHandlerVariant_HeadingRegex(),
    new ReferencesHandlerVariant_HeadingRegex_Buggy(),
    new ReferencesHandlerVariant_InterlinksOfAccordion(),
    new ReferencesHandlerVariant_InterlinksOfNav(),
    new ReferencesHandlerVariant_Accordion(),
    new ReferencesHandlerVariant_NewsWidget(),
    new ReferencesHandlerVariant_InterlinkOfStrongAndUL(),
    new ReferencesHandlerVariant_GridOfAccordions(),
    new ReferencesHandlerVariant_UsefulLinks(),
    new ReferencesHandlerVariant_GridOfInterlink(),
    new ReferencesHandlerVariant_HeadingRegexAndCntrOfLinks(),
    new ReferencesHandlerVariant_TableOfLinks(),
    new ReferencesHandlerVariant_ProductsInvest(),
    new FAQHandlerVariant_HeadingRegexAndDivWithSchema(),
    new FAQHandlerVariant_HeadingRegexFollowedByPs(),
    new FAQHandlerVariant_HeadingRegexFollowedByH3AndPs(),
    new FAQHandlerVariant_HeadingRegexFollowedByStrongAndPs(),
    new FAQHandlerVariant_HeadingRegexFollowedByDetails(),
    new FAQHandlerVariant_HeadingRegexFollowedByDivOfDetails(),
    new FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisLIofP(),
    new FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofPofStrong(),
    new FAQHandlerVariant_HeadingRegexFollowedByUL_QisLIofH3(),
    new FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisP(),
    new FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofH3_AisP(),
    new FAQHandlerVariant_HeadingRegexFollowedByULAsQAndPAsA(),
    new FAQHandlerVariant_HeadingRegexFollowedByOL_QisLI_AisP(),
    new FAQHandlerVariant_HeadingRegexFollowedByOL_QisLI_AisText(),
    new FAQHandlerVariant_HeadingRegexFollowedByOLofH3(),
    new FAQHandlerVariant_HeadingRegexFollowedByOL_QisText_AisP(),
    new SectionHandler(), 
    new CTAHandlerVariant_ProductLandingBlock(),
    new CTAHandlerVariant_LonelyLink(),
    new CTAHandlerVariant_CtaSection(),
    new CTAHandlerVariant_TabularData(),
    new CTAHandlerVariant_InsuranceWeekPick(),
    new TextHandlerVariant_Main(),
    new TextHandlerVariant_PointerView(),
    new LandingBannerHandlerVariant_Main(),
    new LandingBannerHandlerVariant_Simplified(),
    new AccordionHandler(),
    new JumbotronHandlerVariant_Main(),
    new JumbotronHandlerVariant_PrimaryKeyDetails_SingleP(),
    new JumbotronHandlerVariant_PrimaryKeyDetails_HeadingAndPs(),
    new JumbotronHandlerVariant_InsuranceWeek(),
    new JumbotronHandlerVariant_LpRelatedInfo(),
    new NewsFeedHandlerVariant_Main(),
    new NewsFeedFullPostHandlerVariant_Main(),
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

export const findHandlerForElement = ($e: CheerioElemType, $: CheerioDocType): BaseHandler => {
    const e = $e.get(0);
    const handler = handlers.find((h) => h.isCapableOfProcessingElement($e, $));
    assert(Boolean(handler), `IdentifyHandler for ${e.tagName}${$e.attr("class") ? "." + $e.attr("class").replace(/ /g, ".") : ""}`, $e);
    // $SuppressFlowCheck: assert would have ensured that handler is not null.
    return handler;
};
