import { Document, Types } from 'mongoose';
import { IUser } from './user-interface';
import { userModel } from './user-model';
import { ManagerStatisticsField } from './manager-statistics';
import logger from '../logger';
import INoticeData from './notice';

export enum ROLES {
  CLIENT = 'client',
  MANAGER = 'manager',
  ADMIN = 'admin',
  UNKOWN = 'unknown'
}

export enum STATUSES {
  BANNED = 'banned',
  NORMAL = 'normal',
  UNKOWN = 'unknown'
}


export enum ACTIONS {
  BANNED = 'banned',
  ROLE_CHANGED = 'role-changed',
  BALANCE_CHANGED = 'balance-changed',
  TELEGRAM_ID_CHANGED = 'telegram-id-changed'
}

export class User implements IUser {
  public telegramId: number;
  public username: string;
  public role: string;
  public joinDate: Date;
  public onlineExpiresDate: Date;
  public balance: number;
  public status: string;
  public statistics?: Array<ManagerStatisticsField>;
  public refills: number;
  public game?: Array<string>;

  private _id?: Types.ObjectId;
  private isUserDataLoaded: boolean;

  public static onlineShift: number = 15 * 1000 * 60;
  public static readonly UNKOWN: string = 'unknown';

  protected databaseInstance?: Document<unknown, any, User>;

  public constructor (telegramId: number, username?: string, role?: string) {
    this.telegramId = telegramId;
    this.isUserDataLoaded = false;

    if (username && role) {
      if (role in ROLES === false) {
        throw new Error("Неизвестная роль");
      }

      this.role = role;
      this.username = username;

      this.joinDate = new Date();
      this.onlineExpiresDate = new Date(Date.now() + User.onlineShift);
      this.balance = 0;
      this.status = STATUSES.NORMAL;
      this.refills = 0;
      
      this.statistics = new Array<ManagerStatisticsField>();
    } else {
      this.telegramId = telegramId;
      this.isUserDataLoaded = false;
      this.username = User.UNKOWN;
      this.role = ROLES.UNKOWN;
      this.joinDate = new Date(0);
      this.onlineExpiresDate = new Date(0);
      this.balance = -1;
      this.status = STATUSES.UNKOWN;
      this.refills = -1;
    }
  }

  public async saveNewUser(): Promise<boolean> {
    if (this.username === User.UNKOWN || this.role === ROLES.UNKOWN || this.status === STATUSES.UNKOWN) {
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
        statistics: statsField
      });

      if (!result) {
        return false;
      }

      this._id = result._id;
      this.isUserDataLoaded = true;
      this.databaseInstance = result;

      return true;
    } else {
      return false;
    }
  }

  public async updateData(): Promise<boolean> {
    const userDBInstance = await userModel.findOne({
      telegramId: this.telegramId
    });

    if (!userDBInstance) {
      this.isUserDataLoaded = false;
      this.databaseInstance = undefined;
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

    this.databaseInstance = userDBInstance;
    this.isUserDataLoaded = true;

    return true;
  }

  public async ban(): Promise<void> {
    if (!this.isUserDataLoaded) {
      logger.info(`User ${this.telegramId}:${this.username} doesn't loaded to database`);
      return;
    }

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

    if (!this.isUserDataLoaded) {
      await this.updateData();
    }

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

    if (!this.isUserDataLoaded) {
      await this.updateData();
    }

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
    if (!this.isUserDataLoaded) {
      await this.updateData();
    }

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

    if (!this.isUserDataLoaded) {
      await this.updateData();
    }

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

  private async notice(action: string, data?: INoticeData): Promise<void> {
    logger.info(action);
    logger.data(data);
    return;
  }
}
