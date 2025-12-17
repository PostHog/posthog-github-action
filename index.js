const { PostHog } = require('posthog-node')
const core = require('@actions/core')
const github = require('@actions/github')

async function run() {
    try {
        const posthogToken = core.getInput('posthog-token')
        const posthogAPIHost = core.getInput('posthog-api-host')
        const eventName = core.getInput('event')
        const propertiesInput = core.getInput('properties')
        const properties = propertiesInput ? JSON.parse(propertiesInput) : {}

        const githubContext = {
            sha: github.context.sha,
            ref: github.context.ref,
            workflow: github.context.workflow,
            job: github.context.job,
            runNumber: github.context.runNumber,
            runId: github.context.runId,
            repository: github.context.repo.repo,
            repositoryOwner: github.context.repo.owner,
            actor: github.context.actor,
            eventName: github.context.eventName,
        }

        const client = new PostHog(posthogToken, { host: posthogAPIHost })

        client.capture({
            distinctId: 'posthog-github-action',
            event: eventName,
            properties: { ...properties, ...githubContext },
        })

        await client.shutdown()
    } catch (error) {
        core.setFailed(error.message)
    }
}

run()
