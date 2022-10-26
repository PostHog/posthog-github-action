const {PostHog} = require('posthog-node')
const core = require('@actions/core')
const github = require('@actions/github');

try {
    const posthogToken = core.getInput('posthog-token');
    const posthogAPIHost = core.getInput('posthog-api-host');
    const eventName = core.getInput('event');
    const properties = JSON.parse(core.getInput('properties'));

    const githubContext = {
        sha: github.context.sha,
        ref: github.context.ref,
        workflow: github.context.workflow,
        job: github.context.job,
        runNumber: github.context.runNumber,
        runId: github.context.runId
    }

    const client = new PostHog(
            posthogToken,
            { host: posthogAPIHost } // You can omit this line if using PostHog Cloud
            )

    client.capture({
        distinctId: 'posthog-github-action',
        event: eventName,
        properties: {...properties, ...githubContext}
    })
    
    client.shutdown()

} catch (error) {
    core.setFailed(error.message);
}