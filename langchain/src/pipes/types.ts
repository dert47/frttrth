import { CallbackManager } from "../callbacks/manager.js";
import { Serialized } from "../schema/load.js";
import type * as libT from "./lib.js";

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
  callbackManager?: CallbackManager;
  key: string;
}

export interface NodeContextFields {
  lib: typeof libT;
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

  output: WritableStream<Tuple | Tuple[1]>;

  lib: typeof libT;

  constructor({
    lib,
    args,
    controller,
    options,
    input,
    output,
  }: NodeContextFields) {
    this.lib = lib;
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
  | ((ctx: NodeContext) => AsyncGenerator<Tuple | Tuple[1], void, void>);

export interface NodeProtocol {
  asNode: NodeProgram;
  toJSON(): Serialized;
}

export type Node = NodeProtocol | NodeProgram;
