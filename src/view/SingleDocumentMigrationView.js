import React from "react";
import PropTypes from "prop-types";
import { Grid } from "semantic-ui-react";

export default class SingleDocumentMigrationView extends React.Component {
    static propTypes = {
        lpdId: PropTypes.number.isRequired
    }
    
    render() {
        return (
            <Grid columns={2} divided>
                <Grid.Row>
                    <Grid.Column>
                        <pre>
                            <code>
                                <p>Hello World</p>
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
        )
    }
}