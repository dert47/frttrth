/* eslint-disable @typescript-eslint/no-explicit-any */
import { Callbacks } from "../callbacks/manager.js";

export type Args = Record<string, any>;

export type Tuple = [string | number, any];

export type ReadableStreamIterable<T> = ReadableStream<T> & {
  [Symbol.asyncIterator](): AsyncIterator<T>;
};

export interface PieceContextFields {
  args: Args;
  callbacks?: Callbacks;
  controller: AbortController;
  input: ReadableStream<Tuple>;
  output: WritableStream<Tuple>;
}

export class PieceContext {
  args: Args;

  callbacks?: Callbacks;

  controller: AbortController;

  input: ReadableStreamIterable<Tuple>;

  output: WritableStream<Tuple>;

  constructor({
    args,
    controller,
    callbacks,
    input,
    output,
  }: PieceContextFields) {
    this.args = args;
    this.controller = controller;
    this.callbacks = callbacks;
    this.input = input as this["input"];
    this.output = output;
  }

  static create(
    fields: Omit<PieceContextFields, "output">
  ): [PieceContext, TransformStream<Tuple, Tuple>] {
    const transform = new TransformStream<Tuple, Tuple>();
    return [
      new PieceContext({
        ...fields,
        output: transform.writable,
      }),
      transform,
    ];
  }
}

export type PieceFunction = (ctx: PieceContext) => Promise<void>;

export type PieceGenerator = (
  ctx: PieceContext
) => AsyncGenerator<Tuple, void, void>;

export type RunnablePiece = PieceFunction | PieceGenerator;

export type SerializedPiece = object;

export interface Piece {
  asPiece: RunnablePiece;
  toJSON(): SerializedPiece;
}

export interface ComposeOptions {
  interruptOnError?: boolean;
}

export interface StreamOptions {
  signal?: AbortSignal;
  callbacks?: Callbacks;
}

export interface RunOptions {
  combineKeys?: "string" | "array";
}
