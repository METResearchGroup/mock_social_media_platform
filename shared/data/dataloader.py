"""Loader for datasets registered in ``shared.data.registry``.

Each registered name is an object in ``mirrorview-experimental-artifacts``.
The object key is the repo-relative path. ``load_dataset`` returns those bytes.
"""

from __future__ import annotations

import os

from botocore.exceptions import ClientError

from shared.aws.load_env_vars import EnvVarsContainer
from shared.aws.s3 import DEFAULT_REGION_NAME, S3
from shared.data import registry

STUDY_DATA_BUCKET = "mirrorview-experimental-artifacts"
_MISSING_OBJECT_CODES = frozenset({"404", "NoSuchKey", "NotFound"})


def load_dataset(name: str) -> bytes:
    """Download a registered object from S3.

    Raises:
        KeyError: If ``name`` is not in the registry.
        FileNotFoundError: If the S3 object is missing.
    """

    key = registry.get_dataset(name).relative_path.as_posix()
    return _read_study_object(key)


def _read_study_object(key: str) -> bytes:
    _use_lab_credentials_when_unset()
    store = S3(STUDY_DATA_BUCKET, region_name=DEFAULT_REGION_NAME)
    try:
        return store.get_bytes(key)
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code")
        if code in _MISSING_OBJECT_CODES:
            raise FileNotFoundError(
                f"Dataset object not found: s3://{STUDY_DATA_BUCKET}/{key}"
            ) from exc
        raise


def _use_lab_credentials_when_unset() -> None:
    """Fill empty AWS key variables from lab env vars, then Secrets Manager.

    A non-empty ``AWS_ACCESS_KEY_ID`` or ``AWS_SECRET_ACCESS_KEY`` is left as
    it is. Otherwise the matching ``LAB_AWS_*`` value is copied. If a key is
    still empty, ``EnvVarsContainer`` loads ``aws-credentials`` from Secrets
    Manager and writes the public name into the process environment.
    """

    if not os.environ.get("AWS_ACCESS_KEY_ID"):
        access_key = os.environ.get("LAB_AWS_ACCESS_KEY_ID", "")
        if access_key:
            os.environ["AWS_ACCESS_KEY_ID"] = access_key
    if not os.environ.get("AWS_SECRET_ACCESS_KEY"):
        secret_key = os.environ.get("LAB_AWS_ACCESS_KEY_SECRET", "")
        if secret_key:
            os.environ["AWS_SECRET_ACCESS_KEY"] = secret_key
    if not os.environ.get("AWS_ACCESS_KEY_ID"):
        EnvVarsContainer.get_env_var("AWS_ACCESS_KEY_ID", required=True)
    if not os.environ.get("AWS_SECRET_ACCESS_KEY"):
        EnvVarsContainer.get_env_var("AWS_SECRET_ACCESS_KEY", required=True)


def ensure_cloudflare_env() -> None:
    """Load the Cloudflare account id and API token when they are unset."""

    if not os.environ.get("CLOUDFLARE_API_TOKEN"):
        EnvVarsContainer.get_env_var("CLOUDFLARE_API_TOKEN", required=True)
    if not os.environ.get("CLOUDFLARE_ACCOUNT_ID"):
        EnvVarsContainer.get_env_var("CLOUDFLARE_ACCOUNT_ID", required=True)
