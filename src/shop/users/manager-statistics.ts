import { Types, Document } from 'mongoose';

export class ManagerStatisticsField extends Document {
  public itemId: Types.ObjectId;
  public itemTitle: string;
  public sellsPerPeriod: number;

  public constructor (itemId: string | Types.ObjectId, itemTitle: string) {
    super();
    this.itemId = typeof itemId === 'string' ? new Types.ObjectId(itemId) : itemId;
    this.itemTitle = itemTitle;
    this.sellsPerPeriod = 0;
  }
}