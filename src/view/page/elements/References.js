import React from "react";
import PropTypes from "prop-types";

export default class References extends React.Component {
    static propTypes = {
        references: PropTypes.array
    }

    render() {
        return this.props.references.map((collection) => this.renderOneCollection(collection));
    }

    renderOneCollection(collection) {
        return (
            <React.Fragment>
                <h2>{collection.title} [SPECIAL TAG]</h2>
                <ul>{collection.items.map((item, index) => <li key={index}><a href={item.link}>{item.title}</a></li>)}</ul>
            </React.Fragment>
        );
    }
}