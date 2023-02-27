import { Types } from 'mongoose';

export default interface IRender {
  renderImage(id: Types.ObjectId): Promise<string>;
}