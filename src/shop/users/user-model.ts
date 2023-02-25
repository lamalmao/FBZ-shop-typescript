import { Model, Schema, model } from 'mongoose';
import { IUser } from './user-interface.js';
import { GAMES } from '../../games.js';
import { IManagerStatisticsField } from './manager-statistics.js';
import { ROLES, STATUSES } from './user-constants.js';

const userSchema = new Schema<IUser>({
  telegramId: {
    type: Number,
    required: true,
  },
  username: {
    type: String,
    required: true,
    default: '!NO USERNAME PROVIDED!'
  },
  role: {
    type: String,
    required: true,
    default: ROLES.CLIENT,
    enum: ROLES
  },
  status: {
    type: String,
    required: true,
    default: STATUSES.NORMAL,
    enum: STATUSES
  },
  joinDate: {
    type: Date,
    required: true,
    default: new Date()
  },
  onlineExpiresDate: {
    type: Date,
    required: true,
    default: new Date(Date.now() + 15 * 60 * 1000) // 15 Минут
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  refills: {
    type: Number,
    required: true,
    default: 0
  },
  game: {
    type: [String],
    required: false,
    enum: GAMES
  },
  statistics: {
    type: Array<IManagerStatisticsField>
    // required: false
  }
});

export const userModel: Model<IUser> = model('users', userSchema);