import React, { Component } from 'react';
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import './App.css';
import Registration from './components/Registration/Registration.jsx';
import Login from './components/Login/Login.jsx';
import Navbar from './components/Navbar/Navbar.jsx';

import Backendless from 'backendless';
import Cabinet from './components/Cabinet/Cabinet.jsx';
import PasswordRecovery from './components/PasswordRecovery/PasswordRecovery.jsx';
import FileManagement from './components/Files/Files.jsx';
import MyPlaces from './components/myPlaces/myPlaces.jsx';
import MyFriends from './components/myFriends/myFriends.jsx';
import DeveloperFeedback from './components/DeveloperFeedback/DeveloperFeedback.jsx';

const APP_ID = '93E8E1B6-89E3-4986-8186-554FDB811AE6';
const API_KEY = 'DCCE151C-3A41-4130-B855-65C25E2D8F63';
Backendless.serverURL = 'https://api.backendless.com';
Backendless.initApp(APP_ID, API_KEY);

const initialState = {
  loading: true,
  message: '',
  error  : null
}

class App extends Component {
  state = initialState

  componentDidMount() {
    Backendless.Data.of('TestTable').save({ foo: 'bar' })
      .then(obj => {
        const message = 'A data object has been saved in Backendless. Check \'TestTable\' in Backendless Console.' +
            `ObjectId = ${obj.objectId}`

        this.setState({ message, loading: false })
    })
    .catch(error => this.setState({ error: `Got an error - ${error}`, loading: false }))
  }

  render() {
    const { error, loading, message } = this.state

    return (
      <Router>
      <div className="first_practice">
          <div className="__navbar">
              <Navbar/>

          </div>

          {
            <Routes>
              <Route path="/login" element={<Login/>}></Route>
              <Route path="/" element={<Login/>}></Route>
              <Route path="/registration" element={<Registration/>}></Route>
              <Route path="/cabinet" element={<Cabinet/>}></Route>
              <Route path="/password-recovery" element={<PasswordRecovery/>}></Route>
              <Route path="/files" element={<FileManagement/>}></Route>
              <Route path="/myplaces" element={<MyPlaces/>}></Route>
              <Route path="/myfriends" element={<MyFriends/>}></Route>
              <Route path="/developer-feedback" element={<DeveloperFeedback/>}></Route>

            </Routes>
            }

      </div>

  </Router>
    );
  }
}

export default App;
                