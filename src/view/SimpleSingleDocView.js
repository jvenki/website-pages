import React from "react";
import PropTypes from "prop-types";
import toHTMLText from "html-react-parser";
import {startCase} from "lodash";
import cheerio from "cheerio";
import { Grid, Segment, Header, Label, Feed, Icon, List, Sticky, Ref } from "semantic-ui-react";
import Page from "./page/Page";
import { CleanserIssueCode } from "../migrator/MigrationError";

export default class SimpleSingleDocView extends React.Component {
    static propTypes = {
        lpdId: PropTypes.number.isRequired,
        onClose: PropTypes.func,
        onValidationCompletion: PropTypes.func
    }

    constructor(args) {
        super(args);
        this.contentRef = React.createRef();
        this.state = {
            data: {
                id: undefined,
                namespace: undefined,
                old: {
                    title: "",
                    secondaryContent: "",
                    primaryContent: ""
                },
                new: {
                    primaryDoc: {},
                    primaryOpLog: []
                },
                conversionStatus: undefined,
                conversionError: undefined,
                conversionIssues: [],
                validationComments: ""
            }
        };
    }
    
    render() {
        return (
            <Ref innerRef={this.contentRef}>
                <Segment>
                    <Sticky context={this.contentRef}>
                        <Segment  inverted color="grey" raised>
                            {createHeaderSection(this.state.data)}
                        </Segment>
                    </Sticky>
                    <Segment color="grey" raised>
                        {createSummarySection(this.state.data)}
                        {createRenderingDiffSection(this.state.data)}
                    </Segment>
                </Segment>
            </Ref>
        );
    }

    componentDidMount() {
        fetch("/api/lpd/" + this.props.lpdId, {headers: {"Content-Type": "application/json"}})
            .then((response) => response.json())
            .then((response) => {
                this.setState({data: response});
            });
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
        </Header>
    );
};

const createSummarySection = (data) => {
    const cleansersApplied = data.conversionIssues.filter((i) => Object.keys(CleanserIssueCode).includes(i.code));
    const conversionWarnings = data.conversionIssues.filter((i) => !Object.keys(CleanserIssueCode).includes(i.code));
    return (
        <Segment color="teal" style={{margin: "0 12px"}}>
            <Feed size="small">
                <Feed.Event>
                    <Feed.Label>
                        <Icon name="heartbeat"/>
                    </Feed.Label>
                    <Feed.Content>
                        <Feed.Summary>
                            {data.conversionStatus == "SUCCESS" && <Label color="green" content={"Conversion Status = " + startCase(data.conversionStatus)}/>}
                            {data.conversionStatus == "WARNING" && <Label color="yellow" content={"Conversion Status = " + startCase(data.conversionStatus)}/>}
                            {data.conversionStatus == "ERROR" && <Label color="red" content={"Conversion Status = " + startCase(data.conversionStatus)}/>}
                        </Feed.Summary>
                    </Feed.Content>
                </Feed.Event>
                <Feed.Event>
                    <Feed.Label>
                        <Icon name="paint brush"/>
                    </Feed.Label>
                    <Feed.Content>
                        <Feed.Summary>
                            Cleansers Applied (Just for Information)
                        </Feed.Summary>
                        <Feed.Extra>
                            <List divided size="tiny">
                                {cleansersApplied.map((i, index) => {
                                    return (
                                        <List.Item key={index}>
                                            {i.message} 
                                            {i.payload && 
                                                <Label horizontal size="tiny" pointing="left">{i.payload}</Label>
                                            }
                                        </List.Item>
                                    );
                                })}
                            </List>
                        </Feed.Extra>
                    </Feed.Content>
                </Feed.Event>
                {conversionWarnings.map((i, index) => (
                    <Feed.Event key={index}>
                        <Feed.Label>
                            <Icon name="warning sign"/>
                        </Feed.Label>
                        <Feed.Content>
                            <Feed.Summary>
                                {i.message}
                                <Label color="red" horizontal pointing="left">Conversion Issue (Needs to be looked at)</Label>
                            </Feed.Summary>
                        </Feed.Content>
                    </Feed.Event>                      
                ))}
            </Feed>
        </Segment>
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
                            {toHTMLText(oldHtml)}
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
