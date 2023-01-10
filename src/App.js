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
  const [allWaves, setAllWaves] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [generateButtonText, setGenerateButtonText] = useState("Wave at me!");

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
    checkIfWalletIsConnected();
  }, []);


  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (ethereum) {
      console.log("We have the ethereum object", ethereum);
      await getAllWaves();
    } else {
      console.log("Make sure you have MetaMask installed!");
      return;
    }
  }

  /*
   * Here we are listening for the NewWave 
  * */
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);


  // useEffect(() => {
  //   if (currentAccount) {
  //     const waveCount = async () => {
  //       const { ethereum } = window;
  //       if (ethereum) {
  //         const provider = new ethers.providers.Web3Provider(ethereum);
  //         const signer = provider.getSigner();
  //         // 0x96eae7C84270217a8348f6FEbf1B8d438D4DB61F
  //         const wavePortalContract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, contractABI, signer);

  //         let count = await wavePortalContract.getTotalWaves();
  //         let array = await wavePortalContract.wave_results;
  //         console.log("Array: ", array);
  //         setTotalWaveCount(count.toNumber());
  //       }
  //     }
  //     waveCount().catch(console.error);
  //   }
  // }, [contractABI, currentAccount])

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
  * Blockchain address: 0xBb632C19840F8625677f7c94eD685a4eC1fD723A
  * */
  const wave = async () => {
    console.log("Trying to wave!");
    if (message !== "") {
      try {
        setGenerating(true);
        setGenerateButtonText("Generating...")

        const { ethereum } = window;

        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const wavePortalContract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, contractABI, signer);

          let count = await wavePortalContract.getTotalWaves();
          console.log("Total number of waves: ", count.toNumber());

          // Execute the actual waves from your smart contract.
          const waveTxt = await wavePortalContract.wave(message, { gasLimit: 300000 });
          console.log("Mining...:", waveTxt.hash);

          await waveTxt.wait();
          console.log("Mined -- ", waveTxt.hash);

          count = await wavePortalContract.getTotalWaves();
          console.log("Retrieved total wave count...", count.toNumber());

          setMessage("");
          setTotalWaveCount(count.toNumber());
          // getAllWaves();
        }
        else {
          console.log("Ethereum object doesn't exist!");
        }

        setGenerating(false);
        setGenerateButtonText("Wave at me!")
      } catch (error) {
        console.error(error.message);
        setGenerateButtonText("Encountered an error!")
      }
    } else {
      setGenerating(true);
      setGenerateButtonText("Please provide a message!")
    }

  }

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {

        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, contractABI, signer);

        const totalWaveCount = await wavePortalContract.getTotalWaves();
        setTotalWaveCount(totalWaveCount.toNumber());

        const waves = await wavePortalContract.getAllWaves();
        let waveCleaned = waves.map(element => {
          return {
            address: element.waver,
            timestamp: new Date(element.timestamp * 1000),
            message: element.message
          }
        });

        setAllWaves(waveCleaned);
      }
      else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.error(error.message);
    }
  }

  const messageUpdated = (event) => {
    if (generating && message !== "") {
      setGenerating(false);
      setGenerateButtonText("Wave at me!");
    }

    setMessage(event.target.value);
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

            <textarea className="prompt-box" placeholder="Your message..." value={message} onChange={messageUpdated} />

            <button className={generating ? "waveButton generating" : "waveButton"} onClick={wave} disabled={generating}>
              {generateButtonText}
            </button>
          </div>
        )}

        <h1 id="allWaveTitle">History:</h1>
        {allWaves.map((wave, index) => {
          return (
            <div key={index} className="allWaves">
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}

export default App;