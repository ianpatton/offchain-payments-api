import {Request, ResponseToolkit} from '@hapi/hapi';
import {IPayment, Payment, getEIP712} from '../../models/Payment';
import {Nonce} from '../../models/Nonce';
import {Balance} from '../../models/Balance';
import {
  recoverTypedSignature,
  SignTypedDataVersion,
} from '@metamask/eth-sig-util';
import {getAddress} from 'ethers';
import mongoose from 'mongoose';

export async function newPayment(req: Request, h: ResponseToolkit) {
  const {
    cid,
    ts = new Date(),
    type,
    from,
    token,
    nonce,
    to,
    val,
    sig,
  } = <IPayment>req.payload;

  const fromChksum = getAddress(from);
  const tokenChksum = getAddress(token);
  const toChksum = getAddress(to);

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const nonceDoc = await Nonce.findOneAndUpdate(
      {cid, a: fromChksum},
      {$inc: {n: 1}},
      {new: true, upsert: true, session}
    );

    if (BigInt(nonceDoc.n) !== BigInt(nonce)) {
      throw new Error('Invalid nonce');
    }

    const sendingBalanceDoc = await Balance.findOne({
      cid,
      a: fromChksum,
      t: token,
    });
    let sendingBalance = BigInt(0);
    if (sendingBalanceDoc) {
      sendingBalance = BigInt(sendingBalanceDoc.b);
    }

    if (sendingBalance < BigInt(val)) {
      throw new Error('Insufficient balance');
    }

    const newSendingBalance = (sendingBalance - BigInt(val)).toString(16);

    const updatedSendingBalance = await Balance.findOneAndUpdate(
      {
        cid,
        a: fromChksum,
        t: token,
        b: `0x${sendingBalance.toString(16)}`,
      },
      {
        $set: {
          b: `0x${newSendingBalance}`,
        },
      },
      {
        new: true,
        upsert: false,
        session,
      }
    );

    if (!updatedSendingBalance) {
      throw new Error('Could not update sender balance');
    }

    let receiverBalance = BigInt(0);
    const receiverBalanceDoc = await Balance.findOne({
      cid,
      a: toChksum,
      t: token,
    });

    if (receiverBalanceDoc) {
      receiverBalance = BigInt(receiverBalanceDoc.b);
    }

    const updateReceivingBalance = await Balance.findOneAndUpdate(
      {
        cid,
        a: toChksum,
        t: token,
        b: `0x${newSendingBalance}`,
      },
      {
        set: {
          b: `0x${(receiverBalance + BigInt(val)).toString(16)}`,
        },
      },
      {
        new: true,
        upsert: true,
        session,
      }
    );

    if (!updateReceivingBalance) {
      throw new Error('Could not update receiver balance');
    }

    const payment = new Payment({
      cid,
      ts,
      type,
      from: fromChksum,
      token: tokenChksum,
      nonce,
      to: toChksum,
      val,
      sig,
    });

    const data = getEIP712(payment);

    const recoveredAddress = recoverTypedSignature({
      data,
      signature: sig,
      version: SignTypedDataVersion.V4,
    });

    // use getAddress to convert to checksum'd address
    if (getAddress(recoveredAddress) !== from) {
      throw new Error('Signature does not match sender');
    }

    await payment.save({session});

    await session.commitTransaction();
    await session.endSession();

    return h.response(payment);
  } catch (e) {
    if (session) {
      await session.abortTransaction();
      await session.endSession();
    }
    return h
      .response({
        error: e,
      })
      .code(500);
  }
}
