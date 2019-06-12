import React from "react";
import PropTypes from "prop-types";
import { Grid } from "semantic-ui-react";

export default class SingleDocumentMigrationView extends React.Component {
    static propTypes = {
        lpdId: PropTypes.number.isRequired
    }

    constructor(args) {
        super(args);
        this.database = new Database();
        this.database.connect();
        this.state = {
            original: {
                title: undefined,
                primaryContent: undefined,
                secondaryContent: undefined
            },
            converted: {
                title: undefined,
                primaryContent: undefined,
                secondaryContent: undefined
            }
        };
    }
    
    render() {
        return (
            <Grid columns={2} divided>
                <Grid.Row>
                    <Grid.Column>
                        <pre>
                            <code>
                                {this.state.original.primaryContent.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;")}
                            </code>
                        </pre>
                    </Grid.Column>
                    <Grid.Column>
                        <pre>
                            <p>Hello World</p>
                        </pre>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        );
    }
}