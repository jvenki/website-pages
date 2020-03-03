import React from "react";
import PropTypes from "prop-types";

export default class DeprecatedTOC extends React.Component {
    static propTypes = {
        items: PropTypes.arrayOf(PropTypes.shape({question: PropTypes.string, answer: PropTypes.string}))
    }

    render() {
        if (this.props.items.some((item) => Boolean(item.img))) {
            return <div className="bb-products-invest bb-products-six text-center">{this.renderList()}</div>;
        }
        return this.renderList();
    }

    renderList() {
        return (
            <React.Fragment>
                <div className="clearfix"></div>
                <ul style={{position: "relative", border: "1px solid red"}} >
                    {this.props.items.map(this.renderSingleItem)}
                    <div style={{position: "absolute", top: "30%", left: "30%", backgroundColor: "red", padding: "20px"}}>DEPRECATED</div>
                </ul>
            </React.Fragment>
        );
    }

    renderSingleItem(item, index) {
        return (
            <li key={index}>
                <a href={item.link}>
                    {item.img && <img src={item.img.src}/>}
                    {item.img && <p>{item.linkText}</p>}
                    {!item.img && item.linkText}
                </a>
            </li>
        );
    }
}