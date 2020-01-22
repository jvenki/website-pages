import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";

import {createViewForElement} from "./elements";

export default class Section extends React.Component {
    static propTypes = {
        title: PropTypes.string.isRequired,
        body: PropTypes.string,
        elements: PropTypes.array
    }

    render() {
        const elements = (this.props.elements || []).map((e, index) => createViewForElement(e, index));
        return (
            <React.Fragment>
                <h2>{this.props.title}</h2>
                {toHTML(this.props.body || "")}
                {elements}
            </React.Fragment>
        );
    }
}
