import logger from '../../logger';
import INoticeData from '../../shop/users/notice';
import { ACTIONS, User } from '../../shop/users/user';
import EventEmitter from 'events';

const userNoticeEmitter = new EventEmitter();

userNoticeEmitter.on(ACTIONS.BALANCE_CHANGED, async (user: User, data?: INoticeData) => {
  console.log(user, data);

  logger.info('Баланс то поменялся ебать, гы');
});

export default userNoticeEmitter;