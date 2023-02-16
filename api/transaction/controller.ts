import {Request, ResponseToolkit} from '@hapi/hapi';
import {Op, literal} from 'sequelize';

import {
  recoverTypedSignature,
  SignTypedDataVersion,
} from '@metamask/eth-sig-util';
import {getAddress} from 'ethers';

import {IExtendedServerApplicationState} from '../../hapi-plugins/hapi-postgres';
import {getEIP712} from '../../models/Transaction';

export interface TransactionPayload {
  cid: number; //chainId
  type: string;
  token: string; // token
  from: string; // from
  nonce: string; // nonce
  to: string; //  to
  val: string; //value transferred
  sig: string; //signature
}

export async function newTransaction(req: Request, h: ResponseToolkit) {
  const app = <IExtendedServerApplicationState>req.server.app;

  const {cid, type, from, token, nonce, to, val, sig} = <TransactionPayload>(
    req.payload
  );

  if (BigInt(val) <= BigInt(0)) {
    throw new Error('Cannot send zero');
  }

  const fromChksum = getAddress(from);
  const tokenChksum = getAddress(token);
  const toChksum = getAddress(to);

  try {
    const txRaw = {
      cid,
      type,
      f: fromChksum,
      t: tokenChksum,
      n: nonce,
      to: toChksum,
      v: val,
      s: sig,
    };

    const eip712 = getEIP712(txRaw);
    const recoveredAddress = recoverTypedSignature({
      data: eip712,
      signature: sig,
      version: SignTypedDataVersion.V4,
    });

    // use getAddress to convert to checksum'd address
    if (getAddress(recoveredAddress) !== from) {
      throw new Error('Signature does not match sender');
    }

    const result = await app.db.transaction(async transaction => {
      const [sendingWallet, receivingWallet] = await Promise.all([
        app.db.models.Wallet.findOne({
          where: {
            cid: BigInt(cid),
            t: tokenChksum,
            a: fromChksum,
            n: BigInt(nonce),
            b: {[Op.gte]: BigInt(val)},
          },
          transaction,
        }),
        app.db.models.Wallet.findOne({
          where: {cid: BigInt(cid), t: tokenChksum, a: toChksum},
          transaction,
        }),
      ]);

      if (!sendingWallet || !receivingWallet) {
        throw new Error('Could not get wallet instances');
      }

      console.log('Sending Wallet', sendingWallet.toJSON());
      console.log('Receiving Wallet', receivingWallet.toJSON());

      const [sender, receiver, tx] = await Promise.all([
        app.db.models.Wallet.update(
          {
            n: literal('n + 1'),
            b: literal(`b - ${BigInt(val)}`),
          },
          {
            where: {
              cid: BigInt(cid),
              t: tokenChksum,
              a: fromChksum,
              n: BigInt(nonce),
              b: {[Op.gte]: BigInt(val)},
            },
            transaction,
          }
        ),
        app.db.models.Wallet.update(
          {b: literal(`b + ${BigInt(val)}`)},
          {
            where: {
              cid: BigInt(cid),
              t: tokenChksum,
              a: toChksum,
            },
            transaction,
          }
        ),
        app.db.models.Transaction.create(
          {
            cid: BigInt(txRaw.cid),
            type,
            f: fromChksum,
            t: tokenChksum,
            n: BigInt(nonce),
            to: toChksum,
            v: BigInt(val),
            s: sig,
          },
          {transaction}
        ),
      ]);

      console.log('Updated sender', sender);
      console.log('Updated receiver', receiver);

      return {sender, receiver, tx};
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
