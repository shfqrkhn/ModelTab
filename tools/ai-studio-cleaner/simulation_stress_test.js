const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const indexPath = path.join(__dirname, 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

// Extract parseAIStudioJSON body
// We look for the block starting after "const parseAIStudioJSON = (json) => {"
// and ending at the matching "};" before "function App()".
// Since it's hard to match nested braces with simple regex, I'll use a robust extractor or just look for the known markers.
// Given the file structure, it ends before "function App()".

const startMarker = 'const parseAIStudioJSON = (json) => {';
const startIndex = indexContent.indexOf(startMarker);
if (startIndex === -1) {
    console.error("Could not find parseAIStudioJSON function start");
    process.exit(1);
}

// Find the end of the function. It's roughly before "function App()".
// But we need the *body*.
// Let's search for "function App() {" and backup.
const appMarker = 'function App() {';
const appIndex = indexContent.indexOf(appMarker);

// This is risky if there are comments or other code in between.
// Let's try to parse the block by counting braces from the start marker.
let braceCount = 0;
let bodyStartIndex = startIndex + startMarker.length - 1; // pointing to '{'
let bodyEndIndex = -1;

for (let i = bodyStartIndex; i < indexContent.length; i++) {
    if (indexContent[i] === '{') braceCount++;
    else if (indexContent[i] === '}') braceCount--;

    if (braceCount === 0) {
        bodyEndIndex = i;
        break;
    }
}

if (bodyEndIndex === -1) {
    console.error("Could not find end of parseAIStudioJSON");
    process.exit(1);
}

// Extract body (excluding outer braces)
const parseBody = indexContent.substring(bodyStartIndex + 1, bodyEndIndex);
const parseAIStudioJSON = new Function('json', parseBody);

// Extract generateMarkdown body
const genMarker = 'const generateMarkdown = (parsedData, includeThoughts) => {';
const genStartIndex = indexContent.indexOf(genMarker);
if (genStartIndex === -1) {
    console.error("Could not find generateMarkdown function start");
    process.exit(1);
}

let genBodyStartIndex = genStartIndex + genMarker.length - 1; // pointing to '{'
let genBodyEndIndex = -1;
let genBraceCount = 0;

for (let i = genBodyStartIndex; i < indexContent.length; i++) {
    if (indexContent[i] === '{') genBraceCount++;
    else if (indexContent[i] === '}') genBraceCount--;

    if (genBraceCount === 0) {
        genBodyEndIndex = i;
        break;
    }
}

if (genBodyEndIndex === -1) {
    console.error("Could not find end of generateMarkdown");
    process.exit(1);
}

const genBody = indexContent.substring(genBodyStartIndex + 1, genBodyEndIndex);
const generateMarkdown = new Function('parsedData', 'includeThoughts', genBody);


// --- Simulation Utils ---

function generateMockData(months) {
    const chatsPerMonth = 50; // Adjusted for "Intensive" (50 files/month)
    // 120 months = 6000 files.
    // Each file has some conversation.
    const files = [];

    for (let m = 0; m < months; m++) {
        for (let c = 0; c < chatsPerMonth; c++) {
            const chunks = [];
            // A conversation with 10 turns
            for (let t = 0; t < 10; t++) {
                chunks.push({
                    role: t % 2 === 0 ? 'user' : 'model',
                    parts: [{ text: `Message content for month ${m} chat ${c} turn ${t}. ` + "A".repeat(50) }]
                });
            }
            // Add a thought
            chunks.push({
                role: 'model',
                parts: [
                    { text: "Thinking about the simulation...", thought: true },
                    { text: "Final answer." }
                ]
            });

            files.push({
                name: `export_m${m}_c${c}.json`,
                content: JSON.stringify({ chunks })
            });
        }
    }
    return files;
}

function generateLargeFile() {
     const chunks = [];
     for (let i = 0; i < 5000; i++) {
         chunks.push({
             role: i % 2 === 0 ? 'user' : 'model',
             text: `Line ${i}: ` + "B".repeat(100)
         });
     }
     return [{ name: "large_file.json", content: JSON.stringify({ chunks }) }];
}

async function runSimulation() {
    console.log("=== Intensive Use Simulation (24, 60, 120, 240 Months) ===");

    const scenarios = [24, 60, 120, 240];

    for (const months of scenarios) {
        console.log(`\n--- Scenario: ${months} Months ---`);

        console.log("Generating data...");
        const files = generateMockData(months);
        console.log(`Generated ${files.length} files.`);

        const start = performance.now();
        const startMem = process.memoryUsage().heapUsed;

        // 1. Parsing
        const parsedData = [];
        let errorCount = 0;

        files.forEach(file => {
            const conversation = parseAIStudioJSON(file.content);
            if (conversation) {
                parsedData.push({ name: file.name, conversation, error: false });
            } else {
                parsedData.push({ name: file.name, error: true });
                errorCount++;
            }
        });

        const parseTime = performance.now();

        // 2. Generation
        const includeThoughts = true;
        const output = generateMarkdown(parsedData, includeThoughts);

        const end = performance.now();
        const endMem = process.memoryUsage().heapUsed;

        console.log(`Parsing Time: ${(parseTime - start).toFixed(2)}ms`);
        console.log(`Gen Time:     ${(end - parseTime).toFixed(2)}ms`);
        console.log(`Total Time:   ${(end - start).toFixed(2)}ms`);
        console.log(`Memory Delta: ${((endMem - startMem) / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Output Size:  ${(output.length / 1024 / 1024).toFixed(2)} MB`);

        if (errorCount > 0) console.warn(`Errors: ${errorCount}`);
        if (output.length === 0) console.error("FAIL: Output is empty");

        // Force GC if possible to clean up for next run
        if (global.gc) global.gc();
    }

    console.log("\n--- Scenario: Single Large File (Stress Test) ---");
    const largeFile = generateLargeFile();
    const startL = performance.now();
    const parsedL = [];
    largeFile.forEach(file => {
        const conversation = parseAIStudioJSON(file.content);
        parsedL.push({ name: file.name, conversation, error: !conversation });
    });
    const outputL = generateMarkdown(parsedL, true);
    const endL = performance.now();
    console.log(`Large File Time: ${(endL - startL).toFixed(2)}ms`);
    console.log(`Large File Size: ${(outputL.length / 1024 / 1024).toFixed(2)} MB`);

    console.log("\n--- Scenario: Chaos Mode (Bugs & Edge Cases) ---");
    const chaosFiles = [
        { name: "bad_json.json", content: "{ unquoted: key }" },
        { name: "empty.json", content: "" },
        { name: "null.json", content: "null" },
        { name: "no_chunks.json", content: "{}" },
        { name: "empty_chunks.json", content: '{"chunks": []}' },
        { name: "missing_text.json", content: '{"chunks": [{"role": "user"}]}' }, // Missing parts/text
        { name: "null_part.json", content: '{"chunks": [{"role": "model", "parts": [null]}]}' },
        { name: "empty_thought.json", content: '{"chunks": [{"role": "model", "parts": [{"text": "   ", "thought": true}, {"text": "Hello"}]}]}' },
        { name: "zero_text.json", content: '{"chunks": [{"role": "user", "text": 0}, {"role": "model", "parts": [{"text": 0}]}]}' }, // Falsy values (0)
        { name: "wrong_type.json", content: '{"chunks": "not_an_array"}' },
        { name: "mixed_validity.json", content: '{"chunks": [{"role": "user", "text": "ok"}, {"role": "model", "parts": "broken"}]}' },
        { name: "string_thought.json", content: '{"chunks": [{"role": "model", "parts": [{"thought": "String thought content", "text": null}, {"text": "Hello"}]}]}' },
        { name: "zero_thought.json", content: '{"chunks": [{"role": "model", "parts": [{"text": 0, "thought": true}]}]}' }
    ];

    const chaosParsed = [];
    let chaosErrors = 0;
    chaosFiles.forEach(file => {
        try {
            const conversation = parseAIStudioJSON(file.content);
            if (conversation) {
                chaosParsed.push({ name: file.name, conversation, error: false });
            } else {
                chaosParsed.push({ name: file.name, error: true });
                chaosErrors++;
                // console.log(`Expected Error for ${file.name}`);
            }
        } catch (e) {
            console.error(`CRITICAL: Crash on ${file.name}`, e);
        }
    });

    // Run generation on chaos output
    try {
        const chaosOutput = generateMarkdown(chaosParsed, true);
        console.log(`Chaos Output Length: ${chaosOutput.length}`);
        console.log(`Chaos Errors Caught: ${chaosErrors} / ${chaosFiles.length}`);

        // Verify empty thought filtering
        const emptyThoughtRes = chaosParsed.find(p => p.name === "empty_thought.json");
        if (emptyThoughtRes && emptyThoughtRes.conversation && emptyThoughtRes.conversation[0]) {
            if (emptyThoughtRes.conversation[0].hasThoughts === false) {
                console.log("PASS: Empty thought filtered correctly in Chaos Mode.");
            } else {
                console.error("FAIL: Empty thought NOT filtered in Chaos Mode.");
            }
        }

        // Verify zero text preservation
        const zeroRes = chaosParsed.find(p => p.name === "zero_text.json");
        if (zeroRes && zeroRes.conversation && zeroRes.conversation.length === 2) {
             const c1 = zeroRes.conversation[0];
             const c2 = zeroRes.conversation[1];
             if (String(c1.content) === "0" && String(c2.content) === "0") {
                 console.log("PASS: Zero text preserved in Chaos Mode.");
             } else {
                 console.error(`FAIL: Zero text lost in Chaos Mode. Got: '${c1.content}', '${c2.content}'`);
             }
        } else {
             console.error("FAIL: Zero text file not parsed or conversation empty.");
        }

        // Verify string thought preservation
        const stringThoughtRes = chaosParsed.find(p => p.name === "string_thought.json");
        if (stringThoughtRes && stringThoughtRes.conversation && stringThoughtRes.conversation[0]) {
             if (stringThoughtRes.conversation[0].hasThoughts === true && stringThoughtRes.conversation[0].thoughts === "String thought content") {
                 console.log("PASS: String thought preserved in Chaos Mode.");
             } else {
                 console.error(`FAIL: String thought NOT preserved. Got: '${stringThoughtRes.conversation[0].thoughts}'`);
             }
        } else {
             console.error("FAIL: String thought file not parsed.");
        }

        // Verify zero thought preservation
        const zeroThoughtRes = chaosParsed.find(p => p.name === "zero_thought.json");
        if (zeroThoughtRes && zeroThoughtRes.conversation && zeroThoughtRes.conversation[0]) {
             if (zeroThoughtRes.conversation[0].hasThoughts === true && zeroThoughtRes.conversation[0].thoughts === "0") {
                 console.log("PASS: Zero thought preserved in Chaos Mode.");
             } else {
                 console.error(`FAIL: Zero thought NOT preserved. Got: '${zeroThoughtRes.conversation[0].thoughts}'`);
             }
        } else {
             console.error("FAIL: Zero thought file not parsed.");
        }
    } catch (e) {
        console.error("CRITICAL: Crash during generation", e);
    }
}

runSimulation();
