"""Named catalog of canonical study datasets under ``shared/data/``.

``STUDY_2_STIMULI`` copies ``kind`` and ``study_phase`` from
``shared/data/registry.py`` in METResearchGroup/mirrorView-task on ``main``.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

DatasetKind = Literal["results", "stimuli", "transformed"]

REPO_ROOT = Path(__file__).resolve().parents[2]

STUDY_2_STIMULI = "STUDY_2_STIMULI"


@dataclass(frozen=True)
class DatasetEntry:
    """One registered study file.

    ``kind`` is ``results`` or ``stimuli`` for raw inputs, or ``transformed``
    for a derived file under ``shared/data/transformed/``.
    """

    name: str
    relative_path: Path
    kind: DatasetKind
    study_phase: str


DATASETS: dict[str, DatasetEntry] = {
    STUDY_2_STIMULI: DatasetEntry(
        name=STUDY_2_STIMULI,
        relative_path=Path("shared/data/raw/study_2/stimuli/flips.csv"),
        kind="stimuli",
        study_phase="study_2",
    ),
}


def get_dataset(name: str) -> DatasetEntry:
    """Return the registry entry for ``name``."""

    try:
        return DATASETS[name]
    except KeyError as exc:
        known = ", ".join(sorted(DATASETS))
        raise KeyError(f"Unknown dataset {name!r}. Known names: {known}") from exc
