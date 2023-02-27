import { Types } from 'mongoose';
import { IGoodsCategory } from './category.d.js';
import { CATEGORY_IMAGE_BLANK, categoryModel } from './category-model.js';
import logger from '../../logger.js';
import fs from 'fs';
import path from 'path';
import { imagesDir } from '../../properties.js';

export const CATEGORY_TYPES = {
  ROOT: 'root',
  NESTED: 'neted'
};

export class Category implements IGoodsCategory {
  public type?: string;
  public name?: string;
  public _id?: Types.ObjectId;
  public createdBy?: number;
  public creationDate?: Date;
  public modificationDate?: Date;
  public image?: string;
  public hidden?: boolean;

  public constructor(id: Types.ObjectId | null, createdBy: number | null, type?: string, name?: string, image?: string) {
    if (type && !Category.checkType(type)) {
      throw new Error('Несуществующий тип категории');
    }

    if (id !== null) {
      this._id = id;
    }

    if (createdBy !== null) {
      this.createdBy = createdBy;
    }

    this.type = type;
    this.name = name;
    this.image = image;
    this.hidden = false;
  }

  public async loadFromBase(): Promise<void> {
    const categoryInstance = await categoryModel.findById(this._id);

    if (!categoryInstance) {
      throw new Error('Данной категории не существует');
    }

    this.name = categoryInstance.name;
    this.type = categoryInstance.type;
    this.creationDate = categoryInstance.creationDate;
    this.createdBy = categoryInstance.createdBy;
    this.modificationDate = categoryInstance.modificationDate;
    this.hidden = categoryInstance.hidden;
    this.image = categoryInstance.image;
  }

  public async saveToBase(): Promise<void> {
    const timeStamp = new Date();

    if (this.name && this.type && this.createdBy && this.hidden) {
      const categoryInstance = await categoryModel.create({
        name: this.name,
        type: this.type,
        createdBy: this.createdBy,
        hidden: this.hidden,
        image: this.image,
        creationDate: timeStamp,
        modificationDate: timeStamp
      });

      this._id = categoryInstance._id;
    } else {
      throw new Error('Не все параметры переданы');
    }
  }

  public async delete(): Promise<boolean> {
    if (!this._id) {
      throw new Error('ID не указан');
    }

    const result = await categoryModel.deleteOne({
      _id: this._id
    });

    return result.deletedCount === 1;
  }

  public async changeType(type: string): Promise<void> {
    if (!Category.checkType(type)) {
      throw new Error('Несуществующий тип категории');
    }

    await this.loadFromBase();

    this.type = type;
    await categoryModel.updateOne({
      _id: this._id
    }, {
      $set: {
        type: this.type
      }
    });

    this.updateEditTimestamp().catch(err => logger.error(err));
  }

  public async changeName(name: string) {
    await this.loadFromBase();

    if (this.name === name) {
      throw new Error('Категории уже назначено такое имя');
    }

    this.name = name;
    await categoryModel.updateOne({
      _id: this._id
    }, {
      $set: {
        name: this.name
      }
    });

    this.updateEditTimestamp().catch(err => logger.error(err));
  }

  public async changeVisibility(hidden: boolean): Promise<void> {
    await this.loadFromBase();

    if (this.hidden === hidden) {
      throw new Error(this.hidden ? 'Категория уже скрыта' : 'Категория уже доступна');
    }

    this.hidden = hidden;
    await categoryModel.updateOne({
      _id: this._id
    }, {
      $set: {
        hidden: this.hidden
      }
    });

    this.updateEditTimestamp().catch(err => logger.error(err));
  }

  public async changeImage(filename: string): Promise<void> {
    await this.loadFromBase();

    if (this.type !== CATEGORY_TYPES.ROOT) {
      throw new Error('Ручное изменение изображения доступно только для корневых категорий');
    }

    const newImagePath = path.join(imagesDir, filename);
    if (!fs.existsSync(newImagePath)) {
      throw new Error('Файл не найден');
    }

    const newImageBuffer = fs.readFileSync(newImagePath);
    const oldImageBuffer = fs.readFileSync(path.join(imagesDir, this.image ? this.image : CATEGORY_IMAGE_BLANK));

    if (Buffer.compare(newImageBuffer, oldImageBuffer)) {
      throw new Error('Новое изображение не отличается от старого');
    }

    this.image = filename;
    await categoryModel.updateOne({
      _id: this._id
    }, {
      $set: {
        image: this.image
      }
    });

    this.updateEditTimestamp().catch(err => logger.error(err));
  }

  public async renderImage(): Promise<void> {
    await this.loadFromBase();

    if (this.type !== CATEGORY_TYPES.NESTED) {
      throw new Error('Перерисовка обложки доступна только для вложенных категорий');
    }

    // this.image = await IRE(this._id);
  }

  private static checkType(type: string): boolean {
    if (!type) {
      return false;
    } else {
      return Object.values(CATEGORY_TYPES).includes(type);
    }
  }

  private async updateEditTimestamp(): Promise<void> {
    if (this._id) {
      await categoryModel.updateOne({
        _id: this._id
      }, {
        $set: {
          modificationDate: new Date()
        }
      });
    }
  }
}