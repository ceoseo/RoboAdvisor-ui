import React from "react";

import {
  Card as TCard,
  // CardHeader,
  CardBody,
  // CardFooter,
  // CardTitle,
  Row,
  Col
} from "reactstrap";
import {
  Doughnut
} from "react-chartjs-2";
import classNames from 'classnames';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import TextField from '@material-ui/core/TextField';
// import WarningIcon from '@material-ui/icons/Warning';
import PropTypes from 'prop-types';
import './portfolio.css';
import { Redirect } from 'react-router-dom';
//import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
//import ErrorIcon from '@material-ui/icons/Error';
import { withSnackbar } from 'notistack';
import AssessmentIcon from '@material-ui/icons/AssessmentOutlined';
import BookmarkBorderIcon from '@material-ui/icons/BookmarkBorderOutlined';
import InputAdornment from '@material-ui/core/InputAdornment';
import { withStyles } from '@material-ui/core/styles';
import Slide from '@material-ui/core/Slide';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import './dashboard.js';


// import {
//   dashboardEmailStatisticsChart,
// } from "./variables/charts.jsx";
// import transitions from "@material-ui/core/styles/transitions";
const request = require('request');

const colorTheme = createMuiTheme({
  palette: {
    primary: { main: '#EF241C' }, // This is HSBC red 
    secondary: { main: '#404040' }, // This is dark gray 404040
    error: { main: '#ffffff'}
  },
  typography: { 
    useNextVariants: true,
    fontSize: 12,
    
  },
});

const textfieldTheme = createMuiTheme({
  palette: {
    primary: { main: '#404040' }, 
    secondary: { main: '#EF241C' }, 
    error: { main: '#ffffff'}
  },
  typography: { 
    useNextVariants: true,
    fontSize: 12,
    
  },
});

const styles = theme => ({
  button: {
    background: 'linear-gradient(45deg, #EF241C 30%, #EF241C 100%)',
    backgroundColor: '#EF241C',
    //borderRadius: 3,
    //border: 1,
    color: 'white',
    //height: 42,
    width: 220,
    margin: '0px 10px',
    //padding: '0px 0px',
    //boxShadow: '0 3px 5px 2px rgba(245, 0 , 87, .3)',
  },
  buttonBlue: {
    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
    backgroundColor: '#21CBF3',
    // background: 'linear-gradient(45deg, #404040 30%, #868686 90%)',
    // backgroundColor: '#868686',
    color: 'white' 
    //boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
  },
  toggleContainer: {
    height: 56,
    padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    margin: `${theme.spacing.unit}px 0`,
    backgroundColor: 'white'
    // background: theme.palette.background.default,
  },
});


