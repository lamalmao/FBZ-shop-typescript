import { Types, Document } from 'mongoose';
export class ManagerStatisticsField extends Document {
    constructor(itemId, itemTitle) {
        super();
        this.itemId = typeof itemId === 'string' ? new Types.ObjectId(itemId) : itemId;
        this.itemTitle = itemTitle;
        this.sellsPerPeriod = 0;
    }
}
