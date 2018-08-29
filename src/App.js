import React, { Component } from 'react';
import { Container, Header } from 'semantic-ui-react';

import Editor from './components/editor';

import 'semantic-ui-css/semantic.min.css';

class App extends Component {
	render() {
		document.title = "Simple Slate";

		return (
			<Container text>
				<Header as="h2">Simple Slate</Header>
				<Editor />
			</Container>
		);
	}
}

export default App;
