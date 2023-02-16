import {getAddress, isAddress} from 'ethers';
import {
  DataTypes,
  Sequelize,
  Model,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

export interface WalletModel
  extends Model<
    InferAttributes<WalletModel>,
    InferCreationAttributes<WalletModel>
  > {
  cid: bigint;
  t: string;
  a: string;
  n: bigint;
  b: bigint;
}

export const createWalletModel = function (sequelize: Sequelize) {
  const WalletModel = sequelize.define<WalletModel>(
    'Wallet',
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
      a: {
        type: DataTypes.STRING(42),
        allowNull: false,
        primaryKey: true,
        validate: {
          isAddress,
        },
        set(value: string) {
          this.setDataValue('a', getAddress(value));
        },
      },
      n: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      b: {type: DataTypes.DECIMAL(80, 0), allowNull: false, defaultValue: 0},
    },
    {}
  );
  return WalletModel;
};
