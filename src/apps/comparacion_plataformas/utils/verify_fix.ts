
import { formatearValor } from './formatters';

const testCases = [
    { input: "ARMENIA 14", expected: "ARMENIA 14" },
    { input: "1000", expected: "$ 1.000" }, // Note: non-breaking space might be used by currency formatter
    { input: 1000, expected: "$ 1.000" },
    { input: "Note 5", expected: "Note 5" },
    { input: "12345", expected: "$ 12.345" },
    { input: "2025-01-29", expected: "2025-01-29" }, // Should be handled by date logic
];

console.log("Running Tests...");
testCases.forEach(({ input, expected }) => {
    const result = formatearValor(input);
    // Normalize spaces to handle potential non-breaking spaces in currency format
    const normalizedResult = result.replace(/\s/g, ' ');
    const normalizedExpected = expected.replace(/\s/g, ' ');

    if (normalizedResult === normalizedExpected) {
        console.log(`[PASS] Input: "${input}" -> Output: "${result}"`);
    } else {
        // Allow for some flexibility in currency formatting (symbol placement etc) if it's clearly a number
        // but for "ARMENIA 14" it MUST match exact string
        if (typeof input === 'string' && /[a-zA-Z]/.test(input) && result === input) {
            console.log(`[PASS] Input: "${input}" -> Output: "${result}"`);
        } else {
            console.log(`[FAIL] Input: "${input}"`);
            console.log(`       Expected: "${expected}"`);
            console.log(`       Actual:   "${result}"`);
        }
    }
});
