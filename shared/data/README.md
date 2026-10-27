# Shared data

`shared/data/registry.py` names the study files this repo reads. `shared/data/dataloader.py` downloads a registered name from S3. The object key is the repo-relative path on the registry entry.

Git ignores `*.csv` under `shared/data/raw/`. The CSV stays in `s3://mirrorview-experimental-artifacts/` at that same key. This package does not import anything from `experiments/`.

`load_dataset` returns the object bytes. It does not print the file. AWS keys come from the process environment, from `LAB_AWS_ACCESS_KEY_ID` and `LAB_AWS_ACCESS_KEY_SECRET` when the standard names are empty, or from Secrets Manager secret `aws-credentials` through `SecretRef` in `shared/aws/load_env_vars.py`.

The only registered name in this repo is `STUDY_2_STIMULI`.
