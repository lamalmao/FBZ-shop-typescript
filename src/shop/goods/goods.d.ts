import { Types } from 'mongoose';
import Options from './options.ts';

export default interface IItem {
  _id?: Types.ObjectId;
  category?: Types.ObjectId;
  title?: string;
  delivery?: string;
  game?: string;
  isVBucks?: boolean;
  shortDescription?: string;
  fullDescription?: string;
  creationDate?: Date;
  modificationDate?: Date;
  hidden?: boolean;
  createdBy?: number;
  image?: string;
  cover?: string;
  price?: number;
  discount?: number;
  options?: Options;
  scenario?: string;
}