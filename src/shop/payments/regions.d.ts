import { Types } from 'mongoose';

export interface IPayment {
  _id?: Types.ObjectId;
  user?: number;
  region?: string;
  value?: number;
  creationDate?: Date;
  paymentDate?: Date;
}