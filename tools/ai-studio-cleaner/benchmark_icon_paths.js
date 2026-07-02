const { performance } = require('perf_hooks');

// Simulating React VDOM nodes
const createElement = (type, props, ...children) => {
    const finalProps = { ...props };
    if (children.length > 0) {
        finalProps.children = children.length === 1 ? children[0] : children;
    }
    return { type, props: finalProps };
};
const Fragment = 'React.Fragment';

function runBenchmark() {
    const iterations = 5_000_000;
    console.log(`Running ${iterations} iterations...`);

    // --- SETUP ---

    // Case 1: Legacy (Multi-Node Static)
    // <><path.../><path.../><path.../><line.../><line.../></>
    const LEGACY_PATH = createElement(Fragment, null,
        createElement('path', { d: "M3 6h18" }),
        createElement('path', { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
        createElement('path', { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }),
        createElement('line', { x1: "10", y1: "11", x2: "10", y2: "17" }),
        createElement('line', { x1: "14", y1: "11", x2: "14", y2: "17" })
    );
    // Legacy Icon: <svg>{children}</svg>
    const LegacyIcon = () => createElement('svg', null, LEGACY_PATH);

    // Case 2: Current (Single-Path Static JSX)
    // Merged d attribute
    const MERGED_D = "M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6";
    // Current Icon: <svg>{children}</svg>
    const STATIC_SINGLE_PATH = createElement('path', { d: MERGED_D });
    const CurrentIcon = () => createElement('svg', null, STATIC_SINGLE_PATH);


    // --- BENCHMARK ---
    const traverse = (node) => {
        if (!node || typeof node !== 'object') return;
        const _type = node.type;
        const _props = node.props;
        if (node.props && node.props.children) {
            const children = node.props.children;
            if (Array.isArray(children)) {
                children.forEach(traverse);
            } else {
                traverse(children);
            }
        }
    };

    // Warmup
    for (let i = 0; i < 1000; i++) {
        traverse(LegacyIcon());
        traverse(CurrentIcon());
    }

    const startLegacy = performance.now();
    for (let i = 0; i < iterations; i++) { traverse(LegacyIcon()); }
    const timeLegacy = performance.now() - startLegacy;

    const startCurrent = performance.now();
    for (let i = 0; i < iterations; i++) { traverse(CurrentIcon()); }
    const timeCurrent = performance.now() - startCurrent;

    console.log(`\n--- VDOM Traversal Benchmark ---`);
    console.log(`Legacy (Multi-Node Static): ${timeLegacy.toFixed(2)}ms`);
    console.log(`Current (Single-Path Static): ${timeCurrent.toFixed(2)}ms`);
    console.log(`Improvement:                  ${(timeLegacy / timeCurrent).toFixed(2)}x faster`);
}

runBenchmark();
