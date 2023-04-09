import { Model, Schema, model } from 'mongoose';
import { IUser } from './user-interface.js';
import { GAMES } from '../../games.js';
import { IManagerStatisticsField } from './manager-statistics.js';
import { ROLES, STATUSES } from './user-constants.js';

export const ONLINE_SHIFT = 15 * 60 * 1000; 

export const REGIONS = {
  RU: 'RU',
  // UA: 'UA',
  // EU: 'EU',
  // BL: 'BL'
}

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
    default: new Date(Date.now() + ONLINE_SHIFT) // 15 Минут
  },
  balance: {
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
  },
  lastAction: {
    type: Date,
    required: true,
    default: new Date()
  },
  region: {
    type: String,
    required: true,
    enum: Object.values(REGIONS)
  }
});

export const userModel: Model<IUser> = model('users', userSchema);