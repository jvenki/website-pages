import React from "react";
import PropTypes from "prop-types";
import toHTMLText from "html-react-parser";
import pretty from "pretty";
import { Grid, Segment, Header, Tab, Form, Button, Message, Accordion } from "semantic-ui-react";
import Page from "./page/Page";

export default class SingleDocumentMigrationView extends React.Component {
    static propTypes = {
        lpdId: PropTypes.number.isRequired
    }

    constructor(args) {
        super(args);
        this.state = {
            conversionError: -1,
            doc: {
                id: undefined,
                namespace: undefined,
                title: "",
                oldPrimaryContent: "",
                oldSecondaryContent: "",
                newPrimaryContent: {},
                conversionStatus: undefined,
                conversionErrorCode: undefined,
                conversionErrorMessage: undefined,
                conversionErrorPayload: undefined
            }
        };
    }
    
    render() {
        const segments = [
            {
                title: "Primary Content Rendering",
                left: <div className="primary-txt article-txt">{toHTMLText(this.state.doc.oldPrimaryContent || "")}</div>,
                right: <div className="primary-txt article-txt"><Page doc={this.state.doc.newPrimaryContent || {}}/></div>
            },
            {
                title: "Primary Content Source",
                left: <pre><code>{pretty(this.state.doc.oldPrimaryContent || "", {ocd: true})}</code></pre>,
                right: <pre><code>{JSON.stringify(this.state.doc.newPrimaryContent || {}, null, 4)}</code></pre>
            }
        ];

        return (
            <Form style={{padding: 20}} error={this.state.doc.conversionStatus != "SUCCESS" ? true : false}>
                <Form.Group widths='equal'>
                    <Form.Input label="Landing Page ID" defaultValue={this.state.doc.id} width={3}/>
                    <Form.Input label="Namespace" control="input" defaultValue={this.state.doc.namespace} width={5}/>
                    <Form.Input label="Title" control="input" defaultValue={this.state.doc.title} width={8}/>
                </Form.Group>
                {this.state.doc.conversionErrorMessage &&
                    <Message error header={`Conversion Error: ${this.state.doc.conversionErrorCode}`} content={this.state.doc.conversionErrorMessage}/>
                }
                <Form.Field>
                    {renderAsTabs(segments, this)}
                </Form.Field>
                <Form.Field>
                    <Button.Group>
                        <Button type="submit" color="green">Picture Perfect</Button>
                        <Button.Or/>
                        <Button type="submit" color="orange">Acceptable</Button>
                        <Button.Or/>
                        <Button type="submit" color="red">Not Acceptable</Button>
                    </Button.Group>
                </Form.Field>
            </Form>
        );
    }

    componentDidMount() {
        fetch("/api/lpd/" + this.props.lpdId, {headers: {"Content-Type": "application/json"}})
            .then((response) => response.json())
            .then((response) => {
                this.setState({doc: response});
            });
    }

    handleClick = (e, titleProps) => {
        const { index } = titleProps;
        const newIndex = this.state.activeIndex === index ? -1 : index;
        this.setState({ activeIndex: newIndex });
    }
}

const renderAsTabs = (segments, self) => {
    const panes = segments.map((s) => ({menuItem: s.title, render: () => <Tab.Pane>{createDiffingGrid(s.left, s.right)}</Tab.Pane>}));
    return <Tab panes={panes}/>;
};

const createDiffingGrid = (left, right, color="red") => {
    return (
        <Grid columns={2} padded>
            <Grid.Row>
                <Grid.Column>
                    <Header as="h3" attached="top" color={color}>Old</Header>
                    <Segment color={color} attached>{left}</Segment>
                </Grid.Column>
                <Grid.Column>
                    <Header as="h3" attached="top" color={color}>New</Header>
                    <Segment color={color} attached>{right}</Segment>
                </Grid.Column>
            </Grid.Row>
        </Grid>        
    );
};
