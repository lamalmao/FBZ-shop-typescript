import { Schema, model } from 'mongoose';
import { ROLES, STATUSES, User } from './user';
import { GAMES } from '../games';
import { ManagerStatisticsField } from './manager-statistics';
const userSchema = new Schema({
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
        default: new Date(Date.now() + User.onlineShift)
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
        type: [ManagerStatisticsField]
        // required: false
    }
});
export const userModel = model('users', userSchema);
