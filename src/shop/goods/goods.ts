import { Types } from 'mongoose';
import IItem from './goods.d.js';
import IOptions from './options.js';
import { GAMES } from '../../games.js';
import { itemModel } from './item-model.js';
import { Category } from '../categories/category.js';
import logger from '../../logger.js';
import { ItemRender } from '../../render/render.js';
import { GOODS_COVER_TEMPLATE, imagesDir } from '../../properties.js';
import fs from 'fs';
import path from 'path';

export const DELIVERY_TYPES = {
  INSTANT: 'instant',
  MANUAL: 'manual',
  CODE: 'code'
}

export class Goods implements IItem {
  public _id?: Types.ObjectId;
  public category?: Types.ObjectId;
  public title?: string;
  public delivery?: string;
  public game?: string;
  public isVBucks?: boolean;
  public shortDescription?: string;
  public fullDescription?: string;
  public creationDate?: Date;
  public modificationDate?: Date;
  public hidden?: boolean;
  public createdBy?: number;
  public image?: string;
  public cover?: string;
  public price?: number;
  public discount?: number;
  public options?: IOptions[];

  protected static itemRender: ItemRender = new ItemRender(GOODS_COVER_TEMPLATE);

  public constructor(id?: Types.ObjectId, opts?: IItem) {
    this._id = id;

    if (opts) {
      this.category = opts.category;
      this.title = opts.title;
      this.isVBucks = opts.isVBucks;
      this.shortDescription = opts.shortDescription;
      this.fullDescription = opts.fullDescription;
      this.creationDate = opts.creationDate;
      this.modificationDate = opts.modificationDate;
      this.hidden = opts.hidden;
      this.createdBy = opts.createdBy;
      this.price = opts.price;
      this.image = opts.image;
      this.cover = opts.cover;
      this.options = opts.options;

      if (opts.delivery) {
        if (Object.values(DELIVERY_TYPES).includes(opts.delivery)) {
          this.delivery = opts.delivery;
        } else {
          throw new Error('Несуществующий тип доставки товара');
        }
      }

      if (opts.game) {
        if (Object.values(GAMES).includes(opts.game)) {
          this.game = opts.game;
        } else {
          throw new Error('Данная игра недоступна');
        }
      }

      if (opts.discount && (opts.discount <= 1 && opts.discount >= 0)) {
        this.discount = opts.discount;
      } else {
        throw new Error('Скидка не может быть меньше 0 или больше 100 %');
      }
    }
  }

  public async loadFromBase(): Promise<void> {
    if (!this._id) {
      throw new Error('id товара неизвестен');
    }

    const instance = await itemModel.findById(this._id);

    if (instance) {
      this.category = instance.category;
      this.title = instance.title;
      this.delivery = instance.delivery;
      this.game = instance.game;
      this.isVBucks = instance.isVBucks;
      this.shortDescription = instance.shortDescription;
      this.fullDescription = instance.fullDescription;
      this.createdBy = instance.createdBy;
      this.creationDate = instance.creationDate;
      this.modificationDate = instance.modificationDate;
      this.hidden = instance.hidden;
      this.image = instance.image;
      this.cover = instance.cover;
      this.price = instance.price;
      this.discount = instance.discount;
      this.options = instance.options;
    }
  }

  public async saveToBase(): Promise<void> {
    this._id = undefined;
    
    const result = await itemModel.create(this);
    
    if (result) {
      this._id = result._id;
    } else {
      throw new Error('Не получилось сохранить товар');
    }
  }

  public async changeCategory(newCategory: Types.ObjectId): Promise<void> {
    await this.loadFromBase();

    const newCategoryInstance = new Category(newCategory, null);
    const oldCategory = this.category;
    await newCategoryInstance.loadFromBase();
    
    await itemModel.updateOne({
      _id: this._id
    }, {
      $set: {
        category: newCategory
      }
    });
    this.category = newCategory;

    if (oldCategory) {
      const oldCategoryInstance = new Category(oldCategory, null);
      oldCategoryInstance.renderImage().catch(err => logger.error(err));
    }

    this.renderCover(true).catch(err => logger.error(err));
    this.setModified().catch(err => logger.error(err));
  }

  public async changeGame(newGame: string): Promise<void> {
    await this.loadFromBase();

    if (this.game === newGame) {
      throw new Error(`Данный товар уже '${newGame}'`);
    }

    if (!Object.values(GAMES).includes(newGame)) {
      throw new Error('Данная игра недоступна');
    }

    await itemModel.updateOne({
      _id: this._id
    }, {
      $set: {
        game: newGame
      }
    });
    this.game = newGame;
    this.setModified().catch(err => logger.error(err));
  }

  public async changeDelivery(newDelivery: string): Promise<void> {
    await this.loadFromBase();

    if (this.delivery === newDelivery) {
      throw new Error('Новый тип доставки совпадает со старым');
    }

    if (!Object.values(DELIVERY_TYPES).includes(newDelivery)) {
      throw new Error('Данного типа доставки товара не существует');
    }

    await itemModel.updateOne({
      _id: this._id
    }, {
      $set: {
        delivery: newDelivery
      }
    });
    this.delivery = newDelivery;

    this.setModified().catch(err => logger.error(err));
  }

