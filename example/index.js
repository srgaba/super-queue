import Queue from '../index.js';

const queue = new Queue();

queue.add(async () => {
  console.log('Queue Promise<<<<<<<<<<<<');
  await (() =>
    new Promise((resolve, reject) => {
      setTimeout(() => resolve(null), 7000);
    }))();
  console.log('Queue Promise Finished');
});
queue.stop();
queue.add(() => {
  console.log('Queue Looping1');
  for (let i = 0; i < 1000000000; i++) {}
  console.log('Queue Looping1 Finished');
});
console.log(queue.stopped);
queue.add(() => {
  console.log('Queue Looping2');
  for (let i = 0; i < 1000000000; i++) {}
  console.log('Queue Looping2 Finished');
});
queue.add(() => {
  console.log('Queue Looping3');
  for (let i = 0; i < 1000000000; i++) {}
  console.log('Queue Looping3 Finished');
});
queue.start();

// queue.on('success', (args) => {
//   console.log(args);
// });

// queue.on('error', (error, id) => {
//   console.log(error, id);
// });

// queue.start();
