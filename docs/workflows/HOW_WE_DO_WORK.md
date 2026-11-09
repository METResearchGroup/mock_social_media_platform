# How we do work

This runbook defines how we think about the development process.

We break this down into the following steps:

1. Get the spec details.
2. Create a proposal for the implementation (if relevant)
3. Create implementation
4. Open PR.
5. Review implementation

## Get the spec details

Get the spec details from the user. This may be self-evident from the prompt. It may also require some decision-making or nuance. If this is related to a ticket or some other ticketing system, make sure to get that link from the user. Else if not, infer the context from the session with the user.

**Task 1**: Interpret the request from the user, and triage. If the spec is clear enough, take it as it is. Else, run the `/grill-me` skill in order to interrogate the user for more detail. The user has control over how much they want to be interrogated, you should always allow the user an exit if they want to exit the interrogation session.

## Create a proposal for the implementation (if relevant)

Some tasks that don't require a proposal:

1. A simple UI change (e.g., changing the color or shape of a button)
2. A non-coding task (e.g,. analysis, research, etc.)

Some tasks that do require a proposal:

1. A multi-part UI change, with multiple options available.
2. Any nontrivial backend, data, or infrastructure change.
3. Any change with a blast radius that affects production code.

Err on the side of writing a proposal unless it's abundantly obvious that the task is simple, not related to our proposal criteria, or the user opts out of it.

When writing a proposal, follow the guidance in the /create-high-level-proposal skill. Also describe the state (of the UI, of control flows, etc) before/after the proposed change.

### Task-specific proposal instructions

Some types of proposals:

1. For UI-related changes, mock up a few versions, using HTML, of the key UI changes, and present them as options to the user.
2. For changes that involve backend, data, or infrastructure, add mermaid diagrams for key user journeys, data flows, control flows, or component interactions, and make key interfaces clear. Also discuss the blast radius of the change and how reversible the change is.

### Revise the proposal (for complex changes)

For non-UI changes that are nontrivial and have a nontrivial blast radius or multiple valid ways to implement or have multiple open questions, generate a second proposal. Use the `/create-second-pass-implementation` skill.

Err on the side of not doing this unless it's a complex change with a high blast radius or has the criteria previously specified. If unsure, ask the user if they would like to see a second proposal.

### Clean up docs

Before presenting the docs to the user, clean them up with the `/comprehensive-writing-cleanup` skill. Delegate this to subagents for each document.

### Offer to create a step-by-step plan

For most tasks, this high-level proposal is sufficient. For complex tasks, offer to generate a step-by-step plan for the user. Err on the side of doing this only when a task may require multiple PRs or has similar such complexity. If the user agrees, run the `create-implementation-plan` skill.

## Create the implementation

Create the implementation. Follow the guidance in `implement-plan-and-open-pr` (ignore the requirements for a plan if a plan doesn't exist, and just base either off the spec, proposal, or context from the conversation with the user).

Some additional guidance here:

1. For simple tasks (e.g,. ones that did not need a proposal), delegate to a smaller model. For Codex, this is `gpt-6 Luna`. For Claude, this is `Haiku 5.5`. For Cursor, this is `Composer 2.5`.
2. For tasks that did require a proposal, use the manager-subagent pattern. The `delegate-to-subagents` skill has guidance on this. For Codex, use `GPT 6.1 Terra` for the manager and `GPT-6 Luna` for the subagent. For Claude, use `Sonnet 5.5` for the manager and `Haiku 5.5` for the subagent. For Cursor, use `Grok 4.7 High` for the manager and `Composer 2.5` for the subagent.
3. Follow the relevant steps in the `implement-plan-and-open-pr` skill. Ignore the requirement for a plan if a plan does not exist.

## Open the PR

Open the PR. Follow the guidance in `implement-plan-and-open-pr`. Use the `write-pr-description` skill to write a PR description.

## Review the implementation

Spawn 2 subagents, in an adversarial pattern, to try and find bugs and areas for improvement. Have both subagents be smaller models (`GPT 6 Luna`, `Haiku 5.5` or `Composer 2.5`). Assign 1 subagent for each of the following:

1. **Adversarial review**: assume that the implementation is incorrect or flawed or contains bugs. Find those bugs. Err on the side of strictness. Only report no findings if it's truly flawless (this should be rare unless the implementation is absolutely trivial). Also check the tests in the PR against [TESTING_ANTIPATTERNS.md](TESTING_ANTIPATTERNS.md) and report any test that matches one of those anti-patterns (for example, a liar, a tautological test, or a test that only inflates coverage).
2. **Alignment review**: review the proposal (if any, else the user's specs or prompt) and the actual implementation. Note where they drifted. Justify each drift (e.g., the user specified it, some spec was incomplete or underspecified, the AI agent made a judgment call, etc).

Have each subagent add their findings as a comment in the PR.
