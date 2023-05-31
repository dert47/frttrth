import { Serializable } from "../schema/load.js";

import {
  NodeContext,
  Node,
  ReadableStreamIterable,
  Tuple,
  NodeProtocol,
} from "./types.js";
import { consume } from "./runner.js";
import { map } from "./lib.js";

// TODO Implement interruptOnError
// export interface SequenceOptions {
//   interruptOnError?: boolean;
// }

export class Sequence extends Serializable implements NodeProtocol {
  lc_namespace = ["langchain", "pipes", "ops"];

  lc_name = "sequence";

  steps: Node[];

  constructor(...steps: Node[]) {
    super(...arguments);
    this.steps = steps;
  }

  async asNode(ctx: NodeContext) {
    let { input } = ctx;
    let copy: ReadableStreamIterable<Tuple>;
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index];
      const isLast = index === this.steps.length - 1;

      input = consume(
        step,
        ...NodeContext.create({
          ...ctx,
          options: {
            key: ctx.options.key,
            callbackManager: ctx.options.callbackManager, // TODO getChild()
          },
          input,
        })
      );
      if (!isLast) {
        [input, copy] = input.tee() as [
          ReadableStreamIterable<Tuple>,
          ReadableStreamIterable<Tuple>
        ];
        await copy
          .pipeThrough(map(([k, v]) => [`${index}.${k}`, v]))
          .pipeTo(ctx.output, {
            signal: ctx.controller.signal,
            preventClose: true,
          });
      }
    }
    await input.pipeTo(ctx.output, { signal: ctx.controller.signal });
  }
}