  public async switchHidden(): Promise<void> {
    await this.loadFromBase();

    await itemModel.updateOne({
      _id: this._id
    }, {
      $set: {
        hidden: !this.hidden
      }
    });
    this.hidden = !this.hidden;

    this.setModified().catch(err => logger.error(err));
    this.redrawCategory().catch(err => logger.error(err));
  }

  public async switchIsVBucks(): Promise<void> {
    await this.loadFromBase();

    await itemModel.updateOne({
      _id: this._id
    }, {
      $set: {
        isVBucks: !this.hidden
      }
    });
    this.isVBucks = !this.hidden;

    this.setModified().catch(err => logger.error(err));
  }

  public async editTitle(newTitle: string) {
    await this.loadFromBase();

    if (newTitle.length === 0) {
      throw new Error('Название не может быть пустым')
    }

    await itemModel.updateOne({
      _id: this._id
    }, {
      $set: {
        title: newTitle
      }
    });
    this.title = newTitle;

    this.renderCover(true).catch(err => logger.error(err));
    this.setModified().catch(err => logger.error(err));
  }

  public async editShortDescription(newShortDescription: string): Promise<void> {
    await this.loadFromBase();

    if (!newShortDescription) {
      throw new Error('Описание не может быть пустой строкой');
    }

    await itemModel.updateOne({
      _id: this._id
    }, {
      $set: {
        shortDescription: newShortDescription
      }
    });
    this.shortDescription = newShortDescription;

    this.renderCover().catch(err => logger.error(err));
    this.setModified().catch(err => logger.error(err));
  }

  public async editFullDescription(newFullDescription: string): Promise<void> {
    await this.loadFromBase();

    if (!newFullDescription) {
      throw new Error('Описание не может быть пустым');
    }

    await itemModel.updateOne({
      _id: this._id
    }, {
      $set: {
        fullDescription: newFullDescription
      }
    });

    this.setModified().catch(err => logger.error(err));
  }

  public async changeImage(imageFileName: string): Promise<void> {
    await this.loadFromBase();

    const pathToNewImage = path.join(imagesDir, imageFileName);
    if (!fs.existsSync(pathToNewImage)) {
      throw new Error(`Изображение не найдено\n${pathToNewImage}`);
    }

    await itemModel.updateOne({
      _id: this._id
    }, {
      $set: {
        image: imageFileName
      }
    });

    this.renderCover(true).catch(err => logger.error(err));
    this.setModified().catch(err => logger.error(err));
  }

  public async changePrice(newPrice: number): Promise<void> {
    await this.loadFromBase();

    if (Number.isNaN(newPrice) || newPrice <= 0) {
      throw new Error('Цена должна быть положительным ненулевым числом');
    }

    await itemModel.updateOne({
      _id: this._id
    }, {
      $set: {
        price: newPrice
      }
    });
    this.price = newPrice;

    this.renderCover(true).catch(err => logger.error(err));
    this.setModified().catch(err => logger.error(err));
  }

  public async changeDiscount(newDiscount: number): Promise<void> {
    await this.loadFromBase();

    if (Number.isNaN(newDiscount) || (newDiscount < 0 || newDiscount > 100)) {
      throw new Error('Скидка не может больше 100 и меньше 0');
    }

    await itemModel.updateOne({
      _id: this._id
    }, {
      $set: {
        discount: newDiscount
      }
    });
    this.discount = newDiscount;

    this.renderCover(true).catch(err => logger.error(err));
    this.setModified().catch(err => logger.error(err));
  }

  public async changeOptions(newOptions: Array<IOptions>): Promise<void> {
    await this.loadFromBase();

    await itemModel.updateOne({
      _id: this._id
    }, {
      $set: {
        options: newOptions
      }
    });
    this.options = newOptions;

    this.setModified().catch(err => logger.error(err));
  }

  public get realPrice() : number {
    if (this.price && this.discount) {
      return Math.ceil(this.price * (1 - this.discount / 100));
    } else {
      return NaN;
    }
  }
  
  private async setModified(): Promise<void> {
    if (this._id) {
      await itemModel.updateOne({
        _id: this._id
      }, {
        $set: {
          modificationDate: new Date()
        }
      });
    }
  }

  private async renderCover(renderCategory?: boolean): Promise<void> {
    if (!this._id) {
      throw new Error('id товара неизвестен');
    }
    await this.loadFromBase();
    
    if (renderCategory) {
      if (!this.category) {
        throw new Error('Товар не находится в категории');
      }

      let category = new Category(this.category, null);
      await category.loadFromBase();
1
      category.renderImage().catch(err => logger.error(err));
    }

    const newCover = await Goods.itemRender.renderImage(this._id);
    await itemModel.updateOne({
      _id: this._id
    }, {
      $set: {
        cover: newCover
      }
    });
    this.cover = newCover;
  }

  private async redrawCategory(): Promise<void> {
    if (this.category) {
      let category = new Category(this.category, null);
      await category.loadFromBase();
      await category.renderImage();
    }
  }
}