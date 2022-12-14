import { ethers } from 'hardhat';

import { CRYPTO_DEVS_NFT_CONTRACT_ADDRESS } from '../constants';

require('dotenv').config({ path: '.env' });

async function main() {
  const cryptoDevsNFTContract = CRYPTO_DEVS_NFT_CONTRACT_ADDRESS;

  const cryptoDevsTokenContract = await ethers.getContractFactory(
    'CryptoDevToken'
  );

  const deployedCryptoDevsTokenContract = await cryptoDevsTokenContract.deploy(
    cryptoDevsNFTContract
  );

  await deployedCryptoDevsTokenContract.deployed();

  console.log(
    'Crypto Devs Token Contract Address:',
    deployedCryptoDevsTokenContract.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
