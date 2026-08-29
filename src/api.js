const BASE_URL = 'https://artificialintelligencejobs.co/api/jobs';

/**
 * Build a query string from a filters object, skipping empty/undefined values.
 */
function buildQuery(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || Number.isNaN(value)) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Fetch jobs from the artificialintelligencejobs.co public API.
 *
 * Supported filters (all optional, combinable): category, city, region,
 * company, level, remote ("true"), salary_min (in $K), q (free text),
 * limit (max 200), offset.
 *
 * @param {object} filters
 * @returns {Promise<{ url: string, data: { total_live: number, matched: number, jobs: object[] } }>}
 */
export async function fetchJobs(filters = {}) {
  const url = BASE_URL + buildQuery(filters);

  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new Error(`Could not reach the API — check your internet connection. (${err.message})`);
  }

  if (!res.ok) {
    throw new Error(`API responded with ${res.status} ${res.statusText}`);
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error(`API returned a response that could not be parsed as JSON. (${err.message})`);
  }

  return { url, data };
}
