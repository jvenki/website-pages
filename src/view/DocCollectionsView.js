import React from "react";
import PropTypes from "prop-types";
import {startCase, chunk, times} from "lodash";
import cheerio from "cheerio";
import { Grid, Segment, Header, Label, Sticky, Ref } from "semantic-ui-react";
import Page from "./page/Page";
import {ErrorBoundary, renderAsHtml} from "./DetailedSingleDocView";

export default class DocCollectionsView extends React.Component {
    static propTypes = {
        startingOffset: PropTypes.number.isRequired
    }

    state = {
        fetchInProgress: true,
        data: {}
    }

    render() {
        return (
            <div>
                {Object.keys(this.state.data).map((lpdId) => <SimpleSingleDocView key={lpdId} data={this.state.data[lpdId]}/>)}
                {this.state.fetchInProgress && <p>Still fetching the data for the view...</p>}
                {!this.state.fetchInProgress && <p>All data fetched and rendered for this view</p>}
            </div>
        );
    }

    componentDidMount() {
        const initiateFetchForIds = (lpdIds, last) => {
            return fetch("/api/lpd?ids=" + lpdIds, {headers: {"Content-Type": "application/json"}})
                .then((response) => response.json())
                .then((response) => {
                    const map = response.reduce((aggr, curr) => {aggr[curr.id] = curr; return aggr;}, {});
                    this.setState((prevState) => ({
                        data: {...prevState.data, ...map},
                        fetchInProgress: last == false
                    }));
                });
        };

        chunk(times(100, (i) => this.props.startingOffset + i), 5).forEach((lpdIds, i, array) => {
            setTimeout(() => initiateFetchForIds(lpdIds, i==(array.length-1)), i*3000);
        });
    }
}

class SimpleSingleDocView extends React.PureComponent {
    static propTypes = {
        data: PropTypes.object
    }

    constructor(args) {
        super(args);
        this.contentRef = React.createRef();
    }

    render() {
        return (
            <Ref innerRef={this.contentRef}>
                <Segment>
                    <Sticky context={this.contentRef}>
                        <Segment  inverted color="grey" raised>
                            {createHeaderSection(this.props.data)}
                        </Segment>
                    </Sticky>
                    <Segment color="grey" raised>
                        {createRenderingDiffSection(this.props.data)}
                    </Segment>
                </Segment>
            </Ref>
        );
    }
}

const createHeaderSection = (data) => {
    return (
        <Header as="h2">
            [{data.id}] [{data.namespace}] {data.old.title}
            <Label as="a" href={`https://www.bankbazaar.com/${data.namespace}.html`} target="_blank">Live Preview</Label>
            {data.conversionStatus == "SUCCESS" && <Label color="green" content={"Conversion Status = " + startCase(data.conversionStatus)}/>}
            {data.conversionStatus == "WARNING" && <Label color="yellow" content={"Conversion Status = " + startCase(data.conversionStatus)}/>}
            {data.conversionStatus == "ERROR" && <Label color="red" content={"Conversion Status = " + startCase(data.conversionStatus)}/>}
            <Label color="teal" as="a" href={`/?lpdId=${data.id}`} target="_blank">Detailed View</Label>
        </Header>
    );
};

const createRenderingDiffSection = (data) => {
    let oldHtml = (data.old.primaryContent || "").replace(/style="height: 0px;"/g, "").replace(/class="panel-collapse collapse"/g, "class=\"panel-collapse collapse in\"");
    const $ = cheerio.load(oldHtml, {decodeEntities: false});
    $("img").each((i, e) => {
        if ($(e).attr("data-original")) {
            $(e).attr("src", $(e).attr("data-original"));
        }
    });
    oldHtml = $.html();
    return (
        <Grid columns={2} padded>
            <Grid.Column>
                <Header as="h3" attached="top" color="red">Old</Header>
                <Segment color="red" attached style={{overflowX: "scroll"}}>
                    <div className="wc-preview">
                        <div className="primary-txt article-txt">
                            <ErrorBoundary>
                                {renderAsHtml(oldHtml)}
                            </ErrorBoundary>
                        </div>
                    </div>
                </Segment>
            </Grid.Column>
            <Grid.Column>
                <Header as="h3" attached="top" color="blue">New</Header>
                <Segment color="blue" attached style={{overflowX: "scroll"}}>
                    <div className="wc-preview">
                        <div className="primary-txt article-txt">
                            <Page doc={data.new.primaryDoc || {}}/>
                        </div>
                    </div>
                </Segment>
            </Grid.Column>
        </Grid>
    );
};
