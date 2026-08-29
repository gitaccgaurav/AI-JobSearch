import chalk from 'chalk';
import Table from 'cli-table3';

export function truncate(str, max) {
  if (!str) return '';
  const s = String(str);
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/**
 * Turn an ISO-ish "YYYY-MM-DD" posted date into a short relative label.
 * Falls back to the raw string if it can't be parsed.
 */
export function relativePosted(dateStr) {
  if (!dateStr) return '—';
  const posted = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(posted.getTime())) return dateStr;

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const diffDays = Math.round((today - posted) / 86400000);

  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 14) return `${diffDays}d ago`;
  if (diffDays < 60) return `${Math.round(diffDays / 7)}w ago`;
  return dateStr;
}

export function renderJobsTable(jobs, { wide = false } = {}) {
  const head = ['#', 'Title', 'Company', 'Location', 'Remote', 'Level', 'Salary', 'Posted'];
  const colWidths = [4, 30, 18, 18, 8, 8, 18, 10];

  if (wide) {
    head.splice(6, 0, 'Category', 'Region');
    colWidths.splice(6, 0, 14, 12);
  }

  const table = new Table({
    head: head.map((h) => chalk.bold.cyan(h)),
    colWidths,
    wordWrap: true,
    wrapOnWordBoundary: true,
  });

  jobs.forEach((job, i) => {
    const remote = job.remote ? chalk.green('Yes') : chalk.gray('No');
    const row = [
      i + 1,
      job.title || '—',
      job.company || '—',
      job.location || '—',
      remote,
      job.level || '—',
      job.salary || chalk.gray('—'),
      relativePosted(job.posted),
    ];
    if (wide) row.splice(6, 0, job.category || '—', job.region || '—');
    table.push(row);
  });

  return table;
}

export function renderJobDetails(job, index) {
  const lines = [];
  lines.push(chalk.bold.cyan(`#${index}  ${job.title || 'Untitled role'}`));
  lines.push(chalk.bold(job.company || 'Unknown company'));
  lines.push('');

  const field = (label, value) => {
    lines.push(`${chalk.gray(label.padEnd(10))} ${value ?? chalk.gray('—')}`);
  };

  field('Location', job.location);
  field('Remote', job.remote ? chalk.green('Yes') : chalk.gray('No'));
  field('Category', job.category);
  field('Level', job.level);
  field('Region', job.region);
  field('Salary', job.salary || chalk.gray('Not disclosed'));
  field('Posted', job.posted ? `${job.posted} (${relativePosted(job.posted)})` : undefined);
  lines.push('');
  field('Listing', job.url);
  field('Apply', job.apply_url || job.url ? chalk.underline(job.apply_url || job.url) : undefined);

  return lines.join('\n');
}

function countBy(jobs, key) {
  const map = new Map();
  for (const job of jobs) {
    const value = job[key] || 'Unknown';
    map.set(value, (map.get(value) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function renderBarSection(title, entries) {
  const barWidth = 22;
  const max = Math.max(...entries.map(([, n]) => n), 1);
  const lines = entries.map(([label, n]) => {
    const filled = Math.max(1, Math.round((n / max) * barWidth));
    return `  ${chalk.gray(truncate(label, 18).padEnd(18))} ${chalk.cyan('█'.repeat(filled))} ${n}`;
  });
  return [chalk.bold(title), ...lines].join('\n');
}

export function renderStats(data, sampleSize) {
  const jobs = data.jobs || [];
  const remoteCount = jobs.filter((j) => j.remote).length;

  const parts = [
    chalk.bold(`Breakdown of ${jobs.length} sampled jobs`) +
      chalk.gray(` (matched ${data.matched} of ${data.total_live} live jobs — stats reflect a ${sampleSize}-job sample, not the full match set)`),
    '',
    renderBarSection('By category', countBy(jobs, 'category')),
    '',
    renderBarSection('By level', countBy(jobs, 'level')),
    '',
    renderBarSection('By region', countBy(jobs, 'region')),
    '',
    `${chalk.bold('Remote'.padEnd(20))} ${remoteCount} / ${jobs.length}`,
  ];

  return parts.join('\n');
}

export function renderHeader(data, filters) {
  const shown = data.jobs ? data.jobs.length : 0;
  const from = (filters.offset || 0) + 1;
  const to = (filters.offset || 0) + shown;

  const activeFilters = Object.entries(filters)
    .filter(([k, v]) => !['limit', 'offset'].includes(k) && v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

  const lines = [
    chalk.bold(`Showing ${shown ? `${from}-${to}` : '0'} of `) +
      chalk.bold.cyan(`${data.matched}`) +
      chalk.bold(` matched jobs `) +
      chalk.gray(`(${data.total_live} live in total)`),
  ];
  if (activeFilters) lines.push(chalk.gray(`Filters: ${activeFilters}`));

  return lines.join('\n');
}

export function renderFooter(jobs, filters, matched) {
  if (!jobs.length) return '';
  const nextOffset = (filters.offset || 0) + jobs.length;
  const tips = ['Tip: --details <n> for full info, --open <n> to open the apply link.'];
  if (typeof matched === 'number' && nextOffset < matched) {
    tips.push(`Next page: --offset ${nextOffset}`);
  }
  return chalk.dim(tips.join('  '));
}
