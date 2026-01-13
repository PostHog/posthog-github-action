const { PostHog } = require('posthog-node')
const core = require('@actions/core')
const github = require('@actions/github')

async function run() {
    try {
        const posthogToken = core.getInput('posthog-token')
        const posthogAPIHost = core.getInput('posthog-api-host')
        const eventName = core.getInput('event')
        const propertiesInput = core.getInput('properties')
        const captureWorkflowDuration = core.getInput('capture-workflow-duration') === 'true'
        const githubToken = core.getInput('github-token')
        const runner = core.getInput('runner')
        const statusJob = core.getInput('status-job')

        const properties = propertiesInput ? JSON.parse(propertiesInput) : {}

        // Workflow duration (from GitHub API)
        if (captureWorkflowDuration) {
            if (!githubToken) {
                throw new Error('github-token is required when capture-workflow-duration is true')
            }
            const octokit = github.getOctokit(githubToken)
            const { data: workflowRun } = await octokit.rest.actions.getWorkflowRun({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                run_id: github.context.runId,
            })
            properties.duration_seconds = Math.floor((Date.now() - new Date(workflowRun.run_started_at)) / 1000)
            properties.run_url = workflowRun.html_url
            properties.run_attempt = workflowRun.run_attempt
            properties.run_id = workflowRun.id
            properties.run_started_at = workflowRun.run_started_at
        }

        // Workflow status (from referenced job via GitHub API)
        if (statusJob) {
            if (!githubToken) {
                throw new Error('github-token is required when status-job is set')
            }
            const octokit = github.getOctokit(githubToken)
            const { data: jobs } = await octokit.rest.actions.listJobsForWorkflowRun({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                run_id: github.context.runId,
            })
            const targetJob = jobs.jobs.find(j => j.name === statusJob)
            if (targetJob) {
                properties.workflow_status = targetJob.conclusion
            } else {
                core.warning(`Job '${statusJob}' not found in workflow run`)
            }
        }

        if (runner) {
            properties.runner = runner
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
        core.setFailed(error.message)
    }
}

run()
