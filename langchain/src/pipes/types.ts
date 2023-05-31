import { Callbacks } from "../callbacks/manager.js";
import { Serialized } from "../schema/load.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Args = Record<string, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Tuple<T = any> = [string, T];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TupleCollection<T = any> = Record<string, Tuple<T>[1][]>;

// ReadableStream type in TypeScript is incorrect
export type ReadableStreamIterable<T> = ReadableStream<T> & {
  [Symbol.asyncIterator](): AsyncIterator<T>;
};

export interface NodeOptions {
  callbacks?: Callbacks;
  textKey: string;
}

export interface NodeContextFields {
  args: Args;
  options: NodeOptions;
  controller: AbortController;
  input: ReadableStream<Tuple>;
  output: WritableStream<Tuple | string>;
}

export class NodeContext {
  args: Args;

  options: NodeOptions;

  controller: AbortController;

  input: ReadableStreamIterable<Tuple>;

  output: WritableStream<Tuple | string>;

  constructor({ args, controller, options, input, output }: NodeContextFields) {
    this.args = args;
    this.options = options;
    this.controller = controller;
    this.input = input as this["input"];
    this.output = output;
  }

  static create(
    fields: Omit<NodeContextFields, "output">
  ): [NodeContext, TransformStream<Tuple | string, Tuple | string>] {
    const transform = new TransformStream<Tuple | string, Tuple | string>();
    return [
      new NodeContext({ ...fields, output: transform.writable }),
      transform,
    ];
  }
}

export type NodeProgram =
  | ((ctx: NodeContext) => Promise<void>)
  | ((ctx: NodeContext) => AsyncGenerator<string | Tuple, void, void>);

export type Node =
  | {
      asNode: NodeProgram;
      toJSON(): Serialized;
    }
  | NodeProgram;
