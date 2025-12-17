# PostHog GitHub Action

This action lets you send events to PostHog from your GitHub Actions.

At PostHog we use it to track development metrics and deployment events.

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

## Example Usage

Your API token is write-only and public, so it's safe to include in plain-text:

```yaml
- uses: PostHog/posthog-github-action@v1
  with:
    posthog-token: "phc_abcdefgh123456789"
    event: "production-deploy-completed"
    properties: '{"environment": "production", "version": "1.2.3"}'
```

Or you can add it as a secret if you prefer not to expose it:

```yaml
- uses: PostHog/posthog-github-action@v1
  with:
    posthog-token: ${{ secrets.POSTHOG_API_KEY }}
    event: "production-deploy-completed"
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

### 1. Update Version

Update the version in `package.json`:

```bash
npm version patch  # or minor/major
```

### 2. Create and Push Tags

```bash
# Create the version tag
git tag v1.0.0

# Create/update the major version tag (allows users to use @v1)
git tag -f v1
git push origin main --tags --force
```

### 3. Create GitHub Release

1. Go to [Releases](https://github.com/PostHog/posthog-github-action/releases)
2. Click "Draft a new release"
3. Select the version tag (e.g., `v1.0.0`)
4. Add release title and notes
5. Click "Publish release"

### 4. Publish to GitHub Marketplace

1. When creating/editing the release, check "Publish this Action to the GitHub Marketplace"
2. Select the primary category (e.g., "Continuous integration")
3. Ensure `action.yml` has all required fields (`name`, `description`, `author`)
4. Publish the release

## License

MIT
