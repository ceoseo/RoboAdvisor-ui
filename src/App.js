import React, { Component } from 'react';
import Login from './login.js';
import Dashboard from './dashboard.js';
import Portfolio from './portfolio.js';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

class App extends Component {
  render() {
    return (
      <Router>
        <Switch>
          <Route exact path='/' component={Login} />
          <Route path='/dashboard' component={Dashboard} />
          <Route path='/portfolio' component={Portfolio} />
        </Switch>
      </Router>
    );
  }
}

export default App;
