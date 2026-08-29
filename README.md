# AI-JobSearch
A CLI tool for searching live AI/ML job listing from 260+ companie's own carrer pages, with salary, location and remote filters.

# aijobs-cli

A Node.js command-line app for searching live AI jobs from the free, no-key
public API at [artificialintelligencejobs.co](https://artificialintelligencejobs.co/developers):

```
GET https://artificialintelligencejobs.co/api/jobs
```

## Requirements

- Node.js 18+ (uses the built-in global `fetch`)

## Install

```bash
npm install
```

Optionally link it as a global command:

```bash
npm link
aijobs --help
```

Or just run it directly with Node:

```bash
node index.js --help
```

## Usage

```bash
# Latest 25 jobs
aijobs

# Server-side filters (all optional, combinable)
aijobs --category Engineering --city London --limit 10
aijobs --remote --salary-min 200
aijobs --search llm --level Senior
aijobs --company Anthropic --region "Asia-Pacific"

# Show extra columns
aijobs --wide

# Full details for job #3 in the current results
aijobs --details 3

# Open job #1's apply link in your default browser
aijobs --open 1

# Raw JSON, e.g. for piping into jq
aijobs --json --limit 50 | jq '.jobs[].company'

# Pagination
aijobs --limit 25 --offset 25

# Breakdown of category / level / region / remote share
aijobs stats
aijobs stats --category Research

# Disable colored output (e.g. when piping to a file)
aijobs --no-color > jobs.txt
```

### Options

| Flag | Description |
| --- | --- |
| `-c, --category <category>` | filter by category (e.g. `Engineering`, `Research`) |
| `--city <city>` | filter by city / location |
| `--region <region>` | filter by region (e.g. `US`, `Europe`, `Asia-Pacific`) |
| `--company <company>` | filter by company name |
| `-l, --level <level>` | filter by seniority level (e.g. `Mid`, `Senior`, `Lead+`) |
| `--remote` | only show remote jobs |
| `--salary-min <k>` | minimum salary, in $K |
| `-q, --search <text>` | free-text search (title, company, etc.) |
| `-n, --limit <n>` | number of jobs to fetch, max 200 (default 25) |
| `--offset <n>` | pagination offset (default 0) |
| `--wide` | add Category and Region columns to the table |
| `--json` | print the raw API response as JSON instead of a table |
| `--no-color` | disable colored output |
| `-d, --details <n>` | show full details for job #n from the current results |
| `-o, --open <n>` | open job #n's apply link in your default browser |
| `-h, --help` | show help |
| `-V, --version` | show version |

All filters are passed straight through to the API's own query parameters
(`category`, `city`, `region`, `company`, `level`, `remote`, `salary_min`,
`q`, `limit`, `offset`), so filtering happens server-side.

`stats` accepts the same filter flags (`--category`, `--city`, `--region`,
`--company`, `--level`, `--remote`, `--salary-min`, `--search`) and always
samples the largest page the API allows (200 jobs) to build its breakdown.

## Project layout

```
index.js          CLI entry point (commander setup, command actions)
src/api.js         Thin fetch wrapper around the jobs API
src/format.js       Table / details / stats rendering (chalk + cli-table3)
src/open-url.js     Cross-platform "open URL in browser" helper
test/smoke.mjs      Offline smoke test (mocks fetch, no network needed)
test/sample.json    Sample API response used by the smoke test
```

## Testing

An offline smoke test mocks `fetch` with a sample response, so it runs
without hitting the network:

```bash
npm test
```

## Notes

- The API is free and requires no key. Please be a good citizen: cache
  results client-side where reasonable and attribute artificialintelligencejobs.co
  if you build something public with it.
- Full API docs: https://artificialintelligencejobs.co/developers
