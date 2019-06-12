import React from "react";
import PropTypes from "prop-types";
import toHTMLText from "html-react-parser";
import pretty from "pretty";
import { Grid, Segment, Accordion, Header, Icon } from "semantic-ui-react";


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
                primaryContent: "",
                secondaryContent: ""
            }
        };
    }
    
    render() {
        return (
            <Accordion fluid styled>
                {createComparisonViewAsAccordion(
                    "Primary Content Rendering", 
                    toHTMLText(this.state.original.primaryContent), 
                    <p>NOT YET IMPLEMENTED</p>, 
                    0, 
                    this, 
                    "red"
                )}
                {createComparisonViewAsAccordion(
                    "Primary Content Source", 
                    <pre><code>{pretty(this.state.original.primaryContent, {ocd: true})}</code></pre>,
                    <pre><code>{JSON.stringify(this.state.converted.primaryContent, null, 4)}</code></pre>,
                    1, 
                    this, 
                    "green"
                )}
            </Accordion>
        );
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

const createComparisonViewAsSegment = (title, oldData, newData, index, view, color="red") => {
    return (
        <React.Fragment>
            <Header as="h2" attached="top" color={color} inverted>Primary Content Rendered</Header>
            <Segment color="red" style={{overflow: "auto", maxHeight: 700}} attached>
                <Grid columns={2} padded>
                    <Grid.Row>
                        <Grid.Column>
                            <Header as="h3" attached="top" color={color}>
                                Old
                            </Header>
                            <Segment color={color} attached>
                                {oldData}
                            </Segment>
                        </Grid.Column>
                        <Grid.Column>
                            <Header as="h3" attached="top" color={color}>
                                New
                            </Header>
                            <Segment color={color} attached>
                                {newData}
                            </Segment>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Segment>            
        </React.Fragment>
    );
};

const createComparisonViewAsAccordion = (title, oldData, newData, index, view, color="red") => {
    return (
        <React.Fragment>
            <Accordion.Title active={view.state.activeIndex === index} index={index} onClick={view.handleClick}>
                <Icon name='dropdown' />
                {title}
            </Accordion.Title>
            <Accordion.Content active={view.state.activeIndex === index} index={index}>
                <Grid columns={2} padded>
                    <Grid.Row>
                        <Grid.Column>
                            <Header as="h3" attached="top" color={color}>
                                Old
                            </Header>
                            <Segment color={color} attached>
                                {oldData}
                            </Segment>
                        </Grid.Column>
                        <Grid.Column>
                            <Header as="h3" attached="top" color={color}>
                                New
                            </Header>
                            <Segment color={color} attached>
                                {newData}
                            </Segment>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Accordion.Content>
        </React.Fragment>
    );
};