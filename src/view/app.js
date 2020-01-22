import ReactDOM from "react-dom";
import React from "react";
import "semantic-ui-css/semantic.min.css";

import ListingView from "./ListingView";
import DetailedSingleDocView from "./DetailedSingleDocView";
import DocCollectionsView from "./DocCollectionsView";

export const launchView = () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("lpdId")) {
        const lpdId = parseInt(urlParams.get("lpdId"));
        ReactDOM.render(<DetailedSingleDocView lpdId={lpdId}/>, document.getElementById("root"));
    } else if (urlParams.get("startingOffset")) {
        const startingOffset = parseInt(urlParams.get("startingOffset"));
        ReactDOM.render(<DocCollectionsView startingOffset={startingOffset}/>, document.getElementById("root"));
    } else {
        ReactDOM.render(<ListingView/>, document.getElementById("root"));
    }
};