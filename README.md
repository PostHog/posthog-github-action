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
          capture-workflow-duration: 'true'
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status-job: 'tests'
```

This captures workflow duration, pass/fail status, and GitHub context (repo, branch, commit, actor).

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

### `capture-workflow-duration`

Set to `'true'` to capture workflow duration via GitHub API. Adds `duration_seconds` and run metadata.

### `capture-job-durations`

Set to `'true'` to capture timing and status for each job in the workflow. Emits one additional event per completed job (named `{event}-job`, e.g., `ci-metrics-job`). All events share the same `workflow_run` group for correlation in PostHog.

### `github-token`

GitHub token for API access. Required when `capture-workflow-duration`, `capture-job-durations`, or `status-job` is set.

### `runner`

Optional runner label to include in properties (e.g., `'depot'`).

### `status-job`

Job name to check for workflow status. Captures that job's conclusion (`success`, `failure`, `cancelled`) as `workflow_status`.

Note: Your metrics job must `needs` the target job and use `if: always()` to run even on failure.

## Automatically Included Properties

The following GitHub context properties are automatically added to every event:

- `sha` - The commit SHA
- `ref` - The branch or tag ref
- `workflow` - The workflow name
- `job` - The job name
- `runNumber` - The run number
- `runId` - The run ID
- `repository` - The repository name
- `repositoryOwner` - The repository owner
- `actor` - The user who triggered the workflow
- `eventName` - The event that triggered the workflow

When `capture-workflow-duration` is enabled:

- `duration_seconds` - Time elapsed since workflow started
- `run_url` - URL to the workflow run
- `run_attempt` - The attempt number
- `run_id` - The unique run ID
- `run_started_at` - ISO 8601 timestamp

When `status-job` is set:

- `workflow_status` - Referenced job's conclusion (`success`, `failure`, `cancelled`)

When `capture-job-durations` is enabled, each per-job event (`{event}-job`) includes:

- `job_name` - The job's display name
- `job_duration_seconds` - Time from job start to completion
- `job_conclusion` - Job result (`success`, `failure`, `cancelled`, `skipped`)
- `job_started_at` - ISO 8601 timestamp
- `job_completed_at` - ISO 8601 timestamp
- `job_runner` - The runner that executed the job

## Example Usage

```yaml
- uses: PostHog/posthog-github-action@v1
  with:
    posthog-token: ${{ secrets.POSTHOG_API_KEY }}
    event: "deploy-completed"
    properties: '{"environment": "production"}'
```

### Using with EU Cloud

If you're using PostHog EU Cloud, specify the EU host:

```yaml
- uses: PostHog/posthog-github-action@v1
  with:
    posthog-token: ${{ secrets.POSTHOG_API_KEY }}
    posthog-api-host: "https://eu.i.posthog.com"
    event: "deployment-completed"
```

### Complete Workflow Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy application
        run: echo "Deploying..."

      - name: Track deployment in PostHog
        uses: PostHog/posthog-github-action@v1
        with:
          posthog-token: ${{ secrets.POSTHOG_API_KEY }}
          event: "deployment-completed"
          properties: '{"branch": "${{ github.ref_name }}"}'
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

### 2. Commit and Update Version

```bash
git add dist/
git commit -m "build: bundle for release"
npm version patch  # or minor/major (this creates a commit and tag)
```

### 3. Create and Push Tags

```bash
# Push the version tag created by npm version
git push origin main --tags

# Create/update the major version tag (allows users to use @v1)
git tag -f v1
git push origin v1 --force
```

### 4. Create GitHub Release

1. Go to [Releases](https://github.com/PostHog/posthog-github-action/releases)
2. Click "Draft a new release"
3. Select the version tag (e.g., `v1.0.0`)
4. Add release title and notes
5. Click "Publish release"

### 5. Publish to GitHub Marketplace

1. When creating/editing the release, check "Publish this Action to the GitHub Marketplace"
2. Select the primary category (e.g., "Continuous integration")
3. Ensure `action.yml` has all required fields (`name`, `description`, `author`)
4. Publish the release

## License

MIT
