import React, { Component } from 'react';
import { Container, Header } from 'semantic-ui-react';

import 'semantic-ui-css/semantic.min.css';

class App extends Component {
  render() {
    document.title = "Simple Slate"
    return (
      <Container text>
        <Header as="h2">Simple Slate</Header>
        <p>
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </Container>
    )
  }
}

export default App;
