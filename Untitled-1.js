// Test with 1,000,000 elements
const size = 1000000;
const arr = Array.from({length: size}, (_, i) => i);
const set = new Set(arr);

// Set lookup - very fast (~0.1ms)
console.time('set-lookup');
set.has(999999);
console.timeEnd('set-lookup');

// Array includes - much slower (~5-10ms)
console.time('array-includes');
arr.includes(999999);
console.timeEnd('array-includes');

// Array index access - very fast (~0.01ms)
console.time('array-index');
arr[999999];
console.timeEnd('array-index');