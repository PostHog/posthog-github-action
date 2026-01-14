# PostHog GitHub Action

Capture CI/CD metrics in PostHog - track workflow duration, success/failure rates, and analyze performance trends with PostHog's full analytics toolkit.

## Quick Start

```yaml
jobs:
  tests:
    # ... your test job

  ci-metrics:
    needs: [tests]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: PostHog/posthog-github-action@v1
        with:
          posthog-token: ${{ secrets.POSTHOG_API_KEY }}
          event: 'ci-metrics'
          capture-run-duration: true
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status-job: 'tests'
```

This captures run duration, pass/fail status, and GitHub context (repo, branch, commit, actor).

## Why PostHog for CI Metrics?

- **Trends & insights** - duration over time, failure rates by branch/author
- **Dashboards** - build CI health dashboards alongside product metrics
- **Alerts** - get notified when builds slow down or failure rates spike
- **Correlation** - connect CI data with your product analytics

## Inputs

### `posthog-token`

**Required** Your write-only PostHog API Token (Project API Key).

### `posthog-api-host`

Your PostHog API Host.

Defaults to `https://us.i.posthog.com`

### `event`

**Required** The event name to send to PostHog.

Defaults to `event-from-github-actions`

### `properties`

Optional properties to add to the event. These should be passed as a string containing a JSON object.

The action runs `JSON.parse(properties)` on the input.

### `capture-run-duration`

Set to `true` to capture run duration via GitHub API. Adds `duration_seconds` and run metadata.

### `capture-job-durations`

Set to `true` to capture timing and status for each job in the workflow. Emits one additional event per completed job (named `{event}-job`, e.g., `ci-metrics-job`). All events share the same `workflow_run` group for correlation in PostHog.

### `github-token`

GitHub token for API access. Required when `capture-run-duration`, `capture-job-durations`, or `status-job` is set.

### `runner`

Optional runner label to include in properties (e.g., `'depot'`).

### `status-job`

Job name to check for workflow status. Captures that job's conclusion (`success`, `failure`, `cancelled`) as `conclusion`.

Note: Your metrics job must `needs` the target job and use `if: always()` to run even on failure.

## Automatically Included Properties

The following GitHub context properties are automatically added to every event:

- `sha` - The commit SHA
- `ref` - The branch or tag ref
- `workflow` - The workflow name
- `runNumber` - The run number
- `runId` - The run ID
- `repository` - The repository name
- `repositoryOwner` - The repository owner
- `actor` - The user who triggered the workflow
- `eventName` - The event that triggered the workflow

When `capture-run-duration` is enabled:

- `duration_seconds` - Time elapsed since run started
- `url` - URL to the run
- `attempt` - The attempt number
- `started_at` - ISO 8601 timestamp

When `status-job` is set:

- `conclusion` - Referenced job's conclusion (`success`, `failure`, `cancelled`)

When `capture-job-durations` is enabled, each per-job event (`{event}-job`) includes:

- `name` - The job's display name
- `duration_seconds` - Time from job start to completion
- `conclusion` - Job result (`success`, `failure`, `cancelled`, `skipped`)
- `started_at` - ISO 8601 timestamp
- `completed_at` - ISO 8601 timestamp
- `runner` - The runner that executed the job

## Groups & Correlation

All events are tagged with a `workflow_run` group (`owner/repo/run_id`) for correlation in PostHog.

When `capture-job-durations` is enabled, group properties are also set via `groupIdentify`:

```
workflow_run: PostHog/posthog/12345
├── group properties: { conclusion: 'success' }     ← only with capture-job-durations
│
├── event: ci-metrics                               ← run-level metrics
│   └── { duration_seconds: 1080, conclusion: 'success', ... }
│
├── event: ci-metrics-job                           ← per-job metrics
│   └── { name: 'Build', duration_seconds: 120, conclusion: 'success', ... }
│
└── event: ci-metrics-job
    └── { name: 'Test', duration_seconds: 300, conclusion: 'success', ... }
```

This enables:
- **Filter job events by workflow outcome** - use group property `workflow_run.conclusion`
- **See all jobs in a run** - filter by `workflow_run = owner/repo/run_id`
- **Correlate across events** - breakdown by group in insights

## Example Usage

### Custom event with properties

```yaml
- uses: PostHog/posthog-github-action@v1
  with:
    posthog-token: ${{ secrets.POSTHOG_API_KEY }}
    event: "deploy-completed"
    properties: '{"environment": "production"}'
```

### With run duration

```yaml
- uses: PostHog/posthog-github-action@v1
  with:
    posthog-token: ${{ secrets.POSTHOG_API_KEY }}
    event: "ci-metrics"
    capture-run-duration: true
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### With per-job metrics

```yaml
- uses: PostHog/posthog-github-action@v1
  with:
    posthog-token: ${{ secrets.POSTHOG_API_KEY }}
    event: "ci-metrics"
    capture-run-duration: true
    capture-job-durations: true
    github-token: ${{ secrets.GITHUB_TOKEN }}
    status-job: 'Tests'
```

### Using with EU Cloud

```yaml
- uses: PostHog/posthog-github-action@v1
  with:
    posthog-token: ${{ secrets.POSTHOG_API_KEY }}
    posthog-api-host: "https://eu.i.posthog.com"
    event: "ci-metrics"
    capture-run-duration: true
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Complete Workflow Example

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test

  ci-metrics:
    needs: [test]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: PostHog/posthog-github-action@v1
        with:
          posthog-token: ${{ secrets.POSTHOG_API_KEY }}
          event: "ci-metrics"
          capture-run-duration: true
          capture-job-durations: true
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status-job: 'test'
```

## Development

### Prerequisites

- Node.js 20+
- [act](https://github.com/nektos/act) for local testing (requires Docker)

### Setup

```bash
# Install dependencies
npm install

# Copy secrets template and add your PostHog API token
cp .secrets.example .secrets
```

### Building

This action uses [`@vercel/ncc`](https://github.com/vercel/ncc) to bundle all dependencies into a single file. **You must rebuild before committing changes:**

```bash
npm run build
```

This compiles `index.js` and all dependencies into `dist/index.js`.

### Testing Locally

Test the action locally using `act`:

```bash
# Dry run (validates workflow without running)
npm run test:dry-run

# Full test (sends real event to PostHog)
npm test
```

Note: `act` requires Docker to be running.

## Releasing

### 1. Build the Bundle

Always rebuild before releasing to ensure the dist folder is up to date:

```bash
npm run build
```

### 2. Commit and Merge

```bash
# Update version in package.json manually
git add package.json dist/
git commit -m "1.x.x"
# Create PR and merge to main
```

### 3. Tag the Release

```bash
git checkout main && git pull
git tag v1.x.x
git push origin v1.x.x
```

The release workflow creates the GitHub Release and updates the `v1` tag automatically.

## License

MIT
