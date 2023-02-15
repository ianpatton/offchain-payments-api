import {getAddress, isAddress} from 'ethers';
import {
  DataTypes,
  Sequelize,
  Model,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

export interface ITransaction {
  cid: number; //chainId
  t: string; // token
  f: string; // from
  n: string; // nonce
  to: string; //  to
  v: string; //value transferred
  s: string; //signature
}

export interface TransactionModel
  extends Model<
    InferAttributes<TransactionModel>,
    InferCreationAttributes<TransactionModel>
  > {
  cid: bigint; //chainId
  t: string; // token
  f: string; // from
  n: bigint; // nonce
  to: string; //  to
  v: bigint; //value transferred
  s: string; //signature
}

export function getEIP712(doc: ITransaction) {
  const types = {
    EIP712Domain: [
      {name: 'name', type: 'string'},
      {name: 'version', type: 'string'},
      {name: 'chainId', type: 'uint256'},
      {name: 'salt', type: 'bytes32'},
    ],
    Transfer: [
      {name: 'token', type: 'string'},
      {name: 'to', type: 'string'},
      {name: 'value', type: 'string'},
    ],
  };

  return {
    domain: {
      name: `${process.env.EIP_DOMAIN}`,
      version: '1',
      chainId: doc.cid,
      salt: Buffer.from(doc.n),
    },
    types,
    primaryType: <'Transfer' | 'EIP712Domain'>'Transfer',
    message: {
      token: doc.t,
      to: doc.to,
      value: doc.v,
    },
  };
}

export const createTransactionModel = function (sequelize: Sequelize) {
  const TransactionModel = sequelize.define<TransactionModel>(
    'Transaction',
    {
      // Model attributes are defined here
      cid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
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
      f: {
        type: DataTypes.STRING(42),
        allowNull: false,
        primaryKey: true,
        validate: {
          isAddress,
        },
        set(value: string) {
          this.setDataValue('f', getAddress(value));
        },
      },
      n: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      to: {
        type: DataTypes.STRING(42),
        allowNull: false,
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
      },
      s: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      updatedAt: false,
    }
  );
  return TransactionModel;
};
