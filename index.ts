import { types } from 'util';
import { EventEmitter } from 'events';

const event = new EventEmitter();

class Job {
  next: Job | null;
  cb: () => FinallyType;
  constructor(cb) {
    this.cb = cb;
  }
}

interface Options {
  interval: number;
}

class Queue {
  options: Options;
  head: Job | null;
  tail: Job | null;
  length: number;

  constructor(options?: Options) {
    event.on('next', this.next);
  }

  add(cb) {
    if (typeof cb !== 'function')
      throw new Error('argument must be a function');
    const AsyncFunctionConstructor = (async () => {}).constructor;
    let isAsync: boolean;
    if (cb instanceof AsyncFunctionConstructor) {
      isAsync = true;
    } else {
      cb = () => {
        cb();
        isAsync = false;
        event.emit('next');
      };
    }

    const job = new Job(cb);
    if (!this.head) {
      this.head = job;
      this.tail = job;
      isAsync ? job.cb().finally(() => this.cbend()) : job.cb();
    }
    this.tail = job;
    this.head.next = job;
    this.length++;
  }

  next() {
    if (!this.head.next) {
      this.head = null;
      this.tail = null;
      return this;
    }
    this.head = this.head.next;
    this.head.cb().finally(() => this.cbend());
  }

  cbend() {
    this.length--;
    this.next();
  }
}

type FinallyFunction = {
  (cb: () => any): any;
};
type FinallyType = {
  finally: FinallyFunction;
};

export default Queue;
