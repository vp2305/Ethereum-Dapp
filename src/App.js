import * as React from "react";
import { ethers } from "ethers";
import './App.css';
import { useEffect } from "react";
import { useState } from "react";

const getEthereumObject = () => window.ethereum;

/*
 * This function returns the first linked account found.
 * If there is no account linked, it will return null.
 */
const findMetaMaskAccount = async () => {
  try {
    const ethereum = getEthereumObject();

    if (!ethereum) {
      console.log("Make sure to have metamask installed!");
      return null;
    }
    console.log("Ethereum object: ", ethereum);

    // Checking to see if the user has an ethereum account using special method called "eth_accounts" 
    const accounts = await ethereum.request({ method: "eth_accounts" });
    console.log("List of all accounts: ", accounts);

    // User can have multiple accounts in their wallet so in that case we will be picking the first one.
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account: ", account);
      return account;
    } else {
      console.log("No authorized account found.");
      return null;
    }

  } catch (error) {
    console.error(error);
    return null;
  }
};

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");

  /*
   * The passed callback function will be run when the page loads.
   * More technically, when the App component "mounts".
   */
  useEffect(() => {
    findMetaMaskAccount().then((account) => {
      if (account !== null) {
        setCurrentAccount(account);
      }
    });
  }, []);

  /*
   * This function will allow us to connect to the user's wallet.
   */
  const connectWallet = async () => {
    try {
      const ethereum = getEthereumObject();
      if (!ethereum) {
        console.log("Please download MetaMask!");
        return;
      }

      const account = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected with the account: ", account[0]);
      setCurrentAccount(account[0])
    } catch (error) {
      console.error(error);
    }
  }

  const wave = () => {

  }

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          👋 Hey there!
        </div>

        <div className="bio">
          I am Vaibhav, and I am a simple individual. Thats pretty cool right? Connect your Ethereum wallet and wave at me!
        </div>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
}

export default App;