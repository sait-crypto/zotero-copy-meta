# One-Click Copy Metadata

Right-click one or more Zotero library items and choose **Copy Metadata as JSON**. A single bibliographic item produces a JSON object. Multiple bibliographic items produce an array. Notes and attachments selected on their own are skipped.

## Install and update

Download [One-Click Copy Metadata 1.0.1](https://raw.githubusercontent.com/sait-crypto/zotero-copy-meta/refs/heads/main/dist/zotero-copy-meta-1.0.1.xpi) for Zotero 7 through 10 and install the XPI from **Tools → Plugins**. Users with version 1.0.0 or later receive compatible versions through Zotero's automatic plugin updates when enabled. To check immediately, choose **Check for Updates** from the Plugins window's gear menu.

## Publish an update

Edit the source in `plugin/`, bump `plugin/manifest.json`'s version, and run `python build.py`. Commit the source, the new `dist/` package, and `updates.json` together to `main`. Keep published packages and their update entries available for older Zotero versions.

When a new Zotero version is verified with an existing package, raise `strict_max_version` for that version in `updates.json`. For a release that requires code changes, update the compatibility range in `plugin/manifest.json` and build a new version.
