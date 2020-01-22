import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";

export default class Accordion extends React.Component {
    static propTypes = {
        items: PropTypes.arrayOf(PropTypes.shape())
    }

    render() {
        return (
            <div className="row btm-pad twi-accordion col-md-12">
                <div id="accordion" className="panel-group">
                    {this.props.items.map((i, index) => <Item key={index} {...i}/>)}
                </div>
            </div>
        );
    }
}

class Item extends React.Component {
    static propTypes = {
        title: PropTypes.string.isRequired,
        body: PropTypes.string.isRequired
    }

    render() {
        return (
            <div className="panel panel-default" style={{paddingBottom: "15px"}}>
                <div className="panel-heading">
                    <h2 className="panel-title">
                        <a href="#" data-parent="#accordion" data-toggle="collapse" className="accordion-toggle collapsed">
                            <span className="fui-plus"></span>
                            {this.props.title}
                        </a>
                    </h2>
                </div>
                <div className="panel-collapse collapse in">
                    <div className="panel-body twi-auto-height">
                        {toHTML(this.props.body)}
                    </div>
                </div>
            </div>
        );
    }
}
