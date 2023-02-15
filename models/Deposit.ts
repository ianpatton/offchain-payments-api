import {DataTypes, Sequelize} from 'sequelize';
import {getAddress, isAddress, isHexString} from 'ethers';

export const createDepositModel = function (sequelize: Sequelize) {
  const Deposit = sequelize.define(
    'Deposit',
    {
      cid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      blockHash: {
        type: DataTypes.STRING(66),
        allowNull: false,
        primaryKey: true,
        validate: {
          isHexString: (x: string) => isHexString(x),
        },
      },
      transactionHash: {
        type: DataTypes.STRING(66),
        allowNull: false,
        primaryKey: true,
        validate: {
          isHexString: (x: string) => isHexString(x),
        },
      },
      t: {
        type: DataTypes.STRING(42),
        allowNull: false,
        primaryKey: true,
        validate: {
          isAddress,
        },
        set(value: string) {
          this.setDataValue('t', getAddress(value));
        },
      },
      to: {
        type: DataTypes.STRING(42),
        allowNull: false,
        primaryKey: true,
        validate: {
          isAddress,
        },
        set(value: string) {
          this.setDataValue('to', getAddress(value));
        },
      },
      v: {
        type: DataTypes.DECIMAL(80, 0),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      updatedAt: false,
    }
  );
  return Deposit;
};
