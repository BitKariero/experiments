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

//mainbk
var mainBKsc = fs.readFileSync('main.sol', 'utf8');

//compile and get ABI
var mainBKcompiled = web3.eth.compile.solidity(mainBKsc);
var mainBKabi = web3.eth.contract(mainBKcompiled.mainBK.info.abiDefinition);

//address of mainBK on testnet
var mainBKaddr = '0x20ed2f65451e2d69152d440da9aca0ea4f1539ee';
var mainBK = web3.eth.contract(mainBKabi.abi).at(mainBKaddr);


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
3.\tVerify a reference\n\
4.\tSearch for my TXs through blockchain (very slow)\n\
5.\tSearch mainBK logs";

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
                            mainBK.addRequest(answerb.to, contract.address, {from: answerb.from});
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
        case '4':
            //based upon https://forum.ethereum.org/discussion/2744/eth-getblockbyhash-x-true-shows-all-transactions-or-your-transactions
            inquirer.prompt([{type:'input',name:'address',message:'Account to search for'}]).then( (answer) => {
                var dStart = new Date().getTime();
                for(var i = 0; i < web3.eth.blockNumber; i++) {
                    if (web3.eth.getBlockTransactionCount(i)) {
                        var block = web3.eth.getBlock(i, true);
                        for (var j = 0; j < block.transactions.length; j++) {
                            if(block.transactions[j].from === answer.address) {
                                console.log(block.transactions[j]);
                            }
                        }
                    }
                    if(i % 100 == 0) {
                        console.log(i);
                    }
                }
                var dEnd = new Date().getTime();
                console.log(dEnd - dStart);
            });
            break;
        case '5':
            inquirer.prompt([{type:'input',name:'address',message:'Sent from'}]).then( (answer) => {

                var addEvent = mainBK.evAddRequest({from: answer.address}, {fromBlock:0, toBlock: 'latest'});

                addEvent.watch(function(error, log) {
                    console.log(log);
                });
                    
            });
            break;
        }
    });
}

mainui();
