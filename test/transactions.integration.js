/* eslint-disable node/no-unpublished-require */
'use strict';

const Lab = require('@hapi/lab');
const {expect} = require('@hapi/code');
const {after, before, describe, it} = (exports.lab = Lab.script());
const {service, init, stop} = require('../build/service');
const {Sequelize} = require('sequelize');
const {initModels} = require('../build/models');

const ethers = require('ethers');
const MerkleVaultJSON = require('../contracts/MerkleVault.json');
const TestCoinJSON = require('../contracts/TestCoin.json');

const provider = ethers.getDefaultProvider('http://localhost:8545/');

const depositMonitor = require('../build/deposit-monitor');

const merkleVaultAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const testCoinAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

const keys = {
  owner: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  proposer:
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  validator:
    '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  user1: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
  user2: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
  user3: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
  user4: '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
  user5: '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356',
  user6: '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97',
};

function getEIP712(doc) {
  const types = {
    Transfer: [
      {name: 'token', type: 'string'},
      {name: 'nonce', type: 'string'},
      {name: 'to', type: 'string'},
      {name: 'value', type: 'string'},
    ],
  };

  return {
    domain: {
      name: 'test.com',
      version: '1',
      chainId: doc.cid,
    },
    types,
    primaryType: 'Transfer',
    message: {
      token: doc.token,
      nonce: doc.nonce,
      to: doc.to,
      value: doc.val,
    },
  };
}
describe('API', () => {
  before(async () => {
    //wait for hardhat node to start
    await new Promise(resolve => {
      setTimeout(resolve, 1 * 1000);
    });
    const owner = new ethers.Wallet(keys.owner, provider);
    const merkleVaultFactory = new ethers.ContractFactory(
      MerkleVaultJSON.abi,
      MerkleVaultJSON.bytecode,
      owner
    );
    await merkleVaultFactory.deploy(
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
    );
    await new Promise(resolve => {
      setTimeout(resolve, 0.2 * 1000);
    });
    const testCoinFactory = new ethers.ContractFactory(
      TestCoinJSON.abi,
      TestCoinJSON.bytecode,
      owner
    );
    await testCoinFactory.deploy();

    await new Promise(resolve => {
      setTimeout(resolve, 0.2 * 1000);
    });

    const merkleVault = new ethers.Contract(
      '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      MerkleVaultJSON.abi,
      owner
    );

    const testCoin = new ethers.Contract(
      testCoinAddress,
      TestCoinJSON.abi,
      owner
    );

    await merkleVault.setAllowedToken(testCoinAddress, 1);

    await new Promise(resolve => {
      setTimeout(resolve, 0.2 * 1000);
    });

    const user1 = new ethers.Wallet(keys.user1, provider);
    const user2 = new ethers.Wallet(keys.user2, provider);
    const user3 = new ethers.Wallet(keys.user3, provider);
    const user4 = new ethers.Wallet(keys.user4, provider);
    const user5 = new ethers.Wallet(keys.user5, provider);

    const users = [user1, user2, user3, user4, user5];

    for (let i = 0; i < users.length; i++) {
      await new Promise(resolve => {
        setTimeout(() => {
          testCoin.mint(users[i].address, 1 * 1e8).then(resolve);
        }, 0.2 * 1000);
      });
    }

    for (let i = 0; i < users.length; i++) {
      await new Promise(resolve => {
        setTimeout(() => {
          testCoin
            .connect(users[i])
            .approve(merkleVaultAddress, 1 * 1e8)
            .then(resolve);
        }, 0.2 * 1000);
      });
    }

    for (let i = 0; i < users.length; i++) {
      await new Promise(resolve => {
        setTimeout(() => {
          merkleVault
            .connect(users[i])
            .depositToken(testCoinAddress, 1 * 1e8)
            .then(resolve);
        }, 0.2 * 1000);
      });
    }

    const models = await depositMonitor.connect();
    await depositMonitor.checkDeposits(
      models.Deposit,
      models.Wallet,
      testCoinAddress,
      0
    );

    await init();
  });

  after(async () => {
    const sequelize = new Sequelize(
      `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`,
      {
        logging: false,
      }
    );
    initModels(sequelize);
    await sequelize.sync({force: true});

    await stop();
  });

  describe('GET /api/wallet/{chainId}/{tokenAddress}/{walletAddress}', () => {
    it('should provide nonce and balance', async () => {
      const user1 = new ethers.Wallet(keys.user1, provider);

      console.log(
        'GET',
        `/api/wallet/31337/${testCoinAddress}/${user1.address}`
      );
      const bres = await service.inject({
        method: 'get',
        url: `/api/wallet/31337/${testCoinAddress}/${user1.address}`,
      });
      console.log(bres.payload);

      expect(bres.statusCode).to.equal(200);
    });
  });

  describe('POST /api/transactions', () => {
    it('should reject unsigned transfers', async () => {
      const user1 = new ethers.Wallet(keys.user1, provider);
      const user2 = new ethers.Wallet(keys.user2, provider);

      const payload = {
        cid: `0x${(31337).toString(16)}`,
        type: 't',
        from: user1.address,
        token: testCoinAddress,
        nonce: `0x${(0).toString(16)}`,
        to: user2.address,
        val: `0x${(1).toString(16)}`,
        sig: '',
      };

      const res = await service.inject({
        method: 'post',
        url: '/api/transaction',
        payload,
      });
      expect(res.statusCode).to.equal(400);
    });

    it('should accept signed transfers', async () => {
      const user1 = new ethers.Wallet(keys.user1, provider);
      const user2 = new ethers.Wallet(keys.user2, provider);

      const payload = {
        cid: `0x${(31337).toString(16)}`,
        type: 't',
        from: user1.address,
        token: testCoinAddress,
        nonce: `0x${(0).toString(16)}`,
        to: user2.address,
        val: `0x${(1).toString(16)}`,
      };

      const eip712 = getEIP712(payload);

      const signature = await user1.signTypedData(
        eip712.domain,
        eip712.types,
        eip712.message
      );
      payload.sig = signature;

      const res = await service.inject({
        method: 'POST',
        url: '/api/transaction',
        payload,
      });
      expect(res.statusCode).to.equal(200);
    });

    it('should not accept signed transfers exceeding balance', async () => {
      const user1 = new ethers.Wallet(keys.user1, provider);
      const user2 = new ethers.Wallet(keys.user2, provider);

      const payload = {
        cid: `0x${(31337).toString(16)}`,
        type: 't',
        from: user1.address,
        token: testCoinAddress,
        nonce: `0x${(1).toString(16)}`,
        to: user2.address,
        val: `0x${(1e8).toString(16)}`,
      };

      const eip712 = getEIP712(payload);

      const signature = await user1.signTypedData(
        eip712.domain,
        eip712.types,
        eip712.message
      );
      payload.sig = signature;

      const res = await service.inject({
        method: 'POST',
        url: '/api/transaction',
        payload,
      });
      expect(res.statusCode).to.equal(500);
    });

    it('should accept signed transfers to unknown address', async () => {
      const user1 = new ethers.Wallet(keys.user1, provider);
      const user6 = new ethers.Wallet(keys.user6, provider);

      const payload = {
        cid: `0x${(31337).toString(16)}`,
        type: 't',
        from: user1.address,
        token: testCoinAddress,
        nonce: `0x${(1).toString(16)}`,
        to: user6.address,
        val: `0x${(1).toString(16)}`,
      };

      const eip712 = getEIP712(payload);

      const signature = await user1.signTypedData(
        eip712.domain,
        eip712.types,
        eip712.message
      );
      payload.sig = signature;

      const res = await service.inject({
        method: 'POST',
        url: '/api/transaction',
        payload,
      });
      expect(res.statusCode).to.equal(200);
    });

    it('should accept 100 signed transfers', async () => {
      const user1 = new ethers.Wallet(keys.user1, provider);
      const user2 = new ethers.Wallet(keys.user2, provider);

      for (let i = 2; i < 102; i++) {
        const payload = {
          cid: `0x${(31337).toString(16)}`,
          type: 't',
          from: user1.address,
          token: testCoinAddress,
          nonce: `0x${i.toString(16)}`,
          to: user2.address,
          val: `0x${(1).toString(16)}`,
        };

        const eip712 = getEIP712(payload);

        const signature = await user1.signTypedData(
          eip712.domain,
          eip712.types,
          eip712.message
        );
        payload.sig = signature;

        const res = await service.inject({
          method: 'POST',
          url: '/api/transaction',
          payload,
        });
        expect(res.statusCode).to.equal(200);
      }
    });
  });
});
