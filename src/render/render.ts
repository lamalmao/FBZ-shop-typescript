import IRender from './render.d.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { imagesDir, rootDir, templatesDir } from '../properties.js';
import { Types } from 'mongoose';
import { Category } from '../shop/categories/category.js';

abstract class Render implements IRender {
  protected outDirPath: string;
  protected templatePath: string;
  
  constructor(templateFilename: string, outDir?: string) {
    let outDirPath: string;
    if (outDir) {
      outDirPath = path.join(rootDir, outDir);
    } else {
      outDirPath = imagesDir;
    }
    if (!fs.existsSync(outDirPath)) {
      fs.mkdirSync(outDirPath);
    }
    this.outDirPath = outDirPath;

    const templatePath = path.join(templatesDir, templateFilename);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Указанный шаблон "${templatePath}" не найден`);
    }
    this.templatePath = templatePath;
  }

  /**
   * 
   * @param id ObjectId товара или категории, для которых необоходимо отрендерить обложку
   * @returns название готового изображения
   */
  abstract renderImage(id: Types.ObjectId): Promise<string>;

  protected genImageName(): string {
    return crypto.randomBytes(8).toString() + 'jpg';
  }
}

export class CategoryRender extends Render {
  constructor(templateFilename: string, outDir?: string) {
    super(templateFilename, outDir);
  }

  async renderImage(id: Types.ObjectId): Promise<string> {
    const category = new Category(id, null);
    await category.loadFromBase();

    return 'not/ready/yet';
  }
}

export class ItemRender extends Render {
  constructor(templateFilename: string, outDir?: string) {
    super(templateFilename, outDir);
  }

  async renderImage(id: Types.ObjectId): Promise<string> {
    console.log(id);
    return 'not/ready/yet';
  }
}