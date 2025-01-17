const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
    try {
        const context = github.context;

        if (context.eventName !== 'pull_request') {
            core.setFailed('This action only works with pull_request events.');
            return;
        }

        const headRepoFullName = context.payload.pull_request.head.repo.full_name;
        const baseRepoFullName = context.payload.repository.full_name;

        const isFork = headRepoFullName !== baseRepoFullName;
        if (!isFork) {
            console.log(`Pull request is not from a fork, skipping.`);
            return;
        }

        const safeToTestLabelName = core.getInput('label');

        // Check if pull request has the "safe-to-test" label
        const labels = context.payload.pull_request.labels;
        const safeToTestLabel = labels.find(label => label.name === safeToTestLabelName);
        if (!safeToTestLabel) {
            console.log(`Pull request does not have the "safe-to-test" label, skipping.`);
            return;
        }

        // Remove the "safe-to-test" label
        const octokit = new github.getOctokit(core.getInput('repo-token'));
        await octokit.rest.issues.removeLabel({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: context.payload.pull_request.number,
            name: safeToTestLabelName,
        });
        console.log(`Removed the "safe-to-test" label from pull request.`);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
