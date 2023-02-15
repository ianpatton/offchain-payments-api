import {createWalletModel} from './Wallet';
import {createTransactionModel} from './Transaction';
import {createDepositModel} from './Deposit';

import {Sequelize} from 'sequelize';

export function initModels(sequelize: Sequelize) {
  const Wallet = createWalletModel(sequelize);
  const Transaction = createTransactionModel(sequelize);
  const Deposit = createDepositModel(sequelize);

  return {
    Wallet,
    Transaction,
    Deposit,
  };
}
