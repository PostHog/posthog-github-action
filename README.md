# PostHog GitHub Action

This action lets you send events to PostHog from your GitHub actions.

At PostHog we use it to track some development metrics

## Inputs

### `posthog-token`

**Required** Your write-only PostHog API Token.

### `posthog-api-token`

**Required** Your PostHog API Host.

Defaults to "https://app.posthog.com"

### `event`

**Required** The event to send to PostHog.

Defaults to "event-from-github-actions"

### `properties`

The properties to add to the event. These should be passed as a string containing a JSON object.

The action runs `JSON.parse(theProperties)`

## Example usage

Your API token is write-only and public so safe to include here in plain-text

```yaml
uses: actions/posthog-github-action
with:
posthog-token: 'abcdefgh'
event: 'gh-actions-production-deploy-completed'
properties: '{"an-example": "property"}'
```

but you can add it as a secret if you prefer not to expose any secrets in plain-text

```yaml
uses: actions/posthog-github-action
with:
posthog-token: ${{ secrets.API_TOKEN }} 
event: 'gh-actions-production-deploy-completed'
properties: '{"an-example": "property"}'
```