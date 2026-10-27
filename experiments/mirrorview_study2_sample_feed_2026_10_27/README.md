# MirrorView Study 2 sample feed

This experiment copies `STUDY_2_STIMULI` into feed posts and serves one example feed. The source object is `s3://mirrorview-experimental-artifacts/shared/data/raw/study_2/stimuli/flips.csv`. The build reads that object and does not upload a second copy of the CSV.

The derived files are in `s3://mock-social-media-platform/experiments/mirrorview_study2_sample_feed_2026_10_27/v1/`. `posts.jsonl` has 40,000 lines, two per source row. The ids are `<post_primary_key>:original` and `<post_primary_key>:mirror`. `users.jsonl` has one author, `user_mirrorview_study_2`, handle `study2`, display name `MirrorView Study 2`.

The example feed has 100 posts. Those posts are the first 50 source rows, original then mirror. The unknown-refs feed has the first 10 of those ids plus 3 ids that are not in D1. D1 database `msmp` holds all 40,000 posts plus the existing seed. There is no new D1 column. `sampled_stance`, `sample_toxicity_type`, `platform`, and any extra CSV columns stay in the JSONL.

`GET /api/v1/feed` still returns the seed posts. The query keeps `author_id` in `user_ada`, `user_grace`, and `user_alan`, so the home page does not try to render the 40,000 sample posts. Named feeds read posts by id.

## Rebuild

From `infrastructure/terraform/`:

```bash
terraform init
terraform plan
terraform apply
```

State is the local `terraform.tfstate`. Git ignores that file.

From the repository root, with `boto3` installed:

```bash
PYTHONPATH=. uv run python -m experiments.mirrorview_study2_sample_feed_2026_10_27.build_sample
PYTHONPATH=. uv run python -m experiments.mirrorview_study2_sample_feed_2026_10_27.load_sample
```

`load_sample --reset` deletes only the post ids listed in `manifest.json`, then inserts them again. AWS keys and the Cloudflare token are loaded by `shared/aws/load_env_vars.py` when the process environment does not already set them. The scripts print counts and feed ids. They do not print post text or secret values.

After load, pass the printed feed ids to `scripts/cloudflare_smoke.py` with `--example-feed-id` and `--unknown-feed-id`.
