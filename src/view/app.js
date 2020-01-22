import ReactDOM from "react-dom";
import React from "react";
import "semantic-ui-css/semantic.min.css";

import ListingView from "./ListingView";
import SingleDocView from "./SingleDocView";

export const launchView = () => {
    const lpdId = parseInt(new URLSearchParams(window.location.search).get("lpdId"));
    ReactDOM.render(<SingleDocView lpdId={lpdId}/>, document.getElementById("root"));
    // ReactDOM.render(<ListingView/>, document.getElementById("root"));
};