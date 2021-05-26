import React from "react";
import PropTypes from "prop-types";

export default class Accordion extends React.Component {
    static propTypes = {
        items: PropTypes.arrayOf(PropTypes.shape()),
        createViewForElement: PropTypes.func.isRequired
    }

    render() {
        return (
            <div className="row btm-pad twi-accordion col-md-12">
                <div id="accordion" className="panel-group">
                    {this.props.items.map((i, index) => <Item key={index} {...i} createViewForElement={this.props.createViewForElement} />)}
                </div>
            </div>
        );
    }
}

class Item extends React.Component {
    static propTypes = {
        title: PropTypes.string.isRequired,
        elements: PropTypes.array.isRequired,
        createViewForElement: PropTypes.func.isRequired
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
                        {this.props.elements.map((e, i) => this.props.createViewForElement(e, i))}
                    </div>
                </div>
            </div>
        );
    }
}
