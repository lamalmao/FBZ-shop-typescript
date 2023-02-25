import userNoticeEmitter from "./bot/notice-events/notice";
import { ACTIONS, ROLES, User } from "./users/user";

const user = new User(100000, 'laesia', ROLES.ADMIN);
userNoticeEmitter.emit(ACTIONS.BALANCE_CHANGED, user);