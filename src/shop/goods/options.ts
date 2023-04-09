interface IOptions {
  description: string,
  values: Array<String>
}

export default class Options implements IOptions {
  public description: string;
  public values: Array<string>;

  public constructor(description: string, values: Array<string>) {
    this.description = description;
    this.values = values;
  }
}