import { exec } from 'node:child_process';

/**
 * Open a URL in the user's default browser, cross-platform, without
 * pulling in an extra dependency.
 */
export function openInBrowser(url) {
  return new Promise((resolve) => {
    const safeUrl = String(url).replace(/"/g, '');
    const platform = process.platform;

    let cmd;
    if (platform === 'darwin') cmd = `open "${safeUrl}"`;
    else if (platform === 'win32') cmd = `start "" "${safeUrl}"`;
    else cmd = `xdg-open "${safeUrl}"`;

    exec(cmd, (err) => {
      if (err) {
        console.error(`Could not open a browser automatically. Visit this link instead:\n${safeUrl}`);
      }
      resolve();
    });
  });
}
