import ReactDOM from "react-dom";
import React from "react";
import "semantic-ui-css/semantic.min.css";

import ListingView from "./view/ListingView";
import SingleDocView from "./view/SingleDocView";

export const launchView = () => {
    ReactDOM.render(<SingleDocView lpdId={4}/>, document.getElementById("root"));
    // ReactDOM.render(<ListingView/>, document.getElementById("root"));
};