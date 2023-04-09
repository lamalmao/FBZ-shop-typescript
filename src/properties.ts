import path from 'path';

const root = process.cwd();

export const rootDir = path.join(root, 'extras');
export const imagesDir = path.join(rootDir, 'images');
export const templatesDir = path.join(rootDir, 'templates');
export const scenariosDir = path.join(rootDir, 'sell-scenarios');

export const GOODS_COVER_TEMPLATE = 'item_cover.pug';
