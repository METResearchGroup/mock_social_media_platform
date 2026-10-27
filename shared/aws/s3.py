"""Small S3 reader and writer. It does not print keys or object bodies."""

from __future__ import annotations

from typing import Any

import boto3
from botocore.exceptions import ClientError

DEFAULT_REGION_NAME = "us-east-2"
NOT_FOUND_ERROR_CODES = frozenset({"404", "NoSuchKey", "NotFound"})


class S3:
    """Bytes in and out of one bucket."""

    def __init__(self, bucket: str, *, region_name: str | None = None) -> None:
        client_kwargs: dict[str, Any] = {}
        if region_name is not None:
            client_kwargs["region_name"] = region_name
        self._bucket = bucket
        self._client: Any = boto3.client("s3", **client_kwargs)

    @property
    def bucket(self) -> str:
        return self._bucket

    def get_bytes(self, key: str) -> bytes:
        """Return the object body for ``key``."""

        response = self._client.get_object(Bucket=self._bucket, Key=key.lstrip("/"))
        body = response["Body"].read()
        if not isinstance(body, bytes):
            raise TypeError("S3 object body was not bytes.")
        return body

    def put_bytes(self, key: str, body: bytes, *, content_type: str) -> None:
        """Upload ``body`` to ``key``."""

        self._client.put_object(
            Bucket=self._bucket,
            Key=key.lstrip("/"),
            Body=body,
            ContentType=content_type,
        )

    def list_objects(self, prefix: str) -> list[tuple[str, int]]:
        """Return ``(key, size)`` pairs under ``prefix``. Sizes are bytes."""

        paginator = self._client.get_paginator("list_objects_v2")
        found: list[tuple[str, int]] = []
        for page in paginator.paginate(Bucket=self._bucket, Prefix=prefix.lstrip("/")):
            for item in page.get("Contents", []):
                key = item.get("Key")
                size = item.get("Size")
                if isinstance(key, str) and isinstance(size, int):
                    found.append((key, size))
        return sorted(found)

    def object_exists(self, key: str) -> bool:
        """Return whether ``key`` exists. Errors other than a missing object propagate."""

        try:
            self._client.head_object(Bucket=self._bucket, Key=key.lstrip("/"))
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code")
            if code in NOT_FOUND_ERROR_CODES:
                return False
            raise
        return True
