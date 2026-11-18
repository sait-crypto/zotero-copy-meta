"""Build a versioned XPI and add it to Zotero's update manifest."""

import hashlib
import io
import json
import re
from pathlib import Path
from zipfile import ZipFile, ZipInfo


def main():
    root = Path(__file__).resolve().parent
    source = root / "plugin"
    manifest = json.loads((source / "manifest.json").read_text(encoding="utf-8"))
    app = manifest["applications"]["zotero"]
    version = manifest["version"]
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise SystemExit("Use a numeric major.minor.patch version in manifest.json.")

    relative_package = f"dist/zotero-copy-meta-{version}.xpi"
    package = root / relative_package
    archive = io.BytesIO()
    with ZipFile(archive, "w") as xpi:
        for path in sorted(source.rglob("*")):
            if path.is_file():
                info = ZipInfo(path.relative_to(source).as_posix())
                info.create_system = 3
                info.external_attr = 0o100644 << 16
                xpi.writestr(info, path.read_bytes())
    data = archive.getvalue()

    updates_path = root / "updates.json"
    feed = json.loads(updates_path.read_text(encoding="utf-8")) if updates_path.exists() else {"addons": {}}
    updates = feed["addons"].setdefault(app["id"], {"updates": []})["updates"]
    entry = {
        "version": version,
        "update_link": app["update_url"].rsplit("/", 1)[0] + "/" + relative_package,
        "update_hash": "sha256:" + hashlib.sha256(data).hexdigest(),
        "applications": {"zotero": {
            "strict_min_version": app["strict_min_version"],
            "strict_max_version": app["strict_max_version"],
        }},
    }
    previous = next((update for update in updates if update["version"] == version), None)
    if (package.exists() and package.read_bytes() != data) or (
        previous and previous["update_hash"] != entry["update_hash"]
    ):
        raise SystemExit(f"Version {version} already has a different package. Bump the version.")

    package.parent.mkdir(exist_ok=True)
    package.write_bytes(data)
    if previous is None:
        updates.append(entry)
        updates_path.write_text(json.dumps(feed, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(relative_package)


if __name__ == "__main__":
    main()
