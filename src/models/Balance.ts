import {Schema, model} from 'mongoose';

export interface IBalance {
  cid: string;
  a: string;
  t: string;
  b: string;
}

const schema = new Schema<IBalance>(
  {
    cid: {type: String, required: true},
    a: {type: String, required: true},
    t: {type: String, required: true},
    b: {type: String, required: true},
  },
  {_id: false, versionKey: false}
);

schema.index({cid: 1, a: 1, t: 1}, {unique: true});

export const Balance = model<IBalance>('Balance', schema);
