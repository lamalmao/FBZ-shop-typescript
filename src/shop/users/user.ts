import { Types } from 'mongoose';
import { IUser } from './user-interface.js';
import { ONLINE_SHIFT, REGIONS, userModel } from './user-model.js';
import { IManagerStatisticsField } from './manager-statistics.js';
import logger from '../../logger.js';
import INoticeData from './notice.js';
import { ROLES, STATUSES, ACTIONS } from './user-constants.js';
import userNoticeEmitter from '../../bot/notice-events/notice.js';

export class User implements IUser {
  public telegramId: number;
  public username: string;
  public role: string;
  public joinDate: Date;
  public onlineExpiresDate: Date;
  public balance: number;
  public status: string;
  public statistics?: Array<IManagerStatisticsField>;
  public refills: number;
  public game?: Array<string>;
  public region?: string;

  private _id?: Types.ObjectId;

  public static onlineShift: number = ONLINE_SHIFT;
  public static readonly UNKOWN: string = 'unknown';

  public static async provideAction(userId: number): Promise<boolean> {
    const user = new User(userId);
    const loadResult = await user.loadFromBase();

    if (!loadResult) {
      return true;
    }

    user.acted().catch(err => logger.error(err));
    return user.status !== STATUSES.BANNED;
  }

  public constructor (telegramId: number, username?: string, role?: string, region?: string) {
    this.telegramId = telegramId;

    if (username && role && region) {
      if (!Object.values(ROLES).includes(role)) {
        throw new Error('Данной роли не существует');
      }

      if (!Object.values(REGIONS).includes(region)) {
        region = REGIONS.RU;
      }

      this.region = region;
      this.role = role;
      this.username = username;

      this.joinDate = new Date();
      this.onlineExpiresDate = new Date(Date.now() + User.onlineShift);
      this.balance = 0;
      this.status = STATUSES.NORMAL;
      this.refills = 0;
      
      this.statistics = new Array<IManagerStatisticsField>();
    } else {
      this.telegramId = telegramId;
      this.username = User.UNKOWN;
      this.role = ROLES.UNKOWN;
      this.joinDate = new Date(0);
      this.onlineExpiresDate = new Date(0);
      this.balance = -1;
      this.status = STATUSES.UNKOWN;
      this.refills = -1;
    }
  }

  private async acted(): Promise<void> {
    await userModel.updateOne({
      telegramId: this.telegramId
    }, {
      $set: {
        lastAction: new Date()
      }
    });
  }

  public async saveNewUser(): Promise<boolean> {
    if (this.username === User.UNKOWN || this.role === ROLES.UNKOWN || this.status === STATUSES.UNKOWN || !this.region) {
      return false;
    }

    const userExistsRequest = await userModel.findOne({
      telegramId: this.telegramId
    }, 'role');

    if (userExistsRequest === null) {
      let statsField = this.role in [ ROLES.MANAGER, ROLES.ADMIN ] ? new Array() : undefined;
      const result = await userModel.create({
        telegramId: this.telegramId,
        role: this.role,
        game: this.game,
        statistics: statsField,
        region: this.region
      });

      if (!result) {
        return false;
      }

      this._id = result._id;

      return true;
    } else {
      return false;
    }
  }

  public async loadFromBase(): Promise<boolean> {
    const userDBInstance = await userModel.findOne({
      telegramId: this.telegramId
    });

    if (!userDBInstance) {
      return false;
    }

    this._id = userDBInstance._id;
    this.username = userDBInstance.username;
    this.role = userDBInstance.role;
    this.statistics = userDBInstance.statistics;
    this.joinDate = userDBInstance.joinDate;
    this.onlineExpiresDate = userDBInstance.onlineExpiresDate;
    this.status = userDBInstance.status;
    this.game = userDBInstance.game;
    this.balance = userDBInstance.balance;
    this.refills = userDBInstance.refills;


    return true;
  }

  public async ban(): Promise<void> {
    await this.loadFromBase();

    if (this.status !== STATUSES.BANNED) {
      this.status = STATUSES.BANNED;
      await this.notice(ACTIONS.BANNED);
    } else {
      logger.info(`User ${this.telegramId}:${this.username} already banned`);
    }
  }

  public async changeRole(role: string): Promise<void> {
    if (this.role === role) {
      throw new Error('Данная роль уже назначена пользователю');
    }

    if (this.role in ROLES === false) {
      throw new Error('Данной роли не существует');
    }

    await this.loadFromBase();

    this.role = role;
    await userModel.updateOne({
      telegramId: this.telegramId
    }, {
      $set: {
        role: role
      }
    });

    this.notice(ACTIONS.ROLE_CHANGED, {
      role: role
    }).catch(e => logger.error(e));
  }

  public async editBalance(modifier: number): Promise<number> {
    if (modifier === 0) {
      throw new Error('Нельзя изменить баланс на 0');
    }

    await this.loadFromBase();

    const newBalance = (this.balance <= Math.abs(modifier) && modifier < 0) ? 0 : this.balance + modifier;
    this.balance = newBalance;

    await userModel.updateOne({
      telegramId: this.telegramId
    }, {
      $set: {
        balance: this.balance
      }
    });

    this.notice(ACTIONS.BALANCE_CHANGED, {
      balanceModifier: modifier,
      newBalance: newBalance
    }).catch(err => logger.error(err));

    return newBalance;
  }

  public async changeTelegramId(newId: number): Promise<void> {
    await this.loadFromBase();

    logger.info(`Попытка переноса данных аккаунта пользователя ${this.username}:${this.telegramId}. Новое значение: ${newId}`);

    const oldId = this.telegramId;
    this.telegramId = newId;

    await userModel.findByIdAndUpdate(this._id, {
      $set: {
        telegramId: newId
      }
    });

    this.notice(ACTIONS.TELEGRAM_ID_CHANGED, {
      telegramId: this.telegramId,
      oldTelegramId: oldId
    }).catch(err => logger.error(err));
  }

  public async editUsername(username: string): Promise<void> {
    this.username = username;
    await userModel.updateOne({
      telegramId: this.telegramId
    }, {
      $set: {
        username: this.username
      }
    });
  }

  public async setOnline(timeShift?: number): Promise<Date> {
    if (timeShift && timeShift >= 0) {
      throw new Error('Нельзя добавить нулевое или отрицательное число секунд.');
    }

    await this.loadFromBase();

    if (timeShift) {
      timeShift *= 1000;
    } else {
      timeShift = User.onlineShift;
    }

    const newOnlineDate = new Date(Date.now() + timeShift);
    this.onlineExpiresDate = newOnlineDate;

    await userModel.updateOne({
      telegramId: this.telegramId
    }, {
      $set: {
        onlineExpiresDate: newOnlineDate
      }
    });

    return newOnlineDate;
  }

  public async changeRegion(newRegion: string): Promise<void> {
    await this.loadFromBase();

    if (!Object.values(REGIONS).includes(newRegion)) {
      throw new Error('Недоступный регион');
    }

    await userModel.updateOne({
      telegramId: this.telegramId
    }, {
      $set: {
        region: newRegion
      }
    });
    this.region = newRegion;

    this.notice(ACTIONS.REGION_CHANGED, {
      region: newRegion
    }).catch(err => logger.error(err));
  }

  private async notice(action: string, data?: INoticeData): Promise<void> {
    logger.info(action);
    logger.data(data);

    userNoticeEmitter.emit(action, data);
    return;
  }
}
