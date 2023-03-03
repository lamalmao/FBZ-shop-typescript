// import logger from '../../logger.js';
import INoticeData from '../../shop/users/notice.js';
import { ACTIONS } from '../../shop/users/user-constants.js';
import { User } from '../../shop/users/user.js';
import EventEmitter from 'events';

const userNoticeEmitter = new EventEmitter();

// userNoticeEmitter.someMiddlewareForLogging

userNoticeEmitter.on(ACTIONS.BALANCE_CHANGED, async (user: User, data?: INoticeData) => {
  console.log(user, data);
});

export default userNoticeEmitter;