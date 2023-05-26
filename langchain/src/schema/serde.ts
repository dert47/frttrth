export interface Serialized {
  v: number;
  type: "constructor" | "function";
  identifier: string[];
  arguments: unknown[];
}

export abstract class Serializable {
  abstract lc_namespace: string[];

  abstract lc_name: string;

  lc_arguments: unknown[];

  constructor(...args: unknown[]) {
    this.lc_arguments = args;
  }

  toJSON(): Serialized {
    return {
      v: 1,
      type: "constructor",
      identifier: [...this.lc_namespace, this.lc_name, this.constructor.name],
      arguments: this.lc_arguments,
    };
  }
}
