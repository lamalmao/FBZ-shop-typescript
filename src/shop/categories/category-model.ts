import { Model, Schema, model } from 'mongoose';
import { IGoodsCategory } from './category.d.js';
import { CATEGORY_TYPES } from './category.js';
import { Cover } from '../cover.js';

export const CATEGORY_IMAGE_BLANK = 'category_blank.jpg';

const categorySchema = new Schema<IGoodsCategory> ({
  type: {
    type: String,
    required: true,
    enum: Object.values(CATEGORY_TYPES)
  },
  name: {
    type: String,
    required: true
  },
  createdBy: {
    type: Number,
    required: true
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
  image: {
    type: String,
    required: true,
    default: CATEGORY_IMAGE_BLANK
  },
  covers: {
    type: Cover,
    required: false
  },
  hidden: {
    type: Boolean,
    required: true,
    default: false
  }
});

export const categoryModel: Model<IGoodsCategory> = model('categories', categorySchema);