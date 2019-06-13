import React from "react";
import PropTypes from "prop-types";
import toHTMLText from "html-react-parser";
import pretty from "pretty";
import { Grid, Segment, Header, Tab } from "semantic-ui-react";
import Page from "./page/Page";

export default class SingleDocumentMigrationView extends React.Component {
    static propTypes = {
        lpdId: PropTypes.number.isRequired
    }

    constructor(args) {
        super(args);
        this.state = {
            activeIndex: -1,
            original: {
                title: "",
                primaryContent: "",
                secondaryContent: ""
            },
            converted: {
                title: "",
                primaryContent: {},
                secondaryContent: {}
            }
        };
    }
    
    render() {
        const segments = [
            {
                title: "Primary Content Rendering",
                left: <div className="primary-txt article-txt">{toHTMLText(this.state.original.primaryContent)}</div>,
                right: <div className="primary-txt article-txt"><Page doc={this.state.converted.primaryContent}/></div>
            },
            {
                title: "Primary Content Source",
                left: <pre><code>{pretty(this.state.original.primaryContent, {ocd: true})}</code></pre>,
                right: <pre><code>{JSON.stringify(this.state.converted.primaryContent, null, 4)}</code></pre>
            }
        ];

        return renderAsTabs(segments, this);
    }

    componentDidMount() {
        fetch("/lpd/859", {headers: {"Content-Type": "application/json"}})
            .then((response) => response.json())
            .then((response) => {
                this.setState(response);
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
