import userNoticeEmitter from "./bot/notice-events/notice.js";
import { ACTIONS, ROLES } from "./shop/users/user-constants.js";
import { User } from "./shop/users/user.js";


const user = new User(100000, 'laesia', ROLES.ADMIN);
userNoticeEmitter.emit(ACTIONS.BALANCE_CHANGED, user);