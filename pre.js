const core = require('@actions/core')

const captureJobDuration = core.getInput('capture-job-duration') === 'true'
if (captureJobDuration) {
    core.saveState('jobStartTime', Date.now().toString())
}
