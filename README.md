# Wayback Machine Snapshot Lister & Closest-Snapshot Lookup

List every capture the Internet Archive's Wayback Machine holds for a URL, or find the capture closest to a date, using the Archive's public CDX Server and CDX closest searchs. Results are ready-to-open snapshot links plus metadata.

## Modes
- **snapshots**: all captures of a URL (or everything under a path, host or domain), with timestamp, HTTP status, MIME type, content digest, size, a snapshot link and a raw-content link (`id_`, no Wayback banner). Filter by date range, status code and MIME type.
- **closest**: for each URL and date, the capture nearest to that date.

## Typical uses
- Prove what a page said on a given date (compliance, evidence, journalism, legal-adjacent research).
- Find when a page changed: collapse by `digest` to get one row per distinct version.
- Recover lost pages or discover old URLs of a domain (`matchType: domain`).
- Build a monthly or yearly timeline of a site with one capture per period.

## Input example
```json
{ "mode": "snapshots", "urls": ["example.com"], "fromDate": "2018-01-01", "collapse": "timestamp:6", "statusCodes": ["200"] }
```

## Pricing
Pay per result: $0.001 per snapshot row. 1,000 snapshots cost $1.

## Notes
- The Actor paces its requests to respect archive.org rate limits, so very large pulls take time.
- It lists captures and links; it does not download page content.
- Questions or a field you need? Open an issue on the Actor page; we reply quickly.


Hosted version (pay per result, no setup): https://apify.com/northgrid-data/wayback-snapshots-cdx
