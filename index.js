const EventEmmiter = require('events').EventEmitter;
const inherits = require('util').inherits;

function Job(cb, id) {
  this.next = null;
  this.cb = cb;
  this.id = id;
}

function Queue(options) {
  this.head = null;
  this.tail = null;
  this.queue = 0;
  this.options = options || {};
  this.stopped = false;
  this.pending = false;

  this.next = next.bind(this);
  this.add = add.bind(this);
  this.exec = exec.bind(this);
  this.stop = stop.bind(this);
  this.start = start.bind(this);
}
inherits(Queue, EventEmmiter);

function add(cb, id) {
  this.queue++;
  const job = new Job(cb, id || this.queue);
  if (!this.head) {
    this.pending = true;
    this.head = job;
    this.tail = job;
    let cachePendding = this.queue;
    const checker = setInterval(() => {
      if (cachePendding === this.queue) {
        clearInterval(checker);
        this.exec(job.cb, job.id);
      } else {
        cachePendding = this.queue;
      }
    }, 1);
  } else {
    this.tail.next = job;
    this.tail = job;
  }
}

function exec(cb, id) {
  this.pending = true;
  if (Array.isArray(cb)) {
    return Promise.all(cb.map((fc) => fc()))
      .then(() => {
        this.next(id);
      })
      .catch((err) => this.next(id, err));
  }
  try {
    const exec = cb();
    if (exec instanceof Promise) {
      exec
        .then(() => {
          this.next(id);
        })
        .catch((err) => this.next(id, err));
    } else {
      this.next(id);
    }
  } catch (err) {
    this.next(id, err);
  }
}

function next(id, err) {
  this.pending = false;
  if (err) this.emit('error', err, id);
  else this.emit('success', id);
  this.queue--;
  if (!this.head.next) {
    this.head = null;
    this.tail = null;
    return;
  }
  this.head = this.head.next;
  if (this.stopped) return;
  if (this.options.interval) {
    setTimeout(
      () => this.exec(this.head.cb, this.head.id),
      this.options.interval
    );
  } else {
    this.exec(this.head.cb, this.head.id);
  }
}

function stop() {
  this.stopped = true;
}

function start() {
  if (!this.stopped) return;
  this.stopped = false;
  if (!this.pending) this.exec(this.head.cb, this.head.id);
}

// function

module.exports = Queue;
