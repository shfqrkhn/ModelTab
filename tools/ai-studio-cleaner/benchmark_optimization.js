const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const indexPath = path.join(__dirname, 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

// --- DYNAMIC EXTRACTION ---

function extractFunction(source, funcName) {
    const startMarker = `const ${funcName} =`;
    const startIndex = source.indexOf(startMarker);
    if (startIndex === -1) throw new Error(`Could not find start of ${funcName}`);

    let braceCount = 0;
    let bodyStartIndex = -1;
    let bodyEndIndex = -1;
    let foundStart = false;

    // Scan forward to find the opening brace
    for (let i = startIndex; i < source.length; i++) {
        if (source[i] === '{') {
            if (!foundStart) {
                bodyStartIndex = i;
                foundStart = true;
            }
            braceCount++;
        } else if (source[i] === '}') {
            braceCount--;
            if (foundStart && braceCount === 0) {
                bodyEndIndex = i;
                break;
            }
        }
    }

    if (bodyStartIndex === -1 || bodyEndIndex === -1) {
        throw new Error(`Could not extract body of ${funcName}`);
    }

    // Extract arguments
    const declLine = source.substring(startIndex, bodyStartIndex);
    const argsMatch = declLine.match(/\(([^)]*)\)/);
    const args = argsMatch ? argsMatch[1].split(',').map(a => a.trim()) : [];

    const body = source.substring(bodyStartIndex + 1, bodyEndIndex);
    return new Function(...args, body);
}

const parseAIStudioJSON = extractFunction(indexContent, 'parseAIStudioJSON');

// --- BENCHMARK LOGIC ---

// Legacy Implementation (forEach based, from previous benchmark)
const parseAIStudioJSON_Legacy = (json) => {
    try {
        const data = JSON.parse(json);
        let conversation = [];

        const chunks = data.chunkedPrompt?.chunks || data.chunks || [];

        if (chunks) {
             chunks.forEach((chunk) => {
                const role = chunk.role === 'model' ? 'Model' : 'User';
                let thoughts = [];
                let contentParts = [];

                if (chunk.parts && Array.isArray(chunk.parts) && chunk.parts.length > 0) {
                    chunk.parts.forEach(part => {
                        if (part.thought || part.isThought) {
                            thoughts.push(part.text);
                        } else if (part.text) {
                            contentParts.push(part.text);
                        }
                    });
                } else if (chunk.text) {
                    contentParts.push(chunk.text);
                }

                const content = contentParts.join('');

                if (content.trim() || thoughts.length > 0) {
                    conversation.push({
                        role,
                        content: content.trim(),
                        thoughts: thoughts.join('\n\n'),
                        hasThoughts: thoughts.length > 0
                    });
                }
            });
        }
        return conversation;
    } catch (e) {
        return null;
    }
};

function generateLargeData() {
    const chunks = [];
    // 1 chunk, 1,000,000 parts to stress test
    const largeText = "A";
    for (let i = 0; i < 1; i++) {
        const parts = [];
        for (let j = 0; j < 1000000; j++) {
            parts.push({ text: `Part ${j} ${largeText}` });
        }
        chunks.push({
            role: i % 2 === 0 ? 'user' : 'model',
            parts: parts
        });
    }
    return JSON.stringify({ chunks });
}

function runBenchmark() {
    console.log("Generating data...");
    const jsonData = generateLargeData();
    console.log("Data generated. Size: " + (jsonData.length / 1024 / 1024).toFixed(2) + " MB");

    // Warmup
    try {
        parseAIStudioJSON_Legacy(jsonData);
        parseAIStudioJSON(jsonData);
    } catch (e) {
        // Ignore warmup errors
    }

    console.log("Running Legacy (forEach)...");
    const startLegacy = performance.now();
    const resultLegacy = parseAIStudioJSON_Legacy(jsonData);
    const endLegacy = performance.now();
    const timeLegacy = endLegacy - startLegacy;
    console.log(`Legacy Time: ${timeLegacy.toFixed(2)}ms`);

    console.log("Running Current (Production)...");
    const startCurrent = performance.now();
    const resultCurrent = parseAIStudioJSON(jsonData);
    const endCurrent = performance.now();
    const timeCurrent = endCurrent - startCurrent;
    console.log(`Current Time: ${timeCurrent.toFixed(2)}ms`);

    console.log(`Improvement: ${(timeLegacy / timeCurrent).toFixed(2)}x speedup`);
}

runBenchmark();
