import { Types } from 'mongoose';

export interface IOrder {
  orderId?: number;
  client?: number;
  item?: Types.ObjectId;
  itemTitle?: string;
  amount?: number;
  currency?: string;
  creationDate?: Date;
  completionDate?: Date;
  manager?: number;
  status?: string;
  paid?: boolean;
  platform?: string;
  game?: string;
  extra?: string;
}