#!/usr/bin/env python3
"""
add_gtag.py

Walks a project folder and makes sure every .html file contains the
Google Analytics (gtag.js) snippet for a given measurement ID. Files that
already have it (checked by measurement ID, not exact text) are left
alone. Files missing it get the snippet injected right before </body>
(or appended at the end if there's no </body> tag at all).

Usage:
    python3 add_gtag.py /path/to/project
    python3 add_gtag.py /path/to/project --id G-XXXXXXXXXX
    python3 add_gtag.py /path/to/project --dry-run
"""

import argparse
import re
import sys
from pathlib import Path

DEFAULT_GA_ID = "G-53Q9XR4QZK"

SNIPPET_TEMPLATE = """<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id={ga_id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());

  gtag('config', '{ga_id}');
</script>
"""


def find_html_files(root: Path):
    """Yield every .html file under root, recursively."""
    yield from root.rglob("*.html")


def has_gtag(content: str, ga_id: str) -> bool:
    """True if the file already references this GA measurement ID anywhere."""
    return ga_id in content


def inject_snippet(content: str, ga_id: str) -> str:
    """Insert the gtag snippet right before </body>, or append if no </body>."""
    snippet = SNIPPET_TEMPLATE.format(ga_id=ga_id)

    # Case-insensitive match on the closing body tag, keep original casing/whitespace around it
    match = re.search(r"</body\s*>", content, flags=re.IGNORECASE)
    if match:
        insert_at = match.start()
        return content[:insert_at] + snippet + "\n" + content[insert_at:]

    # No </body> found — just tack it onto the end of the file
    if not content.endswith("\n"):
        content += "\n"
    return content + snippet


def main():
    parser = argparse.ArgumentParser(description="Ensure every HTML file has the GA gtag snippet.")
    parser.add_argument("root", type=str, help="Path to your project folder")
    parser.add_argument("--id", type=str, default=DEFAULT_GA_ID, help=f"GA measurement ID (default: {DEFAULT_GA_ID})")
    parser.add_argument("--dry-run", action="store_true", help="Show what would change without writing any files")
    args = parser.parse_args()

    root = Path(args.root).expanduser().resolve()
    if not root.is_dir():
        print(f"Error: '{root}' is not a directory.")
        sys.exit(1)

    ga_id = args.id

    html_files = list(find_html_files(root))
    if not html_files:
        print(f"No .html files found under {root}")
        return

    updated = []
    already_had_it = []
    failed = []

    for path in html_files:
        try:
            content = path.read_text(encoding="utf-8")
        except Exception as e:
            failed.append((path, f"read error: {e}"))
            continue

        if has_gtag(content, ga_id):
            already_had_it.append(path)
            continue

        new_content = inject_snippet(content, ga_id)

        if args.dry_run:
            updated.append(path)
            continue

        try:
            path.write_text(new_content, encoding="utf-8")
            updated.append(path)
        except Exception as e:
            failed.append((path, f"write error: {e}"))

    print(f"Scanned {len(html_files)} HTML file(s) under {root}\n")

    if updated:
        verb = "Would update" if args.dry_run else "Updated"
        print(f"{verb} {len(updated)} file(s):")
        for p in updated:
            print(f"  + {p.relative_to(root)}")
        print()

    if already_had_it:
        print(f"Already had the snippet ({len(already_had_it)} file(s)):")
        for p in already_had_it:
            print(f"  = {p.relative_to(root)}")
        print()

    if failed:
        print(f"Failed ({len(failed)} file(s)):")
        for p, err in failed:
            print(f"  ! {p.relative_to(root)} — {err}")
        print()

    if args.dry_run and updated:
        print("Dry run only — no files were modified. Re-run without --dry-run to apply.")


if __name__ == "__main__":
    main()