#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { Command } from 'commander';

import { fetchJobs } from './src/api.js';
import {
  renderFooter,
  renderHeader,
  renderJobDetails,
  renderJobsTable,
  renderStats,
} from './src/format.js';
import { openInBrowser } from './src/open-url.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

const MAX_LIMIT = 200;

function addFilterOptions(cmd) {
  return cmd
    .option('-c, --category <category>', 'filter by category (e.g. Engineering, Research)')
    .option('--city <city>', 'filter by city / location')
    .option('--region <region>', 'filter by region (e.g. US, Europe, Asia-Pacific)')
    .option('--company <company>', 'filter by company name')
    .option('-l, --level <level>', 'filter by seniority level (e.g. Mid, Senior, Lead+)')
    .option('--remote', 'only show remote jobs')
    .option('--salary-min <k>', 'minimum salary in $K', (v) => parseInt(v, 10))
    .option('-q, --search <text>', 'free text search (title, company, etc.)');
}

function buildFilters(opts, { limit, offset } = {}) {
  const filters = {
    category: opts.category,
    city: opts.city,
    region: opts.region,
    company: opts.company,
    level: opts.level,
    remote: opts.remote ? 'true' : undefined,
    salary_min: opts.salaryMin,
    q: opts.search,
  };
  if (limit !== undefined) filters.limit = limit;
  if (offset !== undefined) filters.offset = offset;
  return filters;
}

const program = new Command();

program
  .name('aijobs')
  .description('Search live AI jobs from artificialintelligencejobs.co, right from your terminal')
  .version(pkg.version);

addFilterOptions(program)
  .option('-n, --limit <n>', `number of jobs to fetch (max ${MAX_LIMIT})`, (v) => parseInt(v, 10), 25)
  .option('--offset <n>', 'pagination offset', (v) => parseInt(v, 10), 0)
  .option('--wide', 'show extra columns (category, region)')
  .option('--json', 'print the raw API response as JSON')
  .option('--no-color', 'disable colored output')
  .option('-d, --details <n>', 'show full details for job #n from the results', (v) => parseInt(v, 10))
  .option('-o, --open <n>', "open job #n's apply link in your browser", (v) => parseInt(v, 10))
  .addHelpText(
    'after',
    `
Examples:
  $ aijobs
  $ aijobs --category Engineering --city London --limit 10
  $ aijobs --remote --salary-min 200
  $ aijobs --search llm --level Senior
  $ aijobs --details 3
  $ aijobs --open 1
  $ aijobs --json --limit 50 > jobs.json
  $ aijobs stats --category Research`
  )
  .action(async (opts) => {
    await runList(opts);
  });

addFilterOptions(
  program.command('stats').description('Show a breakdown of live jobs by category, level, region and remote status')
).action(async (opts) => {
  await runStats(opts);
});

async function runList(opts) {
  if (!opts.color) chalk.level = 0;

  const limit = Math.min(Math.max(opts.limit || 25, 1), MAX_LIMIT);
  const offset = Math.max(opts.offset || 0, 0);
  const filters = buildFilters(opts, { limit, offset });

  let result;
  try {
    result = await fetchJobs(filters);
  } catch (err) {
    console.error(chalk.red(`✖ ${err.message}`));
    process.exitCode = 1;
    return;
  }

  const { data } = result;
  const jobs = data.jobs || [];

  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (jobs.length === 0) {
    console.log(chalk.yellow('No jobs matched your filters.'));
    return;
  }

  if (opts.details !== undefined) {
    const job = jobs[opts.details - 1];
    if (!job) {
      console.error(chalk.red(`No job at #${opts.details}. This page has ${jobs.length} jobs (1-${jobs.length}).`));
      process.exitCode = 1;
      return;
    }
    console.log(renderJobDetails(job, opts.details));
  } else {
    console.log(renderHeader(data, filters));
    console.log('');
    console.log(renderJobsTable(jobs, { wide: opts.wide }).toString());
    const footer = renderFooter(jobs, filters, data.matched);
    if (footer) console.log(footer);
  }

  if (opts.open !== undefined) {
    const job = jobs[opts.open - 1];
    if (!job) {
      console.error(chalk.red(`No job at #${opts.open} to open. This page has ${jobs.length} jobs (1-${jobs.length}).`));
      process.exitCode = 1;
      return;
    }
    const target = job.apply_url || job.url;
    console.log('');
    console.log(chalk.cyan(`Opening ${target} …`));
    await openInBrowser(target);
  }
}

async function runStats(opts) {
  if (!opts.color) chalk.level = 0;

  const filters = buildFilters(opts, { limit: MAX_LIMIT, offset: 0 });

  let result;
  try {
    result = await fetchJobs(filters);
  } catch (err) {
    console.error(chalk.red(`✖ ${err.message}`));
    process.exitCode = 1;
    return;
  }

  const { data } = result;
  if (!data.jobs || data.jobs.length === 0) {
    console.log(chalk.yellow('No jobs matched your filters.'));
    return;
  }

  console.log(renderStats(data, MAX_LIMIT));
}

program.parseAsync(process.argv);
