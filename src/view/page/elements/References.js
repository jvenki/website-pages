import React from "react";
import PropTypes from "prop-types";

export default class References extends React.Component {
    static propTypes = {
        title: PropTypes.string,
        items: PropTypes.arrayOf(PropTypes.shape({title: PropTypes.string, link: PropTypes.string}))
    }

    render() {
        return (
            <div>
                <h2>{this.props.title || "Related Articles"}</h2>
                <ul>
                    {this.props.items.map((item, index) => <li key={index}><a href={item.link}>{item.title}</a></li>)}
                </ul>
            </div>
        );
    }
}