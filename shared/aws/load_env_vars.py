"""Load mapped names from AWS Secrets Manager in us-east-2.

A non-empty process environment value overrides the secret. ``get_env_var``
writes a resolved secret back into ``os.environ`` under the public name.
This module never prints secret values.
"""

from __future__ import annotations

import json
import os
import threading
from typing import Any, Final, NamedTuple

import boto3
from botocore.exceptions import BotoCoreError, ClientError

AWS_REGION = "us-east-2"


class SecretRef(NamedTuple):
    """Where one public environment variable lives in Secrets Manager."""

    secret_id: str
    key: str | None = None


# Public name -> secret id and JSON key.
# aws-credentials stores the secret under AWS_ACCESS_KEY_SECRET.
ENV_VAR_SOURCES: Final[dict[str, SecretRef]] = {
    "AWS_ACCESS_KEY_ID": SecretRef("aws-credentials", "AWS_ACCESS_KEY_ID"),
    "AWS_SECRET_ACCESS_KEY": SecretRef("aws-credentials", "AWS_ACCESS_KEY_SECRET"),
    "CLOUDFLARE_API_TOKEN": SecretRef("cloudflare-api-token", "CLOUDFLARE_API_TOKEN"),
    "CLOUDFLARE_ACCOUNT_ID": SecretRef("cloudflare-api-token", "CLOUDFLARE_ACCOUNT_ID"),
}


class EnvVarsContainer:
    """Thread-safe loader for the mapped secret names."""

    _instance: EnvVarsContainer | None = None
    _instance_lock = threading.Lock()

    def __init__(self) -> None:
        self._env_vars: dict[str, str | None] = {}
        self._secret_payloads: dict[str, dict[str, Any] | str] = {}
        self._client: Any = None
        self._init_lock = threading.Lock()

    @classmethod
    def get_env_var(cls, name: str, required: bool = False) -> str:
        """Return ``name`` after resolving Secrets Manager."""

        instance = cls._get_instance()
        try:
            raw = instance._resolve(name)
        except ValueError:
            if required:
                raise
            return ""
        if required and (raw is None or not str(raw).strip()):
            raise ValueError(f"{name} is required but is missing or empty.")
        if raw is None:
            return ""
        return str(raw)

    @classmethod
    def _get_instance(cls) -> EnvVarsContainer:
        if cls._instance is None:
            with cls._instance_lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def _resolve(self, name: str) -> str | None:
        cached = self._env_vars.get(name, _MISSING)
        if not isinstance(cached, _Missing):
            return cached
        with self._init_lock:
            cached = self._env_vars.get(name, _MISSING)
            if not isinstance(cached, _Missing):
                return cached
            return self._load_name(name)

    def _load_name(self, name: str) -> str | None:
        env_value = os.getenv(name)
        if env_value is not None:
            env_value = env_value.strip() or None
        source = ENV_VAR_SOURCES.get(name)
        secret_value: str | None = None
        if source is not None and env_value is None:
            try:
                secret_value = self._value_from_secret(source)
            except BotoCoreError as exc:
                raise ValueError(
                    "Failed to load secret "
                    f"{source.secret_id} from AWS Secrets Manager ({type(exc).__name__})."
                ) from exc
        if env_value is not None:
            self._env_vars[name] = env_value
            return env_value
        self._env_vars[name] = secret_value
        if secret_value:
            os.environ[name] = secret_value
        return secret_value

    def _secrets_client(self) -> Any:
        if self._client is None:
            self._client = boto3.client("secretsmanager", region_name=AWS_REGION)
        return self._client

    def _load_secret(self, secret_id: str) -> dict[str, Any] | str:
        cached = self._secret_payloads.get(secret_id)
        if cached is not None:
            return cached
        try:
            response = self._secrets_client().get_secret_value(SecretId=secret_id)
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code", "Unknown")
            raise ValueError(
                f"Failed to load secret {secret_id} from AWS Secrets Manager ({code})."
            ) from exc
        secret_string = response.get("SecretString")
        if not isinstance(secret_string, str) or not secret_string.strip():
            raise ValueError(f"Secret {secret_id} has no SecretString.")
        stripped = secret_string.strip()
        if stripped.startswith("{"):
            try:
                payload = json.loads(stripped)
            except json.JSONDecodeError as exc:
                raise ValueError(f"Secret {secret_id} is not valid JSON.") from exc
            if not isinstance(payload, dict):
                raise ValueError(f"Secret {secret_id} JSON must be an object.")
            self._secret_payloads[secret_id] = payload
            return payload
        self._secret_payloads[secret_id] = stripped
        return stripped

    def _value_from_secret(self, source: SecretRef) -> str:
        payload = self._load_secret(source.secret_id)
        if source.key is None:
            if not isinstance(payload, str):
                raise ValueError(
                    f"Secret {source.secret_id} is a JSON object, so it needs a key."
                )
            return payload
        if not isinstance(payload, dict):
            raise ValueError(
                f"Secret {source.secret_id} is a plain string and has no key {source.key}."
            )
        value = payload.get(source.key)
        if value is None or not str(value).strip():
            raise ValueError(
                f"Secret {source.secret_id} has no non-empty key {source.key}."
            )
        return str(value).strip()


class _Missing:
    """Sentinel for a name that has not been resolved yet."""


_MISSING = _Missing()
