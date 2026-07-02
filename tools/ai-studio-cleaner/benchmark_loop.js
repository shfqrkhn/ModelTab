const { performance } = require('perf_hooks');

const data = [];
for (let i = 0; i < 100000; i++) {
    data.push({ id: i, value: "test" });
}

function runForEach() {
    let count = 0;
    data.forEach(item => {
        count += item.id;
    });
    return count;
}

function runForOf() {
    let count = 0;
    for (const item of data) {
        count += item.id;
    }
    return count;
}

function runBenchmark() {
    const iterations = 1000;

    // Warmup
    runForEach();
    runForOf();

    const startForEach = performance.now();
    for (let i = 0; i < iterations; i++) {
        runForEach();
    }
    const endForEach = performance.now();
    const timeForEach = endForEach - startForEach;

    const startForOf = performance.now();
    for (let i = 0; i < iterations; i++) {
        runForOf();
    }
    const endForOf = performance.now();
    const timeForOf = endForOf - startForOf;

    console.log(`forEach: ${timeForEach.toFixed(2)}ms`);
    console.log(`for..of: ${timeForOf.toFixed(2)}ms`);
    console.log(`Improvement: ${(timeForEach / timeForOf).toFixed(2)}x`);
}

runBenchmark();
