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

const generateMarkdown = extractFunction(indexContent, 'generateMarkdown');

// --- MOCK DATA ---

function generateData(fileCount, msgsPerFile) {
    const parsedData = [];
    for (let i = 0; i < fileCount; i++) {
        const conversation = [];
        for (let j = 0; j < msgsPerFile; j++) {
            conversation.push({
                role: j % 2 === 0 ? 'User' : 'Model',
                content: "This is some sample content for the message. ".repeat(2),
                thoughts: "Thinking about the answer...\nStep 1: Analyze\nStep 2: Solve",
                hasThoughts: true
            });
        }
        parsedData.push({ name: `file_${i}.json`, conversation, error: false });
    }
    return parsedData;
}

// Legacy (Template Literal Pushes)
function generateMarkdown_Legacy(parsedData, includeThoughts) {
    const parts = [];

    parsedData.forEach(({ name, conversation, error }) => {
        if (error) {
            parts.push(`> ⚠️ Error parsing file: ${name}\n\n`);
            return;
        }

        parts.push(`# Source: ${name}\n\n`);

        conversation.forEach(msg => {
            const roleIcon = msg.role === 'User' ? '👤' : '🤖';

            if (includeThoughts && msg.hasThoughts) {
                const indentedThoughts = '> ' + msg.thoughts.replace(/\n/g, '\n> ');
                parts.push('> **🧠 Thinking Process**\n> \n', indentedThoughts, '\n\n');
            }

            parts.push('## ', roleIcon, ' ', msg.role, '\n\n', msg.content, '\n\n---\n\n');
        });
    });

    return parts.join('');
}

function runBenchmark() {
    console.log("Generating Data (50,000 files, 5 msgs/file)...");
    const parsedData = generateData(50000, 5);
    const includeThoughts = true;
    console.log("Data Generated.");

    // Warmup
    generateMarkdown_Legacy(parsedData.slice(0, 100), includeThoughts);
    generateMarkdown(parsedData.slice(0, 100), includeThoughts);

    // Measure Legacy
    try {
        const startLegacy = performance.now();
        generateMarkdown_Legacy(parsedData, includeThoughts);
        const endLegacy = performance.now();
        console.log(`Legacy (Template Literal): ${(endLegacy - startLegacy).toFixed(2)}ms`);
    } catch (e) {
        console.log(`Legacy Failed: ${e.message}`);
    }

    // Measure Current
    try {
        const startCurrent = performance.now();
        generateMarkdown(parsedData, includeThoughts);
        const endCurrent = performance.now();
        console.log(`Current (Production):      ${(endCurrent - startCurrent).toFixed(2)}ms`);
    } catch (e) {
        console.log(`Current Failed: ${e.message}`);
    }
}

runBenchmark();
