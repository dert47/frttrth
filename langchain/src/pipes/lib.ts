import { ReadableStreamIterable, Tuple, TupleCollection } from "./types.js";

export function map<I, O>(predicate: (chunk: I) => O): TransformStream<I, O> {
  return new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(predicate(chunk));
    },
  });
}

function combineKeysIsString(
  combineKeys?: "string" | "array"
): combineKeys is "string" {
  return combineKeys === "string";
}

export async function collect<T, K extends "string" | "array">(
  readable: ReadableStream<Tuple<T>>,
  combineKeys?: K
): Promise<
  typeof combineKeys extends "string" | undefined
    ? Record<string, string | Tuple<T>[1][]>
    : TupleCollection<T>
> {
  const iterable = readable as ReadableStreamIterable<Tuple<T>>;
  const collection: TupleCollection<T> = {};
  for await (const [key, value] of iterable) {
    if (!(key in collection)) {
      collection[key] = [];
    }
    collection[key].push(value);
  }

  if (combineKeysIsString(combineKeys)) {
    const stringCollection: Record<string, string | Tuple<T>[1][]> = {};
    for (const [key, values] of Object.entries(collection)) {
      if (values.every((value) => typeof value === "string")) {
        stringCollection[key] = values.join("");
      } else {
        stringCollection[key] = values;
      }
    }
    return stringCollection as typeof collection;
  }

  return collection;
}
