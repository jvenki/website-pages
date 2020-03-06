import cheerio from "cheerio";
import MigrationError, { CleanserIssueCode } from "./MigrationError";
import corrections from "../../data/corrections-tobe-applied.json";

export const correctLPDHtml = (html, lpdId, onIssue) => {
    if (!corrections[lpdId]) {
        return html;
    }
    const $ = cheerio.load(html, {decodeEntities: false});
    corrections[lpdId].forEach((correction) => applyCorrection(correction, $, onIssue));
    return $.html();
};

const applyCorrection = ({source, op, to}, $, onIssue) => {
    switch (op) {
        case "insertBefore": 
            $(source).insertBefore(to);
            break;
        case "insertAfter":
            $(source).insertAfter(to);
            break;
        case "appendBefore":
            $(source).appendTo($(source).prev());
            break;
        case "moveUp":
            $(source).insertAfter($(source).parent());
            break;
        case "unwrap": 
            $($(source).html()).insertAfter($(source));
            $(source).remove();
            break;
        case "remove": 
            $(source).remove();
            break;
    }
    onIssue(new MigrationError(CleanserIssueCode.MANUAL_CORRECTION, undefined, `Performed '${op}' on '${source}' to '${to ? to : ""}'`));
};