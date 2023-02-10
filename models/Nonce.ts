import {Schema, model} from 'mongoose';

export interface INonce {
  cid: number;
  a: string;
  n: number;
}

const schema = new Schema<INonce>(
  {
    cid: {type: Number, required: true},
    a: {type: String, required: true},
    n: {type: Number, required: true, default: 0},
  },
  {_id: false, versionKey: false}
);

schema.index({cid: 1, a: 1}, {unique: true});

export const Nonce = model<INonce>('Nonce', schema);
