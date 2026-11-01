'use strict';
// Internet Archive Wayback Machine: public CDX Server API and CDX closest search.
const UA = 'wayback-snapshots-actor/1.0 (Apify Actor; public archive.org APIs)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let lastCall = 0;
async function get(url, tries = 6) {
    let last;
    for (let i = 0; i < tries; i++) {
        const wait = lastCall + 1500 - Date.now(); // polite pacing for archive.org
        if (wait > 0) await sleep(wait);
        lastCall = Date.now();
        try {
            const res = await fetch(url, { headers: { 'user-agent': UA } });
            if (res.status === 429 || res.status >= 500) { await sleep(10000 * (i + 1)); last = new Error('HTTP ' + res.status); continue; }
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.text();
        } catch (e) { last = e; await sleep(1500 * (i + 1)); }
    }
    throw last;
}

const clean = (u) => String(u).trim();
const fmtTs = (d) => (d ? String(d).replace(/[-:T\s]/g, '').slice(0, 14) : undefined);

function snapshotUrl(ts, original) { return `https://web.archive.org/web/${ts}/${original}`; }
function rawSnapshotUrl(ts, original) { return `https://web.archive.org/web/${ts}id_/${original}`; }

function toIso(ts) {
    const m = ts.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z` : null;
}

async function listSnapshots(url, { from, to, matchType = 'exact', statusCodes = [], mimeType, collapse, limit = 1000, newestFirst = false } = {}) {
    const p = new URLSearchParams({ url: clean(url), output: 'json', fl: 'timestamp,original,statuscode,mimetype,digest,length', limit: String(newestFirst ? -limit : limit) });
    if (from) p.set('from', fmtTs(from));
    if (to) p.set('to', fmtTs(to));
    if (matchType !== 'exact') p.set('matchType', matchType);
    if (collapse) p.set('collapse', collapse); // e.g. timestamp:6 (monthly), timestamp:8 (daily), digest
    for (const s of statusCodes) p.append('filter', 'statuscode:' + s);
    if (statusCodes.length > 1) { p.delete('filter'); p.append('filter', 'statuscode:(' + statusCodes.join('|') + ')'); }
    if (mimeType) p.append('filter', 'mimetype:' + mimeType);
    const text = await get('https://web.archive.org/cdx/search/cdx?' + p.toString());
    if (!text.trim()) return [];
    const rows = JSON.parse(text);
    return rows.slice(1).map(([timestamp, original, statuscode, mimetype, digest, length]) => ({
        timestamp, capturedAt: toIso(timestamp), original, statusCode: statuscode === '-' ? null : Number(statuscode), mimeType: mimetype,
        digest, length: Number(length) || null, snapshotUrl: snapshotUrl(timestamp, original), rawUrl: rawSnapshotUrl(timestamp, original),
    }));
}

async function closest(url, date) {
    // CDX "closest" sort: returns the capture nearest to the date (default: now), preferring successful captures.
    const ts = fmtTs(date) || fmtTs(new Date().toISOString());
    const p = new URLSearchParams({ url: clean(url), output: 'json', fl: 'timestamp,original,statuscode,mimetype', limit: '1', sort: 'closest', closest: ts });
    p.append('filter', 'statuscode:200');
    const text = await get('https://web.archive.org/cdx/search/cdx?' + p.toString());
    if (!text.trim()) return null;
    const rows = JSON.parse(text);
    if (rows.length < 2) return null;
    const [timestamp, original, statuscode, mimetype] = rows[1];
    return { url: clean(url), requestedDate: date || null, timestamp, capturedAt: toIso(timestamp), statusCode: Number(statuscode) || null, mimeType: mimetype, snapshotUrl: snapshotUrl(timestamp, original), rawUrl: rawSnapshotUrl(timestamp, original) };
}

module.exports = { listSnapshots, closest, fmtTs, toIso };
