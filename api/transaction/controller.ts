import {Request, ResponseToolkit} from '@hapi/hapi';

import {
  recoverTypedSignature,
  SignTypedDataVersion,
} from '@metamask/eth-sig-util';
import {getAddress} from 'ethers';

import {IExtendedServerApplicationState} from '../../hapi-plugins/hapi-postgres';
import {getEIP712, ITransaction} from '../../models/Transaction';

export async function newTransaction(req: Request, h: ResponseToolkit) {
  const app = <IExtendedServerApplicationState>req.server.app;

  const {cid, f, t, n, to, v, s} = <ITransaction>req.payload;

  if (BigInt(v) <= BigInt(0)) {
    throw new Error('Cannot send zero');
  }

  const fromChksum = getAddress(f);
  const tokenChksum = getAddress(t);
  const toChksum = getAddress(to);

  try {
    const txRaw = {
      cid,
      f: fromChksum,
      t: tokenChksum,
      n,
      to: toChksum,
      v,
      s,
    };

    const data = getEIP712(txRaw);
    const recoveredAddress = recoverTypedSignature({
      data,
      signature: s,
      version: SignTypedDataVersion.V4,
    });

    // use getAddress to convert to checksum'd address
    if (getAddress(recoveredAddress) !== f) {
      throw new Error('Signature does not match sender');
    }

    const result = await app.db.transaction(async transaction => {
      let [sendingWallet, receivingWallet] = await Promise.all([
        app.db.models.Wallet.findOne({
          where: {cid, t: tokenChksum, a: fromChksum, n, b: {gte: v}},
          transaction,
        }),
        app.db.models.Wallet.findOne({
          where: {cid, t: tokenChksum, a: toChksum},
          transaction,
        }),
      ]);

      if (!sendingWallet || !receivingWallet) {
        throw new Error('Could not get wallet instances');
      }

      let tx;
      // eslint-disable-next-line prefer-const
      [sendingWallet, receivingWallet, tx] = await Promise.all([
        sendingWallet.increment(
          {
            n: 1,
            b: -v,
          },
          {transaction}
        ),
        receivingWallet.increment(
          {
            b: v,
          },
          {transaction}
        ),
        app.db.models.Transaction.create(txRaw, {transaction}),
      ]);

      return tx;
    });

    return h.response(result);
  } catch (e) {
    console.warn('Error processing transaction:', e);
    return h
      .response({
        error: e,
      })
      .code(500);
  }
}
