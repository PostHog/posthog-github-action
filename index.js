//import github from "@actions/github";
import posthog from 'posthog-js'
import core from "@actions/core";

try {
    const posthogToken = core.getInput('posthog-token');
    const posthogAPIHost = core.getInput('posthog-api-host');
    const eventName = core.getInput('event');
    const properties = core.getInput('properties');

    posthog.init(posthogToken, { api_host: posthogAPIHost })

    posthog.capture(eventName, properties);
} catch (error) {
    core.setFailed(error.message);
}