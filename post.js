const { PostHog } = require('posthog-node')
const core = require('@actions/core')
const github = require('@actions/github')

async function run() {
    try {
        const captureJobDuration = core.getInput('capture-job-duration') === 'true'
        if (!captureJobDuration) return

        const jobStartTime = core.getState('jobStartTime')
        if (!jobStartTime) {
            core.warning('No job start time found in state, skipping job duration capture')
            return
        }

        const durationSeconds = Math.floor((Date.now() - parseInt(jobStartTime)) / 1000)

        const posthogToken = core.getInput('posthog-token')
        const posthogAPIHost = core.getInput('posthog-api-host')
        const eventName = core.getInput('event')
        const propertiesInput = core.getInput('properties')
        const runner = core.getInput('runner')
        const jobConclusion = core.getInput('job-conclusion')

        const properties = propertiesInput ? JSON.parse(propertiesInput) : {}
        properties.job_duration_seconds = durationSeconds

        if (runner) {
            properties.runner = runner
        }

        if (jobConclusion) {
            properties.job_conclusion = jobConclusion
        }

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
            groups: {
                workflow_run: `${github.context.repo.owner}/${github.context.repo.repo}/${github.context.runId}`,
            },
        })

        await client.shutdown()
    } catch (error) {
        core.warning(`Failed to capture job duration: ${error.message}`)
    }
}

run()
