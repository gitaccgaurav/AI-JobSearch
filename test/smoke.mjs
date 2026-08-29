// Offline smoke test: mocks global fetch with a sample API response so the
// CLI can be exercised without hitting the network. Run with `npm test`.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sample = JSON.parse(readFileSync(path.join(__dirname, 'sample.json'), 'utf8'));

let calls = 0;
let failed = false;

globalThis.fetch = async (url) => {
  calls += 1;
  if (!url.startsWith('https://artificialintelligencejobs.co/api/jobs')) {
    failed = true;
    throw new Error(`Unexpected fetch URL: ${url}`);
  }
  return { ok: true, status: 200, statusText: 'OK', json: async () => sample };
};

const originalLog = console.log;
let output = '';
console.log = (...args) => {
  output += `${args.join(' ')}\n`;
  originalLog(...args);
};

process.argv = ['node', 'aijobs', '--category', 'Engineering', '--limit', '5'];
await import('../index.js');

console.log = originalLog;

if (calls !== 1) {
  console.error(`✖ expected exactly 1 fetch call, got ${calls}`);
  process.exit(1);
}
if (failed) {
  console.error('✖ fetch was called with an unexpected URL');
  process.exit(1);
}
if (!output.includes('matched jobs') || !output.includes('Perplexity')) {
  console.error('✖ CLI output did not contain expected content');
  process.exit(1);
}

console.log('\n✓ smoke test passed');
