#!/usr/bin/env node

//basic app to user ref1.sol
//needs web3 and inquirer

//load web3
var Web3 = require('web3');
web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

//check if we are connected
if(!web3.isConnected()) {
    console.log("Could not connect to geth RPC, exiting");
    process.exit(1);
}

//read solidity source
var fs = require('fs');
var refsc = fs.readFileSync('ref1.sol', 'utf8');

//compile and get ABI
var refcompiled = web3.eth.compile.solidity(refsc);
var refabi = web3.eth.contract(refcompiled.bkref.info.abiDefinition);


//run CLI
//list wallets

console.log("You have the following accounts");
for (account in web3.eth.accounts) {
    console.log(web3.eth.accounts[account]);
}

var inquirer = require('inquirer');

var mainuioptions = "what do you want to do \n\
1.\tCreate a new reference request \n\
2.\tAttach a reference to an existing request \n\
3.\tVerify a reference\n";

//prompt user
function mainui () {
inquirer.prompt([{ type: 'input', name: 'main', message: mainuioptions}]).then( (answer) => {
    //run code path
    switch(answer.main) {
        case '1':
            //create ref
            var createquestions = [
                {
                    type: 'input',
                    name: 'from',
                    message: 'Account to send from'
                }, {
                    type: 'input',
                    name: 'accountpassword',
                    message: 'Password for wallet'
                }, {
                    type: 'input',
                    name: 'to',
                    message: 'Account to send to'
                } 
            ];

            inquirer.prompt(createquestions).then( (answerb) => {
                
                //unlock account
                if(!web3.personal.unlockAccount(answerb.from, answerb.accountpassword)) {
                    console.log("Invalid Password");
                } else {
                    console.log('Creating tx');
                    

                    //create smart con
                    refabi.new(answerb.to, {from: answerb.from, data: refcompiled.bkref.code, gas: 400000}, (e, contract) => {
                    if(e) {
                        console.log(e);
                    } else {
                        if(!contract.address) {
                            console.log("tx sent, waiting to be mined");
                        } else {
                            console.log("mined at " + contract.address);
                        }
                    }
                    
                    }); 
                    
                }
            //  mainui();
            });
            break;
        case '2':
            //attach ref
             var createquestions = [
                {
                    type: 'input',
                    name: 'from',
                    message: 'Account to send from'
                }, {
                    type: 'input',
                    name: 'accountpassword',
                    message: 'Password for wallet'
                }, {
                    type: 'input',
                    name: 'address',
                    message: 'Address of smart contract'
                }, {
                    type: 'input',
                    name: 'reference',
                    message: 'Reference to attach'
                }
            ];

            inquirer.prompt(createquestions).then( (answerb) => {
                
                //unlock account
                if(!web3.personal.unlockAccount(answerb.from, answerb.accountpassword)) {
                    console.log("Invalid Password");
                } else {
                    //check if there is contract at address
                    if(web3.eth.getCode(answerb.address).length === 2) {
                        console.log("Invalid address");
                    } else {
           
                        var refo = web3.eth.contract(refabi.abi).at(answerb.address);
                        
                        if(refo.organisation() != answerb.from) {
                            console.log("Contract is for different account: " + refo.organisation());
                        } else {
                            //add ref
                            refo.addref(answerb.reference, {from: answerb.from});
                            console.log("Attached reference");
                        }
                    }
                }
            });
            break;
        case '3':
            inquirer.prompt([{type:'input',name:'address',message:'Address of SC'}]).then( (answer) => {
                if(web3.eth.getCode(answer.address).length === 2) {
                    console.log("Invalid address)");
                } else {
                    var refo = web3.eth.contract(refabi.abi).at(answer.address);
                    console.log("Requested by: " + refo.owner());
                    console.log("Fufiled by: " + refo.organisation());
                    console.log("Reference: " + refo.reference());
                }
            });
            break;
        }
    });
}

mainui();
