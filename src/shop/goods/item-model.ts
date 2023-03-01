import { Schema, model, Types } from 'mongoose';
import IItem from './goods.d.js';
import { DELIVERY_TYPES } from './goods.js';
import { GAMES } from '../../games.js';
import IOptions from './options.js';

export const ITEM_IMAGE_BLANK = 'item_image_blank.jpg';
export const ITEM_COVER_BLANK = 'item_cover_blank.jpg';

const itemSchema = new Schema<IItem> ({
  category: {
    type: Types.ObjectId,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  delivery: {
    type: String,
    required: true,
    enum: Object.values(DELIVERY_TYPES)
  },
  game: {
    type: String,
    required: true,
    enum: Object.values(GAMES)
  },
  shortDescription: {
    type: String,
    required: true,
    default: '-'
  },
  fullDescription: {
    type: String,
    required: true,
    default: '-'
  },
  creationDate: {
    type: Date,
    required: true,
    default: new Date()
  },
  modificationDate: {
    type: Date,
    required: false,
    default: new Date()
  },
  hidden: {
    type: Boolean,
    required: true,
    default: false
  },
  createdBy: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    required: true,
    default: ITEM_IMAGE_BLANK
  },
  cover: {
    type: String,
    required: true,
    default: ITEM_COVER_BLANK
  },
  price: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100
  },
  options: {
    type: Array<IOptions>,
    required: false
  }
});

export const itemModel = model('goods', itemSchema);