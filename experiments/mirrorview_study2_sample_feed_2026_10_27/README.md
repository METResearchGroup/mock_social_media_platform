# MirrorView Study 2 sample feed

This experiment copies `STUDY_2_STIMULI` into feed posts and serves one example feed. The source object is `s3://mirrorview-experimental-artifacts/shared/data/raw/study_2/stimuli/flips.csv`. The build reads that object and does not upload a second copy of the CSV.

`v1` is unchanged at `s3://mock-social-media-platform/experiments/mirrorview_study2_sample_feed_2026_10_27/v1/`. That version has 40,000 posts and one shared author, `user_mirrorview_study_2`.

`v2` is at `s3://mock-social-media-platform/experiments/mirrorview_study2_sample_feed_2026_10_27/v2/`. `assign_authors.py` reads the v1 posts and writes a new copy. Each `post_primary_key` gets one fake display name (`author`) and one fake handle (`handle`). The original and the mirror share that author. Faker uses seed `20261027` mixed with the source key, locale `en_US`, so a later run writes the same names and row order does not matter. `users.jsonl` has 20,000 users. The example feed name in `feeds/example.json` is `Mirrorview`.

This experiment does not use numbered step scripts. `build_sample.py` writes `v1`. `assign_authors.py` writes `v2`. `load_sample.py` reads `v2`. There is no `src/` step directory, so a lone numbered step would leave a gap.

D1 database `msmp` holds all 40,000 posts. `load_sample.py` upserts the 20,000 fake users, points each post at its user, and sets the existing feed `feed_56a80f82d8c7a853` name to `Mirrorview`. It does not create a second example feed. The home timeline still keeps `author_id` in `user_ada`, `user_grace`, and `user_alan`.

## Rebuild

From the repository root, with dependencies installed:

```bash
PYTHONPATH=. uv run python -m experiments.mirrorview_study2_sample_feed_2026_10_27.build_sample
PYTHONPATH=. uv run python -m experiments.mirrorview_study2_sample_feed_2026_10_27.assign_authors
PYTHONPATH=. uv run python -m experiments.mirrorview_study2_sample_feed_2026_10_27.load_sample
```

`build_sample` is only needed when `v1` is missing. `load_sample --reset` deletes only the post ids listed in the v2 `manifest.json`, then inserts them again. AWS keys and the Cloudflare token are loaded by `shared/aws/load_env_vars.py` when the process environment does not already set them. The scripts print counts and feed ids. They do not print post text, generated names, or secret values.
