/* eslint-disable @next/next/no-img-element */
import { BigNumber, Contract, providers, utils } from 'ethers';
import Head from 'next/head';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Web3Modal from 'web3modal';
import { toast } from 'react-toastify';

import styles from '../styles/Home.module.css';
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from '../constants';

const Home = () => {
  const zero = BigNumber.from(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] =
    useState(zero);
  const [tokenAmount, setTokenAmount] = useState(zero);
  const [tokensMinted, setTokensMinted] = useState(zero);
  const [isOwner, setIsOwner] = useState(false);

  const web3ModalRef = useRef<Web3Modal | null>(null);

  const getProviderOrSigner = async (needSigner = false) => {
    try {
      const provider = await web3ModalRef.current?.connect();
      const web3Provider = new providers.Web3Provider(provider);

      const { chainId } = await web3Provider.getNetwork();

      if (chainId !== 5) {
        throw new Error('Please change the network to Goerli');
      }

      if (needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      }

      return web3Provider;
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const getOwner = useCallback(async () => {
    try {
      const provider = await getProviderOrSigner();

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const _owner = await tokenContract.owner();
      const signer = (await getProviderOrSigner(true)) as any;
      const address = await signer.getAddress();

      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  }, []);

  const getTotalTokensMinted = useCallback(async () => {
    try {
      const provider = await getProviderOrSigner();

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const mintedTokens = await tokenContract.totalSupply();
      setTokensMinted(mintedTokens);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  }, []);
  const getBalanceOfCryptoDevTokens = useCallback(async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const signer = (await getProviderOrSigner(true)) as any;
      const address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(address);

      //* balance is already a big number, so we dont need to convert it before setting it
      setBalanceOfCryptoDevTokens(balance);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  }, []);
  const getTokensToBeClaimed = useCallback(async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const signer = (await getProviderOrSigner(true)) as any;
      const address = await signer.getAddress();
      const balance = await nftContract.balanceOf(address);

      if (balance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        let amount = 0;

        /* 
          For all the NFT's, check if the tokens have already been claimed, then only increase the amount of
          the tokens
        */
        for (let i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.claimedTokenIds(tokenId);
          if (!claimed) amount += 1;
        }

        setTokensToBeClaimed(BigNumber.from(amount));
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
      setTokensToBeClaimed(zero);
    }
  }, [zero]);
  const withdrawCoins = useCallback(async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const tx = await tokenContract.withdraw();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getOwner();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  }, [getOwner]);
  const connectWallet = useCallback(async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  }, []);
  const mintCryptoDevToken = useCallback(
    async (amount: BigNumber) => {
      try {
        const signer = await getProviderOrSigner(true);
        const tokenContract = new Contract(
          TOKEN_CONTRACT_ADDRESS,
          TOKEN_CONTRACT_ABI,
          signer
        );
        const value = amount.mul(0.001);

        const tx = await tokenContract.mint(amount, {
          value: utils.parseEther(value.toString()),
        });
        setLoading(true);
        await tx.wait();
        setLoading(false);
        toast.success('Sucessfully minted Crypto Dev Tokens');

        await getBalanceOfCryptoDevTokens();
        await getTotalTokensMinted();
        await getTokensToBeClaimed();
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        }
      }
    },
    [getBalanceOfCryptoDevTokens, getTotalTokensMinted, getTokensToBeClaimed]
  );
  const claimCryptoDevTokens = useCallback(async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const tx = tokenContract.claim();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      toast.success('Sucessfully claimed Crypto Dev Tokens');

      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  }, [getBalanceOfCryptoDevTokens, getTotalTokensMinted, getTokensToBeClaimed]);

  const startApp = useCallback(() => {
    connectWallet();
    getTotalTokensMinted();
    getBalanceOfCryptoDevTokens();
    getTokensToBeClaimed();
    withdrawCoins();
  }, [
    connectWallet,
    getTotalTokensMinted,
    getBalanceOfCryptoDevTokens,
    getTokensToBeClaimed,
    withdrawCoins,
  ]);

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: 'goerli',
        providerOptions: {},
        disableInjectedProvider: false,
      });

      startApp();
    }
  }, [walletConnected, startApp]);

  const renderButton = () => {
    // If we are currently waiting for something, return a loading button
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }
    // if owner is connected, withdrawCoins() is called
    if (walletConnected && isOwner) {
      return (
        <div>
          <button className={styles.button1} onClick={withdrawCoins}>
            Withdraw Coins
          </button>
        </div>
      );
    }
    // If tokens to be claimed are greater than 0, Return a claim button
    if (tokensToBeClaimed.gt(0)) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed.mul(10).toString()} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }
    // If user doesn't have any tokens to claim, show the mint button
    return (
      <div style={{ display: 'flex-col' }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from converts the `e.target.value` to a BigNumber
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>

        <button
          className={styles.button}
          disabled={!tokenAmount.gt(0)}
          onClick={() => mintCryptoDevToken(tokenAmount)}
        >
          Mint Tokens
        </button>
      </div>
    );
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
          <div className={styles.description}>
            You can claim or mint Crypto Dev tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have minted {utils.formatEther(balanceOfCryptoDevTokens)}{' '}
                Crypto Dev Tokens
              </div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall {utils.formatEther(tokensMinted)}/10000 have been
                minted!!!
              </div>
              {renderButton()}
            </div>
          ) : (
            <button className={styles.button}>Connect your wallet</button>
          )}
        </div>
        <div>
          <img
            className={styles.image}
            src="https://raw.githubusercontent.com/ruhankhandakar/NFT-Collection-LW3-FE/main/public/cryptodevs/0.svg"
            alt="svg icon"
          />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
};

export default Home;
