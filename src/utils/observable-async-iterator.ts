import { $$asyncIterator } from "iterall";
import { Observable, Subscription } from "rxjs";
// https://github.com/apollographql/graphql-subscriptions/blob/master/src/event-emitter-to-async-iterator.ts
export function observableAsyncIterator<T>(obs: Observable<T>): AsyncIterator<T> {
  const pullQueue: ((value?: IteratorResult<T> | PromiseLike<IteratorResult<T>> | undefined) => void)[] = [];
  const pushQueue: T[] = [];
  let subs: Subscription[] = [];
  let listening = true;
  let addedListeners = false;

  const pushValue = (event: T) => {
    if (pullQueue.length !== 0) {
      pullQueue.shift()!({ value: event, done: false });
    } else {
      pushQueue.push(event);
    }
  };

  const pullValue = () => {
    return new Promise(resolve => {
      if (pushQueue.length !== 0) {
        resolve({ value: pushQueue.shift(), done: false });
      } else {
        pullQueue.push(resolve);
      }
    });
  };

  const emptyQueue = () => {
    if (listening) {
      listening = false;
      if (addedListeners) { removeEventListeners(); }
      pullQueue.forEach(resolve => resolve({ value: undefined as any, done: true }));
      pullQueue.length = 0;
      pushQueue.length = 0;
    }
  };

  const addEventListeners = () => {
    subs.push(obs.subscribe(pushValue));
  };

  const removeEventListeners = () => {
    subs.forEach(sub => sub.unsubscribe());
    subs = [];
  };

  return {
    next() {
      if (!listening) { return (this as any).return(); }
      if (!addedListeners) {
        addEventListeners();
        addedListeners = true;
      }
      return pullValue();
    },
    return() {
      emptyQueue();

      return Promise.resolve({ value: undefined, done: true });
    },
    throw(error: any) {
      emptyQueue();

      return Promise.reject(error);
    },
    [$$asyncIterator]() {
      return this;
    },
  } as any;
}
