import * as dotenv from 'dotenv';
dotenv.config();

import {getDefaultProvider, Contract} from 'ethers';
import {Model, ModelCtor, Sequelize} from 'sequelize';
import * as MerkleVaultJSON from './contracts/MerkleVault.json';

import {initModels} from './models';
import {DepositModel} from './models/Deposit';
import {WalletModel} from './models/Wallet';

const provider = getDefaultProvider('http://localhost:8545/');
const contract = new Contract(
  '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  MerkleVaultJSON.abi,
  provider
);

let lastBlockNumber = 0;
let currentBlockNumber = 1;
let checking = false;

const sequelize = new Sequelize(
  `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`,
  {
    logging: false,
  }
);

export async function connect() {
  await sequelize.authenticate();
  const models = initModels(sequelize);
  await sequelize.sync();
  return models;
}

export async function checkDeposits(
  Deposit: ModelCtor<DepositModel>,
  Wallet: ModelCtor<WalletModel>,
  tokenAddress: string,
  requiredConfirmations = 15
) {
  checking = true;
  const {chainId} = await provider.getNetwork();
  currentBlockNumber = await provider.getBlockNumber();

  const lastDeposit = await Deposit.findOne({
    where: {
      cid: chainId,
      t: tokenAddress,
    },
    order: [['createdAt', 'DESC']],
  });

  if (lastDeposit) {
    lastBlockNumber = lastDeposit.blockNumber;
  }

  const confirmedHeight = currentBlockNumber - requiredConfirmations;

  if (lastBlockNumber + 1 <= confirmedHeight === false) {
    checking = false;
    return;
  }

  const balance = await contract.balance(tokenAddress);

  console.log(
    'Chain ID',
    chainId,
    'Token',
    tokenAddress,
    'Balance',
    balance,
    'Current height',
    currentBlockNumber,
    'checking',
    lastBlockNumber,
    'to',
    confirmedHeight
  );

  const filter = contract.filters.NewDeposit();
  const events = await contract.queryFilter(
    filter,
    lastBlockNumber + 1,
    confirmedHeight
  );

  if (!events.length) {
    checking = false;
    return;
  }

  try {
    await sequelize.transaction(async transaction => {
      for (let e = 0; e < events.length; e++) {
        const event = events[e];
        const clone = contract.interface.parseLog(
          JSON.parse(JSON.stringify(event))
        );
        const depositRaw = {
          cid: chainId,
          blockHash: event.blockHash,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          t: clone?.args[0],
          to: clone?.args[1],
          v: clone?.args[2],
          createdAt: new Date(),
        };
        // console.log('Creating Deposit', depositRaw);
        const deposit = await Deposit.create(depositRaw, {transaction});
        // console.log('Created deposit', deposit.toJSON());

        // console.log('Checking for wallet', {
        //   cid: chainId,
        //   t: clone?.args[0],
        //   a: clone?.args[1],
        // });

        await Wallet.findOrCreate({
          where: {cid: chainId, t: clone?.args[0], a: clone?.args[1]},
          transaction,
        });
        // console.log('Incrementing wallet...');
        const wallet = await Wallet.findOne({
          where: {cid: chainId, t: clone?.args[0], a: clone?.args[1]},
          transaction,
        });
        // console.log('Wallet', wallet?.toJSON());
        const walletUpdated = await wallet?.increment(
          {
            b: clone?.args[2],
          },
          {
            where: {
              cid: chainId,
              t: clone?.args[0],
              a: clone?.args[1],
            },
            transaction,
          }
        );

        // console.log('Deposit', deposit);
        // console.log('Wallet Updated', walletUpdated?.toJSON());
      }
    });

    lastBlockNumber = confirmedHeight;
  } catch (e) {
    console.error(e);
  }

  checking = false;
}

connect().then(models => {
  setInterval(async () => {
    if (!checking) {
      await checkDeposits(
        models.Deposit,
        models.Wallet,
        '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
      );
    }
  }, 5000);
});
