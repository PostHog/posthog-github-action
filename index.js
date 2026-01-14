const { PostHog } = require('posthog-node')
const core = require('@actions/core')
const github = require('@actions/github')

async function run() {
    try {
        const posthogToken = core.getInput('posthog-token')
        const posthogAPIHost = core.getInput('posthog-api-host')
        const eventName = core.getInput('event')
        const propertiesInput = core.getInput('properties')
        const captureRunDuration = core.getInput('capture-run-duration') === 'true'
        const captureJobDurations = core.getInput('capture-job-durations') === 'true'
        const githubToken = core.getInput('github-token')
        const runner = core.getInput('runner')
        const statusJob = core.getInput('status-job')

        const properties = propertiesInput ? JSON.parse(propertiesInput) : {}

        // Create octokit instance if any GitHub API feature is enabled
        let octokit = null
        if (captureRunDuration || captureJobDurations || statusJob) {
            if (!githubToken) {
                throw new Error('github-token is required when using capture-run-duration, capture-job-durations, or status-job')
            }
            octokit = github.getOctokit(githubToken)
        }

        // Workflow duration (from GitHub API)
        if (captureRunDuration) {
            const { data: workflowRun } = await octokit.rest.actions.getWorkflowRun({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                run_id: github.context.runId,
            })
            properties.duration_seconds = Math.floor((Date.now() - new Date(workflowRun.run_started_at)) / 1000)
            properties.url = workflowRun.html_url
            properties.attempt = workflowRun.run_attempt
            properties.started_at = workflowRun.run_started_at
        }

        // Workflow status (from referenced job via GitHub API)
        if (statusJob) {
            let targetJob = null
            for await (const response of octokit.paginate.iterator(octokit.rest.actions.listJobsForWorkflowRun, {
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                run_id: github.context.runId,
                per_page: 100,
            })) {
                targetJob = response.data.find(j => j.name === statusJob)
                if (targetJob) break
            }
            if (targetJob) {
                properties.conclusion = targetJob.conclusion
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
            runNumber: github.context.runNumber,
            runId: github.context.runId,
            repository: github.context.repo.repo,
            repositoryOwner: github.context.repo.owner,
            actor: github.context.actor,
            eventName: github.context.eventName,
        }

        const workflowRunGroup = `${github.context.repo.owner}/${github.context.repo.repo}/${github.context.runId}`
        const client = new PostHog(posthogToken, { host: posthogAPIHost })

        // Main workflow event
        client.capture({
            distinctId: 'posthog-github-action',
            event: eventName,
            properties: { ...properties, ...githubContext },
            groups: { workflow_run: workflowRunGroup },
        })

        // Per-job timing events
        if (captureJobDurations) {
            // Set group properties for filtering job events by workflow outcome
            if (properties.conclusion) {
                client.groupIdentify({
                    groupType: 'workflow_run',
                    groupKey: workflowRunGroup,
                    properties: { conclusion: properties.conclusion },
                })
            }

            for await (const response of octokit.paginate.iterator(octokit.rest.actions.listJobsForWorkflowRun, {
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                run_id: github.context.runId,
                per_page: 100,
            })) {
                for (const job of response.data) {
                    // Skip jobs that haven't completed or are the metrics job itself
                    if (!job.completed_at || job.name === github.context.job) continue

                    const durationSeconds = Math.floor(
                        (new Date(job.completed_at) - new Date(job.started_at)) / 1000
                    )

                    client.capture({
                        distinctId: 'posthog-github-action',
                        event: `${eventName}-job`,
                        properties: {
                            name: job.name,
                            duration_seconds: durationSeconds,
                            conclusion: job.conclusion,
                            started_at: job.started_at,
                            completed_at: job.completed_at,
                            runner: job.runner_name,
                            ...githubContext,
                        },
                        groups: { workflow_run: workflowRunGroup },
                    })
                }
            }
        }

        await client.shutdown()
    } catch (error) {
        core.setFailed(error.message)
    }
}

run()
