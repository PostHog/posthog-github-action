# PostHog GitHub action

This action lets you send events to PostHog from your GitHub actions.

At PostHog we use it to track some development metrics

## Inputs

### `posthog-token`

**Required** Your write-only PostHog API Token.

### `posthog-api-token`

**Required** Your PostHog API Host.

Defaults to "https://api.posthog.com"

### `event`

**Required** The event to send to PostHog.

Defaults to "event-from-github-actions"

### `properties`

The properties to add to the event.

## Example usage

```yaml
uses: actions/posthog-github-action
with:
posthog-token: 'abcdefgh'
event: 'gh-actions-production-deploy-completed'
```