import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";

export default class FAQ extends React.Component {
    static propTypes = {
        title: PropTypes.string.isRequired,
        items: PropTypes.arrayOf(PropTypes.shape({question: PropTypes.string, answer: PropTypes.string}))
    }

    render() {
        return (
            <React.Fragment>
                <h2>{this.props.title} [SPECIAL TAG]</h2>
                {this.props.items.map(this.renderSingleItem)}
            </React.Fragment>
        );
    }

    renderSingleItem(item, index) {
        return (
            <details open key={index}>
                <summary><strong>{item.question}</strong></summary>
                {toHTML(item.answer)}
            </details>            
        );
    }
}