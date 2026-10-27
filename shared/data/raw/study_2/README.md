# Study 2 stimuli

`STUDY_2_STIMULI` is `shared/data/raw/study_2/stimuli/flips.csv` in `s3://mirrorview-experimental-artifacts/`. The file has 20,000 unique posts. Where `post_primary_key` overlaps between Part 2 and Part 3, the Part 2 row is kept.

Load it with `shared.data.dataloader.load_dataset("STUDY_2_STIMULI")`.

Columns:

| Column | Role |
| --- | --- |
| `post_primary_key` | Join key. The prefix before the first `_` is the platform. |
| `original_text` | Text of the original post. |
| `mirrored_text` | Text of the mirror post. |
| `sampled_stance` | Metadata on both variant posts. |
| `sample_toxicity_type` | Metadata on both variant posts. |

The build records any other header name in `manifest.json` and keeps that value on the JSONL row. The CSV is not committed.
