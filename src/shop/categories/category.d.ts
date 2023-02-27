import { Types } from 'mongoose';

export interface IGoodsCategory {
  type?: string;
  name?: string;
  _id?: Types.ObjectId;
  createdBy?: number;
  creationDate?: Date;
  modificationDate?: Date;
  hidden?: boolean;
  image?: string;

  /**
   * @description удаляет категорию из базы данных
   */
  delete(): Promise<boolean>;
  /**
   * @description загружает данную версию категории в базу данных
   */
  saveToBase(): Promise<void>;
  /**
   * @description загружает актульную версию категории из базы
   */
  loadFromBase(): Promise<void>;
}