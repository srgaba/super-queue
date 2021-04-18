const EventEmmiter = require('events').EventEmitter;
const inherits = require('util').inherits;

function Job(cb, id, priority) {
  this.cb = cb;
  this.id = id;
  this.priority = priority;
  this.next = null;
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

function add(cb, id = null, priority = 0) {
  this.queue++;
  const job = new Job(cb, id || this.queue, priority);
  if (!this.head) {
    this.pending = true;
    this.head = job;
    this.tail = job;
    let cachePendding = this.queue;
    const checker = setInterval(() => {
      if (cachePendding === this.queue) {
        clearInterval(checker);
        this.exec();
      } else {
        cachePendding = this.queue;
      }
    }, 1);
  } else if (priority > 0) {
    let currentJob = this.head;
    let lastJob;
    while (currentJob && priority < currentJob.priority) {
      lastJob = currentJob;
      currentJob = currentJob.next;
    }
    job.next = currentJob;
    if (lastJob) {
      lastJob.next = job;
    } else {
      job.next = currentJob;
      this.head = job;
    }
  } else {
    this.tail.next = job;
    this.tail = job;
  }
}

function exec() {
  const job = this.head;
  this.pending = true;
  if (Array.isArray(job.cb)) {
    return Promise.all(job.cb.map((fc) => fc()))
      .then(() => {
        this.next(job);
      })
      .catch((err) => this.next(job, err));
  }
  try {
    const exec = job.cb();
    if (exec instanceof Promise) {
      exec
        .then(() => {
          this.next(job);
        })
        .catch((err) => this.next(job, err));
    } else {
      this.next(job);
    }
  } catch (err) {
    this.next(job, err);
  }
}

function next(job, err) {
  this.pending = false;
  if (err) this.emit('error', err, job.id);
  else this.emit('success', job.id);
  this.queue--;
  if (!this.head.next) {
    this.head = null;
    this.tail = null;
    this.emit('finish');
    return;
  }
  this.head = this.head.next;
  if (this.stopped) return;
  if (this.options.interval) {
    setTimeout(() => this.exec(), this.options.interval);
  } else {
    this.exec();
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
