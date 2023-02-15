import {
  DataTypes,
  Sequelize,
  Model,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import {getAddress, isAddress, isHexString} from 'ethers';

export interface DepositModel
  extends Model<
    InferAttributes<DepositModel>,
    InferCreationAttributes<DepositModel>
  > {
  cid: bigint;
  blockHash: string;
  blockNumber: number;
  transactionHash: string;
  t: string;
  to: string;
  v: bigint;
}

export const createDepositModel = function (sequelize: Sequelize) {
  const DepositModel = sequelize.define<DepositModel>(
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
      blockNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
  return DepositModel;
};
