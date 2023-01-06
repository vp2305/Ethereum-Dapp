import * as React from "react";
// This is the library that allows us to talk to our contract from our frontend.
import { ethers } from "ethers";
import './App.css';
import { useEffect } from "react";
import { useState } from "react";
import dotenv from "dotenv";
import abi from "./utils/WavePortal.json";

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
    console.error(error.message);
    return null;
  }
};

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [totalWaveCount, setTotalWaveCount] = useState(0);

  const contractABI = abi.abi;

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

  useEffect(() => {
    if (currentAccount) {
      const waveCount = async () => {
        const { ethereum } = window;
        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          // 0x88c8469F62b1Fa375550E1E3B1cFdE7292A49957
          const wavePortalContract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, contractABI, signer);

          let count = await wavePortalContract.getTotalWaves();
          let array = await wavePortalContract.wave_results;
          console.log("Array: ", array);
          setTotalWaveCount(count.toNumber());
        }
      }
      waveCount().catch(console.error);
    }
  }, [contractABI, currentAccount])

  /*
   * This function will allow us to connect to the user's wallet!
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
      console.error(error.message);
    }
  }

  /*
  * Description: This function is used to make a transaction onto the blockchain.
  * Blockchain address: 0x88c8469F62b1Fa375550E1E3B1cFdE7292A49957
  * */
  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Total number of waves: ", count.toNumber());

        // Execute the actual waves from your smart contract.
        const waveTxt = await wavePortalContract.wave();
        console.log("Mining...:", waveTxt.hash);

        await waveTxt.wait();
        console.log("Mined -- ", waveTxt.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        setTotalWaveCount(count);
      }
      else {
        console.log("Ethereum object doesn't exist!");
      }

    } catch (error) {
      console.error(error.message);
    }
  }

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          👋 Hey there!
        </div>

        <div className="bio">
          I am Vaibhav, and I am real life humanoid 😁. Thats pretty cool right? Connect your Ethereum wallet and wave at me!
        </div>

        {!currentAccount ? (
          <button className="waveButton connectWallet" onClick={connectWallet}>
            Connect Wallet
          </button>
        ) : (
          <div className="wavesContainer">
            <h3>Total # of Waves: {totalWaveCount}</h3>
            <button className="waveButton" onClick={wave}>
              Wave at Me
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;