In software development, testing anti-patterns are common strategies, behaviors, or structures that seem like a good idea at first but cause more harm than good in the long run. They lead to fragile test suites, slower development cycles, and a false sense of security.

Here are the most common testing anti-patterns, grouped by their core underlying issues:

1. Structural & Architectural Anti-Patterns

• The Ice Cream Cone (Inverted Pyramid): Testing heavily at the UI/End-to-End (E2E) level while ignoring unit and integration tests. UI tests are slow, flaky, and expensive to maintain. A healthy test suite should resemble a pyramid: a massive foundation of fast unit tests, a middle layer of integration/API tests, and a small, targeted peak of E2E tests.
• The Hourglass: Having plenty of unit tests and plenty of end-to-end tests, but completely skipping integration tests. This results in components that work perfectly in isolation but break when they try to talk to each other.
• The Free Ride (Piggyback Test): Adding new assertions to an existing, unrelated test case just because it already has the complex setup or mock objects you need. This makes test failures incredibly difficult to debug because the test name no longer describes what actually broke.

2. Flakiness & Execution Anti-Patterns

• The Flaky Test (The Intermittent Failure): A test that passes or fails unpredictably without any changes to the code. This is usually caused by race conditions, non-deterministic data, dependency on external APIs, or asynchronous timing issues (using hardcoded sleep() statements instead of dynamic polling/waiting).
• The Sleepy Test: Using arbitrary Thread.sleep() or time.sleep() statements to handle asynchronous execution. This dramatically slows down the test suite. If a test sleeps for 2 seconds but only needs 10 milliseconds, those seconds quickly compound across hundreds of tests.
• The Local Hero: A test that passes flawlessly on a developer’s local machine but fails instantly on the Continuous Integration (CI) server. This typically happens due to hardcoded local file paths, environmental differences (OS, Node/Python versions), or timezone mismatches.

3. Maintainability & Code Quality Anti-Patterns

• The Liar (False Positive): A test that passes even though the underlying production code is broken or incomplete. This often happens when developers heavily mock out dependencies to the point where the test is asserting against the mock's behavior rather than the real application code.
• The Fragile Test (Brittle Test): A test that breaks frequently over minor, irrelevant code changes. For example, an E2E test that breaks because a button's CSS color changed, or a unit test that breaks because internal code was refactored even though the public behavior stayed exactly the same.
• The Loudmouth: A test that pollutes the test runner console with massive walls of text, logs, stack traces, or print statements even when passing. This noise makes it impossible to see actual error messages when something does break.
• The Line Hit Wonder: Writing tests purely to inflate code coverage metrics rather than to test meaningful business logic. This results in hundreds of tests that technically hit lines of code but don't assert any useful outcomes.

4. Setup & Isolation Anti-Patterns

• The Chain Gang (Interdependent Tests): Tests that must be run in a specific, consecutive order because they pass state to one another. If Test A fails, Tests B through Z fail automatically. Tests should always be fully isolated and capable of running in random order or in parallel.
• The Shared Playground: Tests that share a global, mutable state—such as a live development database. If two tests run concurrently and modify the exact same database row, they will cause unpredictable, intermittent failures.
Are you currently dealing with a specific issue in your test suite (like slow runtimes or flaky failures), or are you looking for best practices/code examples to fix one of these specific patterns?

5. Tautological tests

In programming, a tautological test is a bad unit test that passes by logical necessity rather than actually verifying the behavior of the code. Because it cannot fail under normal conditions, it provides a false sense of security.
• How it happens:
	• Duplicated logic: The test and the code use the exact same formula or helper algorithm to calculate the "expected" value, meaning they mirror each other.
	• No assertions: The test runs the code and checks that no crash happened, without querying or asserting any resulting state.
	• Implementation lock-in: The test asserts how the code is written rather than what behavior it should produce.
• Why they are harmful:
	• They encode bugs as "expected behavior" (if the code is broken, the test uses the same broken logic and passes anyway).
	• They fail when you actually fix the underlying bug, punishing code corrections.
	• They cost time to maintain while offering zero real quality signal (high code coverage metrics can mask them).
• How to avoid them: Test against independent expected values, test shared helpers explicitly, and focus on external behavior rather than internal mechanics.
