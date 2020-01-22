import React from "react";
import PropTypes from "prop-types";
import toHTMLText from "html-react-parser";
import pretty from "pretty";
import {isPlainObject, startCase} from "lodash";
import { Grid, Segment, Header, Tab, Label, Button, Message, Modal, Form, Feed, Icon, List } from "semantic-ui-react";
import Page from "./page/Page";
import { CleanserIssueCode } from "../migrator/MigrationError";

export default class SingleDocView extends React.Component {
    static propTypes = {
        lpdId: PropTypes.number.isRequired,
        onClose: PropTypes.func,
        onValidationCompletion: PropTypes.func
    }

    constructor(args) {
        super(args);
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
            <Grid padded>
                <Grid.Row>
                    <Grid.Column columns={1}>
                        <Header as="h2">
                            <Header.Subheader>Verifying migration of LandingPage</Header.Subheader>
                            [{this.state.data.id}] [{this.state.data.namespace}] {this.state.data.old.title}
                            <Label as="a" href={`https://www.bankbazaar.com/${this.state.data.namespace}.html`} target="_blank">Live Preview</Label>
                        </Header>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row columns={1}>
                    {this.state.data.conversionError && 
                        <Message error header={`Conversion Error: ${this.state.data.conversionError.code}`} content={this.state.data.conversionError.message}/>
                    }
                </Grid.Row>
                <Grid.Row columns={1}>
                    <Grid.Column>
                        {this.renderContentPanel()}
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row centered columns={1}>
                    <Grid.Column textAlign="center">{this.renderActionsPanel()}</Grid.Column>
                </Grid.Row>
            </Grid>
        );
    }

    renderActionsPanel() {
        const createCommentsForm = (view) => {
            return (
                <Form style={{padding: 10}}>
                    <Form.Field>
                        <label>Comments:</label>
                        <Form.TextArea name="comments" placeholder="Give your comments" onChange={(e, {name, value}) => view.setState({validationComments: value})}/>
                    </Form.Field>
                </Form>
            );
        };

        return (
            <Button.Group size="small">
                <Button color="green" onClick={() => this.props.onValidationCompletion("PERFECT")}>Picture Perfect</Button>
                <Button.Or/>
                <Modal trigger={<Button color="orange">Acceptable</Button>}
                    header='JUST Acceptable!!! What could be better?'
                    content={createCommentsForm(this)}
                    actions={["Close", { key: "done", content: "Done", positive: true, onClick: this.handleAcceptableConfirmation}]}/>
                <Button.Or/>
                <Modal trigger={<Button color="red">Not Acceptable</Button>}
                    header='NOT Acceptable!!! Sorry. What is wrong?'
                    content={createCommentsForm(this)}
                    actions={["Close", { key: "done", content: "Done", positive: true, onClick: this.handleNotAcceptableConfirmation}]}/>
                <Button.Or/>
                <Button onClick={this.props.onClose}>Go Back</Button>
            </Button.Group>            
        );
    }

    renderContentPanel() {
        const panes = [
            {menuItem: "Summary", render: () => createSummaryTabPane(this.state.data)},
            {menuItem: "Primary Content Rendering", render: () => createRenderingDiffTabPane(this.state.data)},
            {menuItem: "Primary Content Conversion OpLog", render: () => createDebugDiffTabPane(this.state.data)},
            {menuItem: "Primary Content Source", render: () => createSourceDiffTabPane(this.state.data)}
        ];
    
        return <Tab panes={panes}/>;
    }

    componentDidMount() {
        fetch("/api/lpd/" + this.props.lpdId, {headers: {"Content-Type": "application/json"}})
            .then((response) => response.json())
            .then((response) => {
                this.setState({data: response});
            });
    }

    handleAcceptableConfirmation = (e, data) => {
        if (!this.props.onValidationCompletion) {
            return;
        }

        this.props.onValidationCompletion("ACCEPTABLE", this.state.validationComments);
    }

    handleNotAcceptableConfirmation = (e, data) => {
        if (!this.props.onValidationCompletion) {
            return;
        }

        this.props.onValidationCompletion("NOT_ACCEPTABLE", this.state.validationComments);
    }
}

const createSummaryTabPane = (data) => {
    const cleansersApplied = data.conversionIssues.filter((i) => Object.keys(CleanserIssueCode).includes(i.code));
    const conversionWarnings = data.conversionIssues.filter((i) => !Object.keys(CleanserIssueCode).includes(i.code));
    return (
        <Tab.Pane>
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
                            <Feed.Extra>
                                <Label><pre style={{fontSize: "10px"}}>{pretty(i.payload)}</pre></Label>
                            </Feed.Extra>
                        </Feed.Content>
                    </Feed.Event>                      
                ))}
            </Feed>
        </Tab.Pane>
    );
};