class Portfolio extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      customerId: props.location.state.customerId,
      portfolioId: props.location.state.selectedPortfolio.id,
      selected: null,                   // not being used right now
      toDashboard: false,               // back to dashboard page
      allocationButtonClicked: false,   // Set Allocation button clicked status
      rebalanceButtonClicked: false,    // Rebalance button clicked status
      preferencesSet: false,             // Preferences for portfolio exist in database
      preferencesExist: false,          // Preferences currently retrieved
      funds: [],                // TODO: not sure 
      fundBalances: {},         // dictionary of fundID:{balance, currency}
      totalBalance: 0,          // totalBalance balance of all funds
      allocationButtonColor: 'default',
      rebalanceButtonColor: 'default',
      buyOrSell: 'BUY',
      checked: false,
      loading: false,      


      // {customerId:{}, id:{portfolio Id}, holdings:{}} 
      selectedPortfolio: props.location.state.selectedPortfolio,      
      // {portfolioId:{}, deviation:{}, portfolioType:{}, allocations:{fundId:{},percentage:{}}}
      selectedPortfolioPreference: props.location.state.selectedPortfolioPreference,

      allowedDeviation: null,   // current max deviation for portfolio
      displayDeviation: null,   // displayed deviation on UI
      portfolioType: null,      // current portfolioType
      fundsTargets: [],         // array of {fundid/percentage} {0:{fundId:{},percentage:{}}, 1:{}...}
      displayTargets: [],       // displayed array of {fundid/percentage}

      targets: [],              // target % for each fund
      recommendationId: null,   // current recommendation ID
      recommendations: [],      // list of recommendations [{"action": "sell", "fundID": , "units": }, {}]
      recUnitsByFundId: {},     // fundId Index to Recommended Units (splitting this into 2 objects,
                                //    since JS doesn't deal with setState of nested objects)
      recActionByFundId: {},    // fundId Index to Recommended action 
      // warningOpen: false,       // warning bar 
      // warningMessage: ""        // warning bar error message
    }

    this.handleSetAllocationClick = this.handleSetAllocationClick.bind(this);
    this.handleRebalanceClick = this.handleRebalanceClick.bind(this);
    this.getRebalance = this.getRebalance.bind(this);
    this.populatePrefs = this.populatePrefs.bind(this);
    this.getCurrPortfolioPrefs = this.getCurrPortfolioPrefs.bind(this);
    this.handleTargetChange = this.handleTargetChange.bind(this);
    this.handleSaveAllocation = this.handleSaveAllocation.bind(this);
    this.handleCancelClick = this.handleCancelClick.bind(this);
    this.handleModifyRecClick = this.handleModifyRecClick.bind(this);
    this.handleExecuteRecClick = this.handleExecuteRecClick.bind(this);
    this.handleAllocationButtonChange = this.handleAllocationButtonChange.bind(this);
    this.handleRebalanceButtonChange = this.handleRebalanceButtonChange.bind(this);
    this.getFunds = this.getFunds.bind(this);
    this.handleTransitionSlide = this.handleTransitionSlide.bind(this);
    this.handleSnackBarMessage = this.handleSnackBarMessage.bind(this);


  }



  componentDidMount() { 
    this.getFunds(this.state.customerId);
    //this.getCurrPortfolioPrefs(this.state.customerId)
    this.handleTransitionSlide()
  }

  getCurrPortfolioPrefs(custId) {
    let currPortfolioPref;    
    let portfolioId = this.state.portfolioId;
    console.log("current portfolio id" + portfolioId)
    console.log("current cust id" + custId)
    let options = {
      url: "https://fund-rebalancer-dot-hsbc-roboadvisor.appspot.com/roboadvisor/portfolio/" + portfolioId,
      method: 'GET',
      headers: {
        'x-custid': custId
      }
    }
    let that = this;

    return new Promise(function(resolve, reject) {
      request(options, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          currPortfolioPref = JSON.parse(body);
          console.log(body);
          that.setState({
            selectedPortfolioPreference: currPortfolioPref
          },
            resolve(body)
          )         
          
              
        } else {
          currPortfolioPref = null;        
        }
      });
    }).then(value => {
      this.populatePrefs(); 
    }) 
  }

  // Grab portfolio deviation & fund allocation if exists
  populatePrefs(){
    let prefs = this.state.selectedPortfolioPreference;
    if (prefs !== null){
      let fundsAndPrefsMatch = true;
      let oldFundsTargets = [];
      let newFundsTargets = [];   

      for (let i = 0; i < prefs.allocations.length; i++){
        oldFundsTargets.push(prefs.allocations[i]);
      }

      console.log("current fundBalances size=" + this.state.fundBalances.size)
      console.log("current oldFundsTargets size=" + oldFundsTargets.length)
      if (this.state.fundBalances.size !== oldFundsTargets.length){
        fundsAndPrefsMatch = false;
        //console.log("got here")
      } 

      for (let key of this.state.fundBalances.keys()){
        console.log("current fundbalances fundid = " + key)
      }
      
      for (let i=0; i < this.state.fundBalances.size ; i++){          
        //console.log("current oldFundsTargets fundid = " + oldFundsTargets[i].fundId)
        if (oldFundsTargets[i] !== undefined && this.state.fundBalances.has(oldFundsTargets[i].fundId)){            
          //newFundsTargets.push(oldFundsTargets[i]);                      
        } else {
          //newFundsTargets.push(oldFundsTargets[i]);  
          fundsAndPrefsMatch = false;  
        }
      }
       
      
      
      console.log("current newFundsTargets size=" + newFundsTargets.length)
      console.log("currently funds and prefs match?" + fundsAndPrefsMatch)
      // if fundIds match between portoflio funds and portfolio prefs
      if (fundsAndPrefsMatch){
        
        // MUST use deepcopy of oldFundsTargets here, or else when you mutate oldFundsTargets,
        // displayTargets will change as well 
        let displayTargets = JSON.parse(JSON.stringify(oldFundsTargets));  

        this.setState({
          allowedDeviation: prefs.deviation,
          displayDeviation: prefs.deviation,
          portfolioType: prefs.type,
          fundsTargets: oldFundsTargets,
          displayTargets: displayTargets,
          preferencesSet: true,
          preferencesExist: true
        });
      } else {
        let funds = this.state.funds;
        for (let i = 0; i < funds.length; i++){
          newFundsTargets.push({"fundId" : funds[i].fundId, "percentage": 0});
        }
        //let displayTargets = JSON.parse(JSON.stringify(newFundsTargets));  
        this.setState({
          allowedDeviation: prefs.deviation,
          displayDeviation: prefs.deviation,
          portfolioType: prefs.type,
          fundsTargets: newFundsTargets,
          // displayTargets: displayTargets,
          preferencesSet: false,
          preferencesExist: false
        })
      }
      
    } else {
    // TODO: else highlight set allocation button 
      this.setState({
        preferencesExist: false,
        portfolioType: "fund"
      });
    }    
  }

  putCurrPortfolioPrefs(portfolioId, custID) {
    let updatedPrefs = this.state.displayTargets;
    console.log("this is putpref call " + updatedPrefs[0].fundId + " and percentage " + updatedPrefs[0].percentage)

    let options = {
      url: "https://fund-rebalancer-dot-hsbc-roboadvisor.appspot.com/roboadvisor/portfolio/"+ portfolioId +"/allocations",      
      method: 'PUT',
      json: updatedPrefs,      
      headers: {
        'x-custid': custID
      }
    }  
    request(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {        
        this.setState({
          // warningMessage: "Succesfully updated new preferences!",
          // warningOpen: true,
          preferencesSet: true
        });
        this.handleSnackBarMessage("Succesfully updated new preferences!", "success");
        
      } else {
        // this.setState({
        //   warningMessage: "Failed to update new preferences.",
        //   warningOpen: true,
        // });
        this.handleSnackBarMessage("Failed to update new preferences", "error");
      }
    })
  }

  putCurrPortfolioDeviation (portfolioId, custID) {
    let updatedDeviation = {
      "deviation": this.state.displayDeviation
    };

    let options = {
      url: "https://fund-rebalancer-dot-hsbc-roboadvisor.appspot.com/roboadvisor/portfolio/"+ portfolioId +"/deviation",      
      method: 'PUT',
      json: updatedDeviation,      
      headers: {
        'x-custid': custID
      }
    }  
    request(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {        
        this.setState({
          // warningMessage: "Succesfully updated new deviation!",
          // warningOpen: true,
          preferencesSet: true,
          allowedDeviation: this.state.displayDeviation
        });
        this.handleSnackBarMessage("Succesfully updated new deviation!", "success");
        
      } else {
        // this.setState({
        //   warningMessage: "Failed to update new deviation.",
        //   warningOpen: true,
        // });
        this.handleSnackBarMessage("Failed to update new deviation", "error");
      }
    })
  }

  // TODO: might not be working, need more test cases
  postCurrPortfolioPrefs(portfolioId, custID) {
    let allocationsClone = JSON.parse(JSON.stringify(this.state.fundsTargets));
    let portfolioRequest = 
      {
        "allocations": allocationsClone,
        "deviation": this.state.displayDeviation,
        "type": this.state.portfolioType
      };
    if (this.state.funds.length !== this.state.fundsTargets.length){
      throw new Error ("Number of funds " + this.state.funds.length + "mismatch with number of target percents " + this.state.fundsTargets.length);
    }
    console.log("this is the post request obj "+ JSON.stringify(portfolioRequest));
    console.log(portfolioRequest.allocations);

    let options = {
      url: "https://fund-rebalancer-dot-hsbc-roboadvisor.appspot.com/roboadvisor/portfolio/"+ portfolioId,      
      method: 'POST',
      json: portfolioRequest,      
      headers: {
        'x-custid': custID
      }
    }  
    request(options, (error, response, body) => {
      if (!error && response.statusCode === 201) {        
        this.setState({
          // warningMessage: "Succesfully posted new preferences!",
          // warningOpen: true,
          preferencesSet: true,
          allowedDeviation: this.state.displayDeviation
        });
        this.handleSnackBarMessage("Succesfully posted new preferences!", "success");
        
      } else {
        this.setState({
          // warningMessage: "Failed to post new preferences.",
          // warningOpen: true,
          preferencesSet: false
        });
        this.handleSnackBarMessage("Failed to post new preferences", "error");
        
        console.log(custID);
        console.log(portfolioId);
      }
    })
  }
  
  getRebalance(portfolioId, custID) {
    let options = {
      url: "https://fund-rebalancer-dot-hsbc-roboadvisor.appspot.com/roboadvisor/portfolio/"+portfolioId+"/rebalance",      
      method: 'POST',
      headers: {
        'x-custid': custID
      }
    }  
    request(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        let trans = JSON.parse(body)
        let recUnitsByFundId = {};
        let recActionByFundId = {};
        let recommendationId = trans.recommendationId;
        console.log("this is rec id" + recommendationId);
        for (let k = 0; k < trans.transactions.length; k++){
          let fundId = trans.transactions[k].fundId;
          let units = trans.transactions[k].units;
          let action = trans.transactions[k].action;
          recUnitsByFundId[fundId] = units;
          recActionByFundId[fundId] = action;
          // console.log("hi" + recUnitsByFundId[fundId].units);
          // console.log("hi" + recUnitsByFundId[fundId].action);
        }
        this.setState({
          recommendationId: recommendationId,
          recommendations: trans.transactions,
          recUnitsByFundId: recUnitsByFundId,
          recActionByFundId: recActionByFundId
        });
        console.log("did i get run")
        
      } else {
        this.setState({
          //preferencesSet: false,
          //targets: temp
        });
        console.log(response.statusCode);        
        console.log(custID);
        console.log(portfolioId);
      }
    })
  }

  handleDeviationChange = (e) => {
    this.setState({
      displayDeviation: Number(e.target.value),
    });
  }

  handleTargetChange = index => event => {
    let displayTargets = this.state.displayTargets;
    let funds = this.state.funds;

    // if Allocation not available, prepopulate target array
    if (!this.state.preferencesExist || this.state.targetsOutOfDate) {
      for (let i = 0; i < funds.length; i++){
        displayTargets.push({"fundId" : funds[i].fundId, "percentage": 0});
      }
    }
    displayTargets[index].percentage = Number(event.target.value);    

    console.log("current display targets length " + displayTargets.length)
    console.log("Current display target for index " + index + "=" + displayTargets[index].percentage)
    //console.log("Current actual target for index " + index + "=" + this.state.fundsTargets[index].percentage)

    this.setState({
      //displayTargets: displayTargets,
      preferencesExist: true
    });
  }

  // TODO: able to modify recommendations
  handleRecommendationChange = index => event => {

  }

  handleAllocationButtonChange = (e) => {
    this.setState({ 
      allocationButtonColor: this.state.allocationButtonClicked ? 'blue' : 'default' });
  }


  handleRebalanceButtonChange = (e) => {
    this.setState({ 
      rebalanceButtonColor: this.state.rebalanceButtonClicked ? 'blue' : 'default' });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.allocationButtonClicked !== prevState.allocationButtonClicked) {
      this.handleAllocationButtonChange();      
    }
    if (this.state.rebalanceButtonClicked !== prevState.rebalanceButtonClicked){
      this.handleRebalanceButtonChange();
      this.handleTransitionSlide();
    }    
  }

  handleSetAllocationClick = (e) => {
    if (!this.state.rebalanceButtonClicked){
      let fundsTargets = JSON.parse(JSON.stringify(this.state.fundsTargets));
      this.setState({
        allocationButtonClicked: true,
        rebalanceButtonClicked: false,
        displayDeviation: this.state.allowedDeviation,  
        displayTargets: fundsTargets      
      })
    }
    if (this.state.allocationButtonClicked){
      this.handleCancelClick();      
    }
  }

  handleRebalanceClick = (e) => {
    if (this.state.allocationButtonClicked){
      // do nothing
    } else if (this.state.rebalanceButtonClicked){
      this.handleCancelClick();
    } else if (this.state.preferencesSet && this.state.preferencesExist && !this.state.rebalanceButtonClicked){
      this.getRebalance(this.state.portfolioId, this.state.customerId);
      this.setState({
        rebalanceButtonClicked: true,
        allocationButtonClicked: false,
      })
    } else if (!this.state.preferencesSet && !this.state.rebalanceButtonClicked){
      this.handleSnackBarMessage("Allocation has not been set", "error");
    } else {

    }
  }

  handleBack = (e) => {
    this.setState({
      toDashboard: true
    })
  }

  handleCancelClick = (e) => {
    this.setState({
      allocationButtonClicked: false,
      rebalanceButtonClicked: false,
    })    
    
  }

  // barstyle can be success, error, warning, info, or left blank for default
  handleSnackBarMessage = (message, barStyle) => {   
    this.props.enqueueSnackbar(message, { 
      variant: barStyle,
      autoHideDuration: 3000,
      preventDuplicate: true,
      action: (
        <Button size="small">
          <MuiThemeProvider theme={colorTheme}>
            <CloseIcon color="error" />
          </MuiThemeProvider>
        </Button>
      )               
    });
  };

  handleSaveAllocation = (e) => {
    let sum = 0;
    let dev = this.state.displayDeviation;
    let displayTargets = this.state.displayTargets;

    if (displayTargets.length > 0){
      for (let i = 0; i < displayTargets.length; i++){
        sum += displayTargets[i].percentage;
      }
      //sum = this.state.targets.reduce((partial_sum, a) => partial_sum + a);
    } 
    console.log(sum);

    if(dev < 0 || dev > 5 || dev === undefined || dev === null){
      this.handleSnackBarMessage("Deviation must be between 0-5%", "error");
    } else if(sum !== 100) {
      this.handleSnackBarMessage("Target % does not add up to 100", "error");
    } else {
      if (!this.state.preferencesSet){
        this.postCurrPortfolioPrefs(this.state.portfolioId, this.state.customerId);
      } else {
        this.putCurrPortfolioPrefs(this.state.portfolioId, this.state.customerId);
        // only put new deviation if different
        if (dev !== this.state.allowedDeviation){
          this.putCurrPortfolioDeviation(this.state.portfolioId, this.state.customerId);
        }
      }

      // Deep copy displayTargets onto fundTargets
      let fundsTargets = JSON.parse(JSON.stringify(displayTargets));
      this.setState({
        //warningOpen: false,
        allocationButtonClicked: false,
        rebalanceButtonClicked: false,
        preferencesExist: true,
        fundsTargets: fundsTargets
      })
    }
    
  }

  // handleAlertClose = (e) => {
  //   this.setState({
  //     warningOpen: false
  //   })
  // }

  handleModifyRecClick = (e) => {
    this.handleSnackBarMessage('modify not implemented yet');
  }
  handleExecuteRecClick = (e) => {
    let that = this;
    let promise1 = this.postExecuteRecommendation(this.state.portfolioId, this.state.customerId, this.state.recommendationId);


    promise1.then( value => { 
      that.handleCancelClick();
      window.location.reload();
      this.handleSnackBarMessage("Succesfully executed recommendation", "success");
    })
    
  }

  postExecuteRecommendation(portfolioId, custId, recId) {
    return new Promise(function(resolve, reject) {    
      let options = {
        url: "https://fund-rebalancer-dot-hsbc-roboadvisor.appspot.com/roboadvisor/portfolio/"+portfolioId+"/recommendation/"+recId+"/execute",      
        method: 'POST',   
        headers: {
          'x-custid': custId
        }
      }  
      request(options, (error, response, body) => {
        if (!error && response.statusCode === 200) { 
           
          resolve(body);      
          // Force reload to get current values to update, its hacky, but works
          //window.location.reload();
                  
                            
        } else {
          reject(error);
          this.handleSnackBarMessage("Failed to execute recommendation " + recId, "error");
          console.log(custId);
          console.log(portfolioId);
        }
      })
    })
  }

  
  getFunds(custId) {
    let options = {
      url: "https://fund-rebalancer-dot-hsbc-roboadvisor.appspot.com/roboadvisor/fundsystem/portfolios",
      method: 'GET',
      headers: {
        'x-custid': custId
      }
    }
    let that = this;

    return new Promise(function(resolve, reject) {
      request(options, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          let info = JSON.parse(body);
          //console.log(info);
          let tempFunds;
          let tempFundBalances = new Map();
          for (let i = 0; i<info.length; i++) {
            if(info[i].id === that.state.portfolioId) {
              tempFunds = info[i].holdings;
            }
          }
          let tempTotal = 0;
          for(let i =0; i<tempFunds.length; i++) {
            tempFundBalances.set(tempFunds[i].fundId, tempFunds[i].balance);
            tempTotal += tempFunds[i].balance.amount;
          }

          let funds = JSON.parse(JSON.stringify(tempFunds)); 
          that.setState({
            funds: funds,
            fundBalances: tempFundBalances,
            totalBalance: tempTotal
          },          
          resolve()
          );          
                
        } else {
          console.log("getPortfolioList res code: " + response.statusCode)
          console.log(error);
          reject(error);
        }
      });
  }).then(value => {
    this.getCurrPortfolioPrefs(this.state.customerId)
  }) 
  }


  createFund(index, checked) {
    let portion = Math.round(this.state.funds[index].balance.amount * 100 / this.state.totalBalance);
    let currFundID = this.state.funds[index].fundId;
    let currFund = this.state.fundBalances.get(currFundID);
     return (
      <Slide direction="right" in={checked} mountOnEnter unmountOnExit>      
        <Paper className="fundCard"> 
          <Grid container direction="row" className="fundRow">
            {/* <Grid item xs={4} container direction="column" className="percentColumn">
              <Grid item>
                <Typography variant="subtitle1">Fund ID</Typography>
              </Grid>
              <Grid item>
                <Typography className="fundIDString" variant="subtitle1">{this.state.funds[index].fundId}</Typography>
              </Grid>
            </Grid>           */}

            <Grid xs={4} container direction="column" className="fundInfoColumn">
              <Grid item>
              <MuiThemeProvider theme={colorTheme}>
              <Typography variant="body1"><b>Fund ID: {currFundID}</b></Typography>
              <Typography variant="body1" inline={true}>Balance: </Typography>
              <Typography variant="body1" inline={true} color="primary"> {'$' + currFund.amount.toFixed(2) + ' ' + currFund.currency} </Typography>
              </MuiThemeProvider>
              </Grid>
            </Grid>
        
          <Grid xs={4} container direction="column" className="percentColumn">
            {/* <Grid item>
              <Typography variant="subtitle1">Current</Typography>
            </Grid> */}

            <Grid item>
              <MuiThemeProvider theme={textfieldTheme}>
                <TextField
                disabled id="filled-disabled"
                // label="Current %"
                defaultValue={portion}
                inputProps={{
                  style: { fontSize: 14, textAlign: "center", color:"white", backgroundColor:"#9e9e9e", overflow:"hidden", borderColor: '#9e9e9e', borderWidth: 2, borderRadius: 3,}
                }}
                margin="normal"
                variant="outlined"
                style = {{width: '80px'}}                     
                />
              </MuiThemeProvider>
            </Grid>
          </Grid> 
          {this.state.allocationButtonClicked ? (
            <Grid xs = {4} container direction="column" className="percentColumn">
            {/* <Grid item>
              <Typography variant="subtitle1" >Target </Typography>
            </Grid> */}
              <MuiThemeProvider theme={textfieldTheme}>
              <TextField
                id="outlined-number"
                // label="Target %"
                value={(!this.state.preferencesExist) ? (0):(this.state.displayTargets[index].percentage)}
                onChange={this.handleTargetChange(index)}
                type="number"
                inputProps={{
                  style: { fontSize: 14, textAlign: "center", color:"black", backgroundColor:"white", overflow:"hidden", borderColor: '#9e9e9e', borderWidth: 2, borderRadius: 3,}
                }}
                className="textField"       
                margin="normal"
                variant="outlined"
                style = {{width: 80}}                          
              />       
            </MuiThemeProvider>                
            </Grid> 
          ) : (
            <Grid xs = {4} container direction="column" className="percentColumn">
              {/* <Grid item>
              <Typography variant="subtitle1"> Target </Typography>
              </Grid> */}
              <Grid item>
              <MuiThemeProvider theme={textfieldTheme}>
              <TextField
                disabled
                // label="Target %"
                id="filled-disabled"
                value={(!this.state.preferencesExist) ? ("N/A"):(this.state.fundsTargets[index].percentage)}
                inputProps={{
                  style: { fontSize: 14, textAlign: "center", color:"white", backgroundColor:"#9e9e9e", overflow:"hidden", borderColor: '#9e9e9e', borderWidth: 2, borderRadius: 3,}
                }}
                className="textField"
                margin="normal"
                variant="outlined"              
                style = {{width: 80}}                                   
              />
              </MuiThemeProvider>
              </Grid>
            </Grid>
          )}          
        </Grid>
      </Paper> 
    </Slide>
    )}

  createChart(index) {
    // let portion = Math.round(this.state.funds[index].balance.amount * 100 / this.state.totalBalance);
    let graph = {
      datasets: [{
        data: [],
        backgroundColor: []
      }],
      labels: []
    };
    let funds = this.state.funds;
    let myColors = [
      '#FF6384',
      '#36A2EB',
      '#FFCE56',
      '#4caf50',
      '#ff9100',
      '#9c27b0',
      '#1de9b6'
      ];
    for(let i=0; i<funds.length; i++) { 
      //let random = i + Math.round(Math.random()*100);
      //console.log("heres my number" + random);     
      graph.labels.push(this.state.funds[i].fundId);
      graph.datasets[0].data.push(Math.round(this.state.funds[i].balance.amount * 100 / this.state.totalBalance));
      //let color = (i === index) ? '#FF6384' : '#e0e0e0';
      let color = (i !== index) ? '#e0e0e0' : 
      (myColors[(i%myColors.length)]);
      
      graph.datasets[0].backgroundColor.push(color);
    }

    return (
        <Doughnut
          key={index}
          data={graph}          
          width={100}
          height={120}
          options={{
            padding:"0px",
            responsive: false,
            maintainAspectRatio: true,
            legend:{
              display:false,
            }
          }}         
          //options={dashboardEmailStatisticsChart.options}
        />
    )
  }

  handleBuyOrSell = (event, buyOrSell) => {
    this.setState({ buyOrSell });
  }

  createRecommendation(index) {
    const { classes } = this.props;
    return (      
        <Paper className="fundCard">
          <Typography variant="subtitle1">Recommendation:</Typography>
          <Grid container direction="row" className="recommendCard">
            <Grid item className="percentColumn">
            {/* TODO: fix up buy sell buttons */}
            <div className={classes.toggleContainer}>            
              <ToggleButtonGroup 
              value={this.state.recActionByFundId[this.state.funds[index].fundId] || ""} 
              //exclusive onChange={this.handleBuyOrSell}
              >                            
                <ToggleButton value="buy">
                  BUY
                </ToggleButton>
                  <ToggleButton value="sell">
                  SELL
                </ToggleButton>                
              </ToggleButtonGroup>            
              {/* <Button variant="contained" color="default" className="sellButtonClass">
                Sell
              </Button>
            </Grid>
            <Grid item className="percentColumn">
              <Button variant="contained" color="secondary" className="sellButtonClass">
                Buy
              </Button> */}
            </div>
            </Grid>
            
            <Grid item className="percentColumn">
            <MuiThemeProvider theme={textfieldTheme}>
            <TextField
              disabled id="filled-disabled"
              //id="outlined-number"
              label="Units"
              value = {this.state.recUnitsByFundId[this.state.funds[index].fundId] || 0}
              onChange={this.handleRecommendationChange(index)}
              type="number"
              className="textField"
              margin="normal"
              variant="outlined"
              InputLabelProps={{ shrink: true }} 
              style = {{width: 100}}
            />
            </MuiThemeProvider>
            </Grid>
          </Grid>
        </Paper>      
    )
  }

  handleTransitionSlide = () => {
    this.setState(state => ({ checked: !state.checked }));
  };

  createMiniFund(index) {
    let portion = Math.round(this.state.funds[index].balance.amount * 100 / this.state.totalBalance);
    let currFundID = this.state.funds[index].fundId;
    let currFund = this.state.fundBalances.get(currFundID);
    
    return (      
        <Paper className="fundCard">
          <Grid container direction="column" className="miniFundCard">
              <MuiThemeProvider theme={colorTheme}>
              <Typography variant="body1"><b>Fund ID: {currFundID}</b></Typography>
              <Typography variant="body1" inline={true}>Balance: </Typography>
              <Typography variant="body1" inline={true} color="primary"> {'$' + currFund.amount.toFixed(2) + ' ' + currFund.currency} </Typography>
              <Typography variant="body1">Current: {portion + '%'}</Typography>
              <Typography variant="body1">Target: {this.state.fundsTargets[index].percentage + '%'}</Typography>
              </MuiThemeProvider>
          </Grid>
        </Paper>
      )
  }


  render() {
    const { classes } = this.props;
    const { checked } = this.state;
    if (this.state.toDashboard === true) {
      return <Redirect to= {
        {
          pathname: '/dashboard',
          state: { 
            customerId: this.state.customerId 
          }
        }
      }
      />;
    } 
    
    let that = this;

    return (
      <div className="portfolioContainer">
        <Grid container justify="flex-end" spacing={24}>
          <Grid xs={12} item>
            <TCard className="portfolioHeader">
              <CardBody>
                <Row>
                  <Col xs={6} md={6}>
                    <Typography gutterBottom variant="subtitle1" component="h2">
                      Portfolio ID: {this.state.portfolioId}
                    </Typography>
                  </Col>
                  <Col xs={6} md={6}>
                    <Typography gutterBottom variant="subtitle1" component="h2">
                      Customer ID: {this.state.customerId}
                    </Typography>
                  </Col>
                </Row>
              </CardBody>
            </TCard>         
            <Grid item xs={12}>
              <MuiThemeProvider theme={colorTheme}>
              <Button variant="contained" onClick={this.handleBack} color="default" className="topButton">
                Back
              </Button>
              {/* <Button variant="contained" onClick={this.handleSetAllocationClick} color="default" className="topButton">
                Set Allocation
              </Button> */}
              <Button
                variant="contained" 
                className={classNames(classes.button, {
                [classes.buttonBlue]: this.state.allocationButtonColor === 'blue',
                })}
                onClick={this.handleSetAllocationClick}>
              {!this.state.preferencesSet ? 'SET ALLOCATION':'UPDATE ALLOCATION'}
              </Button>
              <Button
                variant="contained"
                className={classNames(classes.button, {
                [classes.buttonBlue]: this.state.rebalanceButtonColor === 'blue',
                })}
                onClick={this.handleRebalanceClick}>
              {'REBALANCE'}
              </Button>
              </MuiThemeProvider>
            </Grid>            
            <div xs={6} lg={8} className="allowedDeviationClass">
            <Grid container justify="flex-start">
            {this.state.allocationButtonClicked ? (
              <MuiThemeProvider theme={textfieldTheme}>
                <TextField
                  id="outlined-number"
                  label="Allowed Deviation"
                  value={this.state.displayDeviation || ""}
                  onChange={this.handleDeviationChange}
                  type="number"
                  className="textField"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  margin="normal"
                  variant="outlined"
                  style={{width: 200}}
                />
              </MuiThemeProvider>
            ):(
              <Typography variant="subtitle1"  className="allowedDeviationText">
                <AssessmentIcon fontSize="inherit" className="assessmentIcon"/>                
                Allowed Deviation: {(this.state.allowedDeviation === null || this.state.allowedDeviation === undefined ) ?
                   ("NOT SET"):(this.state.allowedDeviation+"%")}
              </Typography>              
            )}
            {(this.state.recommendationId !== null && this.state.rebalanceButtonClicked) ? (
              <Typography variant="subtitle1" inline={true} className="recommendationIdText">
              <BookmarkBorderIcon fontSize="inherit" className="assessmentIcon"/>                
              Recomendation ID: {this.state.recommendationId || "NOT AVAILABLE"}
              </Typography> 
            ):(
              <Typography></Typography>  // false item
            )}        
            </Grid> 
            </div>
            {!that.state.rebalanceButtonClicked ? (  // Header row
            <Slide direction="right" in={checked} mountOnEnter unmountOnExit>
              <div xs={12}>   
                <Grid container justify="flex-start" direction="row" spacing={24} className="tableHeader">
                  <Grid item lg = {10}>
                    <div> 
                      <Grid container >
                        <Grid item xs={4}>
                          <Typography></Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography gutterBottom variant="subtitle1" component="h2">
                            <b>Current %</b>
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography gutterBottom variant="subtitle1" component="h2">
                            <b>Target %</b>
                          </Typography>
                        </Grid>
                      </Grid>
                    </div>                  
                  </Grid>
                </Grid>
              </div>
            </Slide>
            ):(<div></div>)
            }
            {this.state.funds.map(function(object, i){
                return (
                  <div xs={12} key={i} className="fundsTable">
                    <Grid container justify="flex-start" direction="row" spacing={24}>  
                      <Grid item lg ={that.state.rebalanceButtonClicked ? 6 : 10}>
                        {that.state.rebalanceButtonClicked? 
                          that.createMiniFund(i) :
                          that.createFund(i, checked)}    
                      </Grid>
                      <Grid item >
                        <Grid container className="donut">
                          <Grid item>
                            {that.createChart(i)}
                          </Grid>
                        </Grid>
                      </Grid>
                      <Grid lg={4} item>
                        {that.state.rebalanceButtonClicked && that.createRecommendation(i)} 
                      </Grid>              
                    </Grid>
                  </div> 
                );
            })}
            {this.state.allocationButtonClicked && (
              <Grid container spacing={24} className="bottomRow">
                <Grid item>
                <MuiThemeProvider theme={colorTheme}>
                  <Button onClick={this.handleSaveAllocation} variant="contained" color="secondary" className="topButton">
                    SAVE
                  </Button>
                  <Button onClick={this.handleCancelClick} variant="contained" color="default" className="topButton">
                    CANCEL
                  </Button>
                </MuiThemeProvider>
                </Grid>
              </Grid>
            )}
            {this.state.rebalanceButtonClicked && (
              <MuiThemeProvider theme={colorTheme}>
                <Grid container spacing={24} className="bottomRow">
                  <Grid item>
                    <Button onClick={this.handleModifyRecClick} variant="contained" color="secondary" className="topButton">
                      MODIFY
                    </Button>
                    <Button onClick={this.handleExecuteRecClick} variant="contained" color="secondary" className="topButton">
                      EXECUTE
                    </Button>
                    <Button onClick={this.handleCancelClick} variant="contained" color="default" className="topButton">
                      CANCEL
                    </Button>
                  </Grid>
                </Grid>
              </MuiThemeProvider>
            )}
            {/* <Snackbar
              className="Snackbar"
              open={this.state.warningOpen}
              autoHideDuration={3000}
              onClose={this.handleAlertClose}>
              <SnackbarContent
                className="SnackbarContent"
                aria-describedby="client-snackbar"
                message={
                  <span id="client-snackbar" className="message">
                    <ErrorIcon className="icon" />
                    {this.state.warningMessage}
                  </span>
                }
                action={[
                  <IconButton
                    className="close"
                    onClick={this.handleAlertClose}
                  >
                    <CloseIcon className="closeIcon" />
                  </IconButton>
                ]}
              />
            </Snackbar> */}
          </Grid>
          </Grid>
        </div>      
    );
  }
}

// //const MyApp = withSnackbar(Portfolio);


//     <SnackbarProvider maxSnack={3}>
//       <Portfolio />
//     </SnackbarProvider>


//export default withStyles(styles)(Portfolio);
// // export const hello = MyApp;
// export default withSnackbar(Portfolio);

Portfolio.propTypes = {
  enqueueSnackbar: PropTypes.func.isRequired,
};

// const MyApp = withSnackbar(Portfolio);

// function IntegrationNotistack() {
//   return (
//     <SnackbarProvider maxSnack={2}>
//       <MyApp />
//     </SnackbarProvider>
//   );
// }

export default withStyles(styles)(withSnackbar(Portfolio));