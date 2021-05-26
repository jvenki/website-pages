import React from "react";
import PropTypes from "prop-types";

export default class FAQ extends React.Component {
    static propTypes = {
        title: PropTypes.string.isRequired,
        items: PropTypes.arrayOf(PropTypes.shape({question: PropTypes.string, answer: PropTypes.string})),
        createViewForElement: PropTypes.func.isRequired,
    }

    render() {
        return (
            <div style={{backgroundColor: "#00FFFF"}}>
                <h2>{this.props.title} [SPECIAL TAG]</h2>
                {this.props.items.map(this.renderSingleItem)}
            </div>
        );
    }

    renderSingleItem(item, index) {
        return (
            <details open key={index}>
                <summary><strong>{item.question}</strong></summary>
                {item.answer.map((ans, i) => this.props.createViewForElement(ans, i))}
            </details>            
        );
    }
}