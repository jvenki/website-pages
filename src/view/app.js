import ReactDOM from "react-dom";
import React from "react";
import "semantic-ui-css/semantic.min.css";

import ListingView from "./ListingView";
import DetailedSingleDocView from "./DetailedSingleDocView";
import SimpleSingleDocView from "./SimpleSingleDocView";
import DocCollectionsView from "./DocCollectionsView";

export const launchView = () => {
    const lpdId = parseInt(new URLSearchParams(window.location.search).get("lpdId"));
    
    ReactDOM.render(<DocCollectionsView lpdIds={[856, 859]}/>, document.getElementById("root"));
    // ReactDOM.render(<SimpleSingleDocView lpdId={lpdId}/>, document.getElementById("root"));
    // ReactDOM.render(<DetailedSingleDocView lpdId={lpdId}/>, document.getElementById("root"));
    // ReactDOM.render(<ListingView/>, document.getElementById("root"));
};