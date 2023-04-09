import { Schema, Types, model } from 'mongoose';
import { IOrder } from './orders.d.js';
import { REGIONS } from '../users/user-model.js';
import { PLATFORMS, STATUSES } from './orders.js';

const orderSchema = new Schema<IOrder>({
  orderId: {
    type: Number,
    required: true,
    unique: true
  },
  client: {
    type: Number,
    required: true
  },
  item: {
    type: Types.ObjectId,
    required: true
  },
  itemTitle: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    enum: Object.values(REGIONS)
  },
  creationDate: {
    type: Date,
    required: true,
    default: new Date()
  },
  completionDate: {
    type: Date,
  },
  manager: {
    type: Number
  },
  status: {
    type: String,
    required: true,
    default: STATUSES.UNTAKEN,
    enum: Object.values(STATUSES)
  },
  paid: {
    type: Boolean,
    required: true,
    default: false
  },
  platform: {
    type: String,
    enum: Object.values(PLATFORMS)
  },
  extra: {
    type: String
  }
});

export const orderModel = model('orders', orderSchema);