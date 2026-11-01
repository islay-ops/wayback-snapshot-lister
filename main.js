'use strict';
const { Actor, log } = require('apify');
const { listSnapshots, closest } = require('./lib');

Actor.main(async () => {
    const input = (await Actor.getInput()) || {};
    const { mode = 'snapshots', urls = [], dates = [], fromDate, toDate, matchType = 'exact', collapse = 'none', statusCodes = [], mimeType, maxSnapshotsPerUrl = 500, newestFirst = false } = input;
    if (!urls.length) throw new Error('"urls" is empty. Example: ["example.com", "https://news.ycombinator.com/"]');
    let total = 0;
    const push = async (row) => { await Actor.pushData(row, 'snapshot'); total++; };

    if (mode === 'snapshots') {
        for (const url of urls) {
            const rows = await listSnapshots(url, { from: fromDate, to: toDate, matchType, statusCodes, mimeType, limit: maxSnapshotsPerUrl, newestFirst, collapse: collapse === 'none' ? undefined : collapse });
            log.info(`${url}: ${rows.length} snapshots`);
            for (const r of rows) await push({ queryUrl: url, ...r });
        }
    } else if (mode === 'closest') {
        const ds = dates.length ? dates : [undefined];
        for (const url of urls) for (const d of ds) {
            const r = await closest(url, d);
            if (r) await push(r); else log.warning(`No snapshot for ${url} ${d || ''}`);
        }
    } else throw new Error('Unknown mode ' + mode);
    await Actor.setValue('SUMMARY', { mode, urls: urls.length, snapshots: total });
    log.info(`Done: ${total} rows`);
});
