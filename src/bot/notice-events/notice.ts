import logger from '../../logger.js';
import INoticeData from '../../shop/users/notice.js';
import { ACTIONS } from '../../shop/users/user-constants.js';
import { User } from '../../shop/users/user.js';
import EventEmitter from 'events';

const userNoticeEmitter = new EventEmitter();

userNoticeEmitter.on(ACTIONS.BALANCE_CHANGED, async (user: User, data?: INoticeData) => {
  console.log(user, data);

  logger.info('Баланс то поменялся ебать, гы');
  logger.error('test');
  logger.info('check it out');
});

export default userNoticeEmitter;