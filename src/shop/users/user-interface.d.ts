import { IManagerStatisticsField } from './manager-statistics.js';

export interface IUser {
  telegramId: number;
  username: string;
  role: string;
  joinDate: Date;
  onlineExpiresDate: Date;
  balance: number;
  status: string;
  statistics?: Array<IManagerStatisticsField>;
  refills: number;
  game?: Array<string>;

  /**
   * @param role - новая роль для пользователя из ROLES
   */
  changeRole(role: string): Promise<void>;
  /**
   * @param newId - новый ID пользователя в телеграме
   */
  changeTelegramId(newId: number): Promise<void>;
  /**
   * @param username - новый псевдоним пользователя
   */
  editUsername(username: string): Promise<void>;
  /**
   * @param modifier - на сколько изменить баланс пользователя. Целое число, не равное нулю
   * @returns новое значение баланса пользователя
   */
  editBalance(modifier: number): Promise<number>;
  /**
   * @param timeShift - на сколько продлить статус "онлайн" для пользователя от текущего времени в секундах
   * @returns время до которого пользователь будет считаться "онлайн"
   */
  setOnline(timeShift?: number): Promise<Date>;
  /**
   * @description ставит пользователю статус @constant STATUSES.BANNED
   */
  ban(): Promise<void>;
  /**
   * @description загружает из базы данных информацию об пользователе в объект @class User
   */
  updateData(): Promise<boolean>;
  /**
   * @description сохраняет нового пользователя в базу данных. Не применять для обновления параметров, т.к. данная функция загружает все поля.
   */
  saveNewUser(): Promise<boolean>;
}