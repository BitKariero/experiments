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
var identity_abi = web3.eth.contract(refcompiled.bkIdentity.info.abiDefinition);

var membership_abi = web3.eth.contract(refcompiled.bkMembership.info.abiDefinition);
var reference_abi  = web3.eth.contract(refcompiled.bkReference.info.abiDefinition);

console.log("You have the following accounts");
for (account in web3.eth.accounts) {
    console.log(web3.eth.accounts[account]);
}

var inquirer = require('inquirer');

var mainuioptions = "what do you want to do \n\
1. \tCreate new Identity \n\
2. \tRetrieve details of an identity\n\
3. \tAdd a provider to your Identity\n\
4. \tVouch for an Identity\n\
5. \tRemove a provider from your Identity\n\
6. \tUnvouch a particular identity\n\
7. \tMembership Contract\n\
8. \tReference Contract\n\
9. \tList all the Providers for an Identity\n\
10.\tList all the Vouchers for an Identity";

function mainui ()
{
inquirer.prompt([{ type: 'input', name: 'main', message: mainuioptions}]).then( (answer) =>
  {
    switch(answer.main)
    {
      case '1':
          //create ref
          var createquestions = [
              {
                  type: 'input',
                  name: 'from',
                  message: 'Account to create identity of'
              }, {
                  type: 'input',
                  name: 'accountpassword',
                  message: 'Password for wallet'
              }, {
                  type: 'input',
                  name: 'fullname',
                  message: 'Your full name please '
              }, {
                  type: 'input',
                  name: 'DOB',
                  message: 'Your Date of Birth in DDMMYY '
              }
          ];

          inquirer.prompt(createquestions).then( (answerb) => {

              //unlock account
              if(!web3.personal.unlockAccount(answerb.from, answerb.accountpassword)) {
                  console.log("Invalid Password");
              } else {
                  console.log('Creating tx');


                  //create smart con
                  identity_abi.new(answerb.from, answerb.fullname, answerb.DOB, {from: answerb.from, data: refcompiled.bkIdentity.code, gas: 1000000}, (e, contract) => {
                  if(e)
                  {
                      console.log(e);
                  }
                  else
                  {
                      if(!contract.address)
                      {
                          console.log("tx sent, waiting to be mined");
                      }
                      else
                      {
                          console.log("Your Identity has been created at " + contract.address);
                      }
                  }
                  });

              }
          //  mainui();
          });
      break;
      case '2':
        inquirer.prompt([{type:'input',name:'address',message:'Address of the identity contract '}]).then( (answer) => {
            if(web3.eth.getCode(answer.address).length === 2)
            {
                console.log("Invalid address)");
            }
             else
             {
                var refo = web3.eth.contract(identity_abi.abi).at(answer.address);
                console.log("Full Name: " + refo.ownerName());
                console.log("DOB: " + refo.ownerDOB());
            }
        });
      break;
      case '3':
      var createquestions = [
          {
              type: 'input',
              name: 'owner',
              message: 'Your account '
          }, {
              type: 'input',
              name: 'accountpassword',
              message: 'Password for wallet'
          }, {
              type: 'input',
              name: 'identity',
              message: 'Address of identity '
          }, {
              type: 'input',
              name: 'provider',
              message: 'The provider '
          }
      ];

      inquirer.prompt(createquestions).then( (answerb) =>
      {
        if(!web3.personal.unlockAccount(answerb.owner, answerb.accountpassword))
        {
            console.log("Invalid Password");
        }
        else
        {
          var refo = web3.eth.contract(identity_abi.abi).at(answerb.identity);
          if(refo.owner() != answerb.owner) { console.log("Account did not match identity."); }
          else { refo.addProvider(answerb.provider, {from: answerb.owner }  );
                 console.log("Identity successfully matched account." + answerb.provider + " has been sucessfully added as a provider.");
               }
        }

      });
      break;
      case '4':
      var createquestions = [
          {
              type: 'input',
              name: 'voucher',
              message: 'Your account as a voucher '
          }, {
              type: 'input',
              name: 'accountpassword',
              message: 'Password for wallet'
          }, {
              type: 'input',
              name: 'identity',
              message: 'Address of identity to vouch for'
          }
      ];

      inquirer.prompt(createquestions).then( (answerb) =>
      {
        if(!web3.personal.unlockAccount(answerb.voucher, answerb.accountpassword))
        {
            console.log("Invalid Password");
        }
        else
        {
          var refo = web3.eth.contract(identity_abi.abi).at(answerb.identity);
          refo.vouch({from: answerb.voucher });
          console.log("You have successfully vouched for " + refo.owner());
        }
      });
      break;
      case '5':
      var createquestions = [
          {
              type: 'input',
              name: 'owner',
              message: 'Your account '
          }, {
              type: 'input',
              name: 'accountpassword',
              message: 'Password for wallet'
          }, {
              type: 'input',
              name: 'identity',
              message: 'Your Identity Contract '
          }, {
              type: 'input',
              name: 'provider',
              message: 'Account of provider to remove '
          }
      ];

      inquirer.prompt(createquestions).then( (answerb) =>
      {
        if(!web3.personal.unlockAccount(answerb.owner, answerb.accountpassword))
        {
            console.log("Invalid Password");
        }
        else
        {
          var refo = web3.eth.contract(identity_abi.abi).at(answerb.identity);
          refo.removeProvider(answerb.provider, {from: answerb.owner});
          console.log("You have successfully removed " + answerb.provider + " from providers.");
        }
      });
      break;
      case '6':
      var createquestions = [
          {
              type: 'input',
              name: 'provider',
              message: 'Your account as a provider '
          }, {
              type: 'input',
              name: 'accountpassword',
              message: 'Password for wallet '
          }, {
              type: 'input',
              name: 'identity',
              message: 'Address of identity to unvouch '
          }
      ];

      inquirer.prompt(createquestions).then( (answerb) =>
      {
        if(!web3.personal.unlockAccount(answerb.provider, answerb.accountpassword))
        {
            console.log("Invalid Password");
        }
        else
        {
          var refo = web3.eth.contract(identity_abi.abi).at(answerb.identity);
          refo.unVouch( {from: answerb.provider });
          console.log("You have successfully unvouched " + answerb.identity);
        }
      });
      break;
      case '7':
        var createquestions = "\n\
        1.\tCreate a new Membership Request \n\
        2.\tGrant membership to an existing request \n\
        3.\tVerify an existing membership \n\
        4.\tRevoke an existing membership";

        inquirer.prompt([{ type: 'input', name: 'main', message: createquestions}]).then( (answerc) =>
        {
          switch(answerc.main)
          {
            case '1':
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

            inquirer.prompt(createquestions).then( (answerd) =>
            {
              //unlock account
                if(!web3.personal.unlockAccount(answerd.from, answerd.accountpassword))
                {
                    console.log("Invalid Password");
                }
                else {
                    console.log('Creating tx');
                    //create smart con
                    membership_abi.new(answerd.to, {from: answerd.from, data: refcompiled.bkMembership.code, gas: 700000}, (e, contract) => {
                    if(e) {
                        console.log(e);
                    }
                    else
                    {
                        if(!contract.address)
                        {
                            console.log("Membership Contract sent, waiting to be mined");
                        } else
                        {
                            console.log("Membership Contract created at " + contract.address);

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
                    message: 'Address of Membership contract'
                }, {
                    type: 'input',
                    name: 'reference',
                    message: 'Membership Content to attach '
                }
            ];

            inquirer.prompt(createquestions).then( (answerd) => {

                //unlock account
                if(!web3.personal.unlockAccount(answerd.from, answerd.accountpassword))
                {
                    console.log("Invalid Password");
                } else {
                    //check if there is contract at address
                    if(web3.eth.getCode(answerd.address).length === 2) {
                        console.log("Invalid address");
                    } else {

                        var refo = web3.eth.contract(membership_abi.abi).at(answerd.address);

                        if(refo.organisation() != answerd.from) {
                            console.log("Contract is for different account: " + refo.organisation());
                        }
                        else
                        {
                            //add ref
                            refo.addContent(answerd.reference, {from: answerd.from});
                            console.log("Attached Membership content");
                        }
                    }
                }
            });
            break;
            case '3':
            inquirer.prompt([{type:'input',name:'address',message:'Address of Membership Contract '}]).then((answer) => {
                if(web3.eth.getCode(answer.address).length === 2) {
                    console.log("Invalid address)");
                } else {
                    var refo = web3.eth.contract(membership_abi.abi).at(answer.address);
                    console.log("Requested by: " + refo.owner());
                    console.log("Fufiled by: " + refo.organisation());
                    console.log("Content: " + refo.content());
                    console.log("Revoked: " + refo.isRevoked());
                    // if(refo.isRevoked()) { console.log("Revoked Status: FALSE"); }
                    // else { console.log("Revoked Status: TRUE"); }
                }
            });
            break;
            case '4':
            //attach ref
             var createquestions = [
                {
                    type: 'input',
                    name: 'from',
                    message: 'Account of Organisation '
                }, {
                    type: 'input',
                    name: 'accountpassword',
                    message: 'Password for wallet'
                }, {
                    type: 'input',
                    name: 'address',
                    message: 'Address of Membership contract to be revoked '
                }
            ];

            inquirer.prompt(createquestions).then( (answerd) => {

                //unlock account
                if(!web3.personal.unlockAccount(answerd.from, answerd.accountpassword))
                {
                    console.log("Invalid Password");
                } else {
                    //check if there is contract at address
                    if(web3.eth.getCode(answerd.address).length === 2) {
                        console.log("Invalid address");
                    } else {

                        var refo = web3.eth.contract(membership_abi.abi).at(answerd.address);
                        refo.revoke({from: answerd.from});
                        console.log("Sucessfully Revoked Membership " + answerd.address);
                    }
                }
            });
            break;
          }
        });

        break;
      case '8':

        var createquestions = "\n\
        1.\tCreate a new Reference Request \n\
        2.\tAttach a Reference to an existing request \n\
        3.\tVerify a Reference"

        inquirer.prompt([{ type: 'input', name: 'main', message: createquestions}]).then( (answerc) =>
        {
          switch(answerc.main)
          {
            case '1':
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

            inquirer.prompt(createquestions).then( (answerd) =>
            {
              //unlock account
                if(!web3.personal.unlockAccount(answerd.from, answerd.accountpassword))
                {
                    console.log("Invalid Password");
                }
                else {
                    console.log('Creating tx');
                    //create smart con
                    reference_abi.new(answerd.to, {from: answerd.from, data: refcompiled.bkReference.code, gas: 700000}, (e, contract) => {
                    if(e) {
                        console.log(e);
                    }
                    else
                    {
                        if(!contract.address)
                        {
                            console.log("Reference Contract sent, waiting to be mined");
                        } else
                        {
                            console.log("Reference Contract created at " + contract.address);

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
                    message: 'Address of Membership contract'
                }, {
                    type: 'input',
                    name: 'reference',
                    message: 'Reference Content to attach '
                }
            ];

            inquirer.prompt(createquestions).then( (answerd) => {

                //unlock account
                if(!web3.personal.unlockAccount(answerd.from, answerd.accountpassword))
                {
                    console.log("Invalid Password");
                } else {
                    //check if there is contract at address
                    if(web3.eth.getCode(answerd.address).length === 2) {
                        console.log("Invalid address");
                    } else {

                        var refo = web3.eth.contract(reference_abi.abi).at(answerd.address);

                        if(refo.organisation() != answerd.from) {
                            console.log("Contract is for different account: " + refo.organisation());
                        }
                        else
                        {
                            //add ref
                            refo.addReference(answerd.reference, {from: answerd.from});
                            console.log("Attached Reference content");
                        }
                    }
                }
            });
            break;
            case '3':
            inquirer.prompt([{type:'input',name:'address',message:'Address of Reference Contract '}]).then((answer) => {
                if(web3.eth.getCode(answer.address).length === 2) {
                    console.log("Invalid address)");
                } else {
                    var refo = web3.eth.contract(reference_abi.abi).at(answer.address);
                    console.log("Requested by: " + refo.owner());
                    console.log("Fufiled by: " + refo.organisation());
                    console.log("Reference: " + refo.reference());
                }
            });
          break;
        }
      });
      break;
      case '9':
      var createquestions =
      [
          {
              type: 'input',
              name: 'owner',
              message: 'Your account '
          }, {
              type: 'input',
              name: 'accountpassword',
              message: 'Password for wallet'
          }, {
              type: 'input',
              name: 'identity',
              message: 'Address of identity '
          }
      ];

      inquirer.prompt(createquestions).then( (answerb) =>
      {
        if(!web3.personal.unlockAccount(answerb.owner, answerb.accountpassword))
        {
            console.log("Invalid Password");
        }
        else
        {
          var refo = web3.eth.contract(identity_abi.abi).at(answerb.identity);
          if(refo.owner() != answerb.owner) { console.log("Account did not match identity."); }
          else {
                  var size = refo.getProvidersCount();
                  for(i = 0; i < size; i++)
                  {
                    var addressProvider =  refo.providers(i);
                    console.log(addressProvider);
                  }
               }
        }

      });
      break;
      case '10':
      var createquestions =
      [
          {
              type: 'input',
              name: 'owner',
              message: 'Your account '
          }, {
              type: 'input',
              name: 'accountpassword',
              message: 'Password for wallet'
          }, {
              type: 'input',
              name: 'identity',
              message: 'Address of identity '
          }
      ];

      inquirer.prompt(createquestions).then( (answerb) =>
      {
        if(!web3.personal.unlockAccount(answerb.owner, answerb.accountpassword))
        {
            console.log("Invalid Password");
        }
        else
        {
          var refo = web3.eth.contract(identity_abi.abi).at(answerb.identity);
          if(refo.owner() != answerb.owner) { console.log("Account did not match identity."); }
          else {
                  var size = refo.getVouchesCount();
                  for(i = 0; i < size; i++)
                  {
                    var addressVouch =  refo.vouches(i);
                    console.log(addressVouch);
                  }
               }
        }

      });
      break;
    }
  });
}

mainui();
