import React from "react";
import PropTypes from "prop-types";
import SimpleSingleDocView from "./SimpleSingleDocView";

export default class SingleDocView extends React.Component {
    static propTypes = {
        lpdIds: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
        onClose: PropTypes.func,
        onValidationCompletion: PropTypes.func
    }

    render() {
        return this.props.lpdIds.map((lpdId) => <SimpleSingleDocView key={lpdId} lpdId={lpdId}/>);
    }
}