import ReactDOM from "react-dom";
import React from "react";
import "semantic-ui-css/semantic.min.css";

import SingleDocumentMigrationView from "./view/SingleDocumentMigrationView";

export const launchView = () => {
    ReactDOM.render(
        <SingleDocumentMigrationView/>,
        document.getElementById("root")
    );
}