const createRenderingDiffTabPane = (data) => {
    const oldHtml = (data.old.primaryContent || "").replace(/style="height: 0px;"/g, "").replace(/class="panel-collapse collapse"/g, "class=\"panel-collapse collapse in\"");
    return (
        <Tab.Pane>
            <Grid columns={2} padded style={{height: 600, overflowY: "scroll"}}>
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
        </Tab.Pane>
    );
};

const createSourceDiffTabPane = (data) => {
    return (
        <Tab.Pane>
            <Grid columns={2} padded style={{height: 600, overflowY: "scroll"}}>
                <Grid.Column>
                    <Header as="h3" attached="top" color="red">Old</Header>
                    <Segment color="red" attached style={{overflowX: "scroll"}}>
                        <pre><code style={{fontSize: "10px"}}>{pretty(data.old.primaryContent || "", {ocd: true})}</code></pre>
                    </Segment>
                </Grid.Column>
                <Grid.Column>
                    <Header as="h3" attached="top" color="blue">New</Header>
                    <Segment color="blue" attached style={{overflowX: "scroll"}}>
                        <pre><code style={{fontSize: "10px"}}>{JSON.stringify(data.new.primaryDoc || {}, null, 4)}</code></pre>
                    </Segment>
                </Grid.Column>
            </Grid>
        </Tab.Pane>
    );
};

const createDebugDiffTabPane = (data) => {
    const rows = data.new.primaryOpLog.map((opLog, i) => {
        const sourceCode = pretty(opLog.source.join("") || "", {ocd: true});
        return (
            <React.Fragment key={`${i}-1`}>
                <Grid.Row columns={2}>
                    <Grid.Column>
                        <Header size="tiny" as="h3" attached="top" color="red">Old</Header>
                        <Segment color="red" attached style={{overflowX: "auto"}}>
                            <pre style={{fontSize: "10px", whiteSpace: "pre-wrap"}}>{sourceCode}</pre>
                        </Segment>
                    </Grid.Column>
                    <Grid.Column style={{overflowX: "scroll"}}>
                        <Header size="tiny" as="h3" attached="top" color="blue">New - Converted using {opLog.converterName}</Header>
                        <Segment color="blue" attached style={{overflowX: "auto"}}>
                            {createGridForTargetOpLogObject(opLog.target)}
                        </Segment>
                    </Grid.Column>
                </Grid.Row>
            </React.Fragment>
        );
    });

    return (
        <Tab.Pane>
            <Grid celled="internally">{rows}</Grid>
        </Tab.Pane>
    );
};

const createGridForTargetOpLogObject = (elements, converterName, arrayKey = "Element") => {
    const createGridRow = (cell1, cell2, key, color) => (
        <Grid.Row key={key} columns={2} color={color}>
            <Grid.Column width={2} style={{padding: "2px 10px"}} textAlign="right">{cell1}</Grid.Column>
            <Grid.Column style={{overflowX: "auto", padding: "2px"}} width={14}>{cell2}</Grid.Column>
        </Grid.Row>
    );
    const createGridForArray = (arr, key, depth) => {
        const rows = [];
        arr.forEach((obj, i) => {
            if (!isPlainObject(obj)) { console.error(obj); throw new Error("Not supported"); }
            if (depth > 0) {
                const title = startCase(key.substring(0, key.length-1)) + "#" + (i+1); 
                rows.push(createGridRow("", title, `${key}-${i}`, "teal"));
            }
            rows.push(createGridRowsFromObject(obj, `${key}-${i}`, depth));
        });
        return rows;
    };
    const createGridRowsFromObject = (obj, key, depth) => {
        const rows = [];
        Object.keys(obj).forEach((propName) => {
            const propValue = obj[propName];
            const propKey = `${key}-${propName}`;
            if (isPlainObject(propValue)) {
                const propViewAsRows = createGridRowsFromObject(propValue, propKey, depth+1);
                const propViewAsGrid = <Grid size="tiny" celled="internally">{propViewAsRows}</Grid>;
                rows.push(createGridRow(propName, propViewAsGrid, propKey));
            } else if (Array.isArray(propValue)) {
                const propViewAsGrids = createGridForArray(propValue, propKey, depth+1);
                rows.push(...propViewAsGrids);
            } else {
                const propViewAsCell = (<pre style={{margin: 0, whiteSpace: "pre-wrap"}}>{pretty(propValue, {ocd: true})}</pre>);
                rows.push(createGridRow(propName, propViewAsCell, propKey, propName == "type" ? "blue" : undefined));
            }
        });
        return rows;
    };

    return elements.map((e, i) => (
        <Grid celled="internally" style={{fontSize: "10px"}} key={`element-${i}`} color="blue">
            {createGridRowsFromObject(e, "", 0)}
        </Grid>
    ));
};