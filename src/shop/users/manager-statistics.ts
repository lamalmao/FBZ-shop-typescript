import { Types } from 'mongoose';

export interface IManagerStatisticsField {
  itemId: Types.ObjectId;
  itemTitle: string;
  sellsPerPeriod: number;
}