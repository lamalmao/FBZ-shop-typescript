import { Types } from 'mongoose';
import { IOrder } from './orders.d.js';
import { Goods } from '../goods/goods.js';
import { User } from '../users/user.js';
import { orderModel } from './orders-model.js';
import { ACTIONS, ROLES } from '../users/user-constants.js';
import userNoticeEmitter from '../../bot/notice-events/notice.js';
import logger from '../../logger.js';
import { userModel } from '../users/user-model.js';

export const STATUSES = {
  UNTAKEN: 'untaken',
  CANCELED: 'canceled',
  TAKEN: 'taken',
  DONE: 'done',
  REFUND: 'refund'
};

export const PLATFORMS = {
  PS: 'ps',
  XBox: 'xbox',
  PC: 'pc',
  Nintendo: 'nintendo',
  Android: 'android'
}

export class Order implements IOrder {
  public orderId?: number;
  public client?: number;
  public item?: Types.ObjectId;
  public manager?: number;
  public itemTitle?: string;
  public amount?: number;
  public currency?: string;
  public creationDate?: Date;
  public completionDate?: Date;
  public status?: string;
  public paid?: boolean;
  public platform?: string;
  public game?: string;
  public extra?: string;

  protected itemInstance?: Goods;
  protected userInstance?: User;
  private orderCreated: boolean;

  public constructor(opts: IOrder) {
    if (!opts.client || !opts.item) {
      throw new Error('Для оформления заказа необходимо указать id клиента и товара');
    }

    this.client = opts.client;
    this.item = opts.item;

    this.manager = opts.manager;
    this.itemTitle = opts.itemTitle;
    this.amount = opts.amount;
    this.currency = opts.currency;
    this.status = opts.status;
    this.paid = opts.paid;
    this.platform = opts.platform;
    this.game = opts.game;
    this.extra = opts.extra;
    this.creationDate = opts.creationDate;
    this.completionDate = opts.completionDate;

    this.orderCreated = false;
  }

  public async loadClientAndItemData(): Promise<void> {
    if (!this.item || !this.client) {
      throw new Error('Не указаны id клиента или товара');
    }

    const item = new Goods(this.item);
    const user = new User(this.client);

    await Promise.all([
      item.loadFromBase(),
      user.loadFromBase()
    ]);

    this.amount = item.realPrice;
    this.currency = user.region;
    this.itemTitle = item.title;
    this.game = item.game;

    this.itemInstance = item;
    this.userInstance = user;
  }

  public async createOrder(): Promise<void> {
    if (this.orderCreated) {
      throw new Error('Заказ уже создан');
    }

    await this.loadClientAndItemData();

    this.orderId = await Order.genUniqueId();
    this.paid = false;
    this.creationDate = new Date();

    await orderModel.create({
      orderId: this.orderId,
      item: this.item,
      client: this.item,
      itemTitle: this.itemTitle,
      paid: this.paid,
      game: this.game,
      amount: this.amount,
      currency: this.currency,
      creationDate: this.creationDate
    });
    this.orderCreated = true;
  }

  public async loadFromBase(): Promise<void> {
    if (!this.orderId) {
      throw new Error('id заказа неизвестен');
    }

    const instance = await orderModel.findOne({
      orderId: this.orderId
    });

    if (!instance) {
      throw new Error(`Заказ ${this.orderId} не найден`);
    }

    this.itemTitle = instance.itemTitle;
    this.client = instance.client;
    this.item = instance.item;
    this.game = instance.game;
    this.amount = instance.amount;
    this.currency = instance.currency;
    this.creationDate = instance.creationDate;
    this.completionDate = instance.completionDate;
    this.platform = instance.platform;
    this.extra = instance.extra;
    this.status = instance.status;
    this.manager = instance.manager;
    this.paid = instance.paid;

    this.orderCreated = true;
  }

  public async setManager(managerId: number): Promise<void> {
    await this.loadFromBase();

    const manager = new User(managerId);
    const found = await manager.loadFromBase();

    if (!found) {
      throw new Error(`Пользователь ${managerId} не найден`);
    }

    if (manager.role !== ROLES.MANAGER || manager.role !== ROLES.ADMIN) {
      throw new Error('Недостаточно прав');
    }

    this.manager = managerId;
    
    if (this.status === STATUSES.UNTAKEN) {
      this.status = STATUSES.TAKEN;
    }

    await orderModel.updateOne({
      orderId: this.orderId
    }, {
      $set: {
        manager: this.manager,
        status: this.status
      }
    });

    userNoticeEmitter.emit(ACTIONS.ORDER_TAKEN, {
      client: this.client,
      orderId: this.orderId
    });
  }

  public async done(): Promise<void> {
    await this.loadFromBase();
    
    if (this.status !== STATUSES.TAKEN) {
      throw new Error('Недопустимое действие');
    }

    await orderModel.updateOne({
      orderId: this.orderId
    }, {
      $set: {
        status: STATUSES.DONE
      }
    });

    const instance = this;

    userModel.updateOne({
      telegramId: this.manager,
      'statistics.itemTitle': this.itemTitle
    }, {
      $inc: {
        'statistics.$.sellsPerPeriod': 1
      }
    }).then(result => {
      if (result.modifiedCount > 0) {
        return;
      }

      userModel.updateOne({
        telegramId: instance.manager
      }, {
        $push: {
          statistics: {
            itemTitle: instance.itemTitle,
            sellsPerPeriod: 1
          }
        }
      }).catch(err => logger.error(err));
    }).catch(err => logger.error(err));

    userNoticeEmitter.emit(ACTIONS.ORDER_DONE, {
      client: this.client,
      orderId: this.orderId
    });
  }

  private static async genUniqueId(): Promise<number> {
    const id = Math.ceil(Math.random() * 1_000_000);
    const check = await orderModel.findOne({
      orderId: id
    }, '_id');

    if (check) {
      return await Order.genUniqueId();
    } else {
      return id;
    }
  }
}