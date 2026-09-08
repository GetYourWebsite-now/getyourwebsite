/**
 * Fails when the /demo sandbox has fallen behind the real client portal.
 *
 *   node tools/portal-sync.mjs        (npm run verify:portal)
 *
 * The demo exists to prove we are credible, so a demo showing a portal we no
 * longer ship is worse than no demo. It has drifted three times, each time
 * caught by a person noticing rather than by anything failing. This turns "did
 * anyone check?" into a build step.
 *
 * src/data/portal-sync.json records the client/ commit the sandbox was last
 * built against. This counts how many commits have touched client/ on
 * `development` since then.
 *
 * Uses git rather than the GitHub API on purpose: the admin repo is private, so
 * an unauthenticated API call just returns 404 and would look identical to
 * "everything is fine". Whoever is running this already has git access to the
 * repo, so git is the thing that works without handing anyone a token.
 *
 * Being unable to reach the repo does NOT fail the check — offline is not
 * evidence of drift, and a suite that breaks on a flaky network teaches people
 * to ignore it. Proven drift fails; an unreachable repo reports and passes.
 */
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sync = JSON.parse(readFileSync(new URL('../src/data/portal-sync.json', import.meta.url)));
const { repo, branch, path: dir, commit, date } = sync;
const url = `https://github.com/${repo}.git`;

const git = (args, cwd) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

let tmp;
try {
  tmp = mkdtempSync(join(tmpdir(), 'portal-sync-'));
  // blob:none keeps this to commits and trees — we only need history, not the
  // file contents, so it stays quick even as the repo grows.
  git(['clone', '--bare', '--filter=blob:none', '--single-branch', '-b', branch, url, tmp]);
} catch (err) {
  // git writes progress to stderr, so the first line is "Cloning into..." and
  // tells you nothing. Prefer the line that actually says what went wrong.
  const text = String(err.stderr || err.message);
  const why =
    (text.split('\n').find((l) => /^(fatal|error):/i.test(l.trim())) || text.split('\n')[0] || '')
      .trim()
      .slice(0, 140);
  console.log(`\n  ⚠ could not reach ${repo} (${why}) — drift not checked.`);
  console.log(`    The sandbox is recorded against ${commit.slice(0, 9)} (${date}).\n`);
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  process.exit(0);
}

try {
  let behind;
  try {
    behind = Number(git(['rev-list', '--count', `${commit}..${branch}`, '--', dir], tmp));
  } catch {
    console.log(
      `\n  ✗ recorded commit ${commit.slice(0, 9)} is not on ${branch} any more.\n` +
        `    Rebuild the sandbox from the current portal and update\n` +
        `    src/data/portal-sync.json in the same commit.\n`
    );
    process.exit(1);
  }

  if (behind === 0) {
    console.log(`\n  ✓ demo sandbox is current with ${repo}@${branch}:${dir}/ (${commit.slice(0, 9)})\n`);
    process.exit(0);
  }

  const log = git(
    ['log', '--oneline', '--no-decorate', `${commit}..${branch}`, '--', dir],
    tmp
  )
    .split('\n')
    .slice(0, 12)
    .map((l) => `      ${l.slice(0, 76)}`)
    .join('\n');

  console.log(
    `\n  ✗ demo is ${behind} commit${behind === 1 ? '' : 's'} behind the portal — rebuild it.\n\n` +
      `    Since ${commit.slice(0, 9)} (${date}), ${dir}/ has changed in:\n` +
      log +
      `\n\n    Rebuild the sandbox from client/, then update src/data/portal-sync.json\n` +
      `    in the same commit so this passes again.\n`
  );
  process.exit(1);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
