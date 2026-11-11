# Proposal for app presentation and admin navigation

Add Home, Admin, and Profile navigation, with admin pages for feeds, posts, experiments, and documentation. The work includes feed browsing and revised app copy. Post and experiment persistence remain outside the scope.

## Overview

The current app provides a public timeline and an admin feed list, but the navigation and copy expose implementation details. Add a consistent navigation structure and give each admin area its own page. Keep existing feed creation and detail views, and present post and experiment management as placeholders until their APIs exist.

## Before and after

Today, the admin feed list links directly to feed details. After the change, selecting a feed offers its metadata or its public page in a new tab. The feed list starts in creation time order, with sortable columns and pages of 25 rows. The documentation page describes the domain using `docs/conventions/domain_models.md`.

The [UI options](ui-options.html) show two layouts. Option A keeps the admin navigation adjacent to the page title. Option B groups the admin navigation below the main navigation. Both retain the same actions and content. Both layouts use the requested navigation and can follow the existing app style.

## Data and interfaces

`frontend/src/lib/api.ts` supplies `listHostedFeeds`, `getHostedFeed`, and `createHostedFeed`. `frontend/src/lib/types.ts` defines `FeedSummary` with the feed ID, name, creation time, load count, last load time, and post count. The table sorts the returned values in the browser and retains the original timestamp for chronological order. Existing `/admin/feeds/[feedId]` and `/feed/[feedId]` routes provide the metadata and public views.

The domain model document describes intended concepts beyond the current API. Documentation and placeholders must not imply that unsupported creation or persistence already works.

## File structure

The work updates the frontend app routes, shared navigation, admin components, and styles under `frontend/src/`. It reuses the API and domain types above. The backend and database remain unchanged.

## Steps

1. Update the shared navigation and revise user-facing copy.
2. Add the admin pages and reuse the existing feed routes and API.
3. Add sorting, pagination, and the feed view selector.
4. Check the navigation, feed actions, responsive layout, and accessible interaction.

## Expected results

Users can navigate all requested areas and manage existing feeds through the current API. The feed list starts at 25 rows per page. Post and experiment pages identify their placeholder state without claiming saved data.

## Decisions

The request specifies the navigation, feed behavior, and placeholder scope. No further decision is required to implement those requirements. The two mockups show layout alternatives rather than differences in functionality.
