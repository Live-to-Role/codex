# Cloudflare DNS Bug Report

## Issue Summary
DNS records exist in Cloudflare dashboard but are not being served by Cloudflare nameservers.

## Domain
`livetorole.com`

## Cloudflare Nameservers
- `jerome.ns.cloudflare.com`
- `molly.ns.cloudflare.com`

## Problem Description
I have added several DNS records to my zone in the Cloudflare dashboard. The records appear correctly in the DNS management interface with "Proxied" status. However, when querying Cloudflare's own authoritative nameservers directly, these records return "Server failed" (NXDOMAIN).

**Records that ARE working:**
- `codex.livetorole.com` (CNAME → codex-livetorole.netlify.app) ✅
- `www.livetorole.com` (CNAME → livetorole.netlify.app) ✅

**Records that are NOT working (despite showing in dashboard):**
- `codex-api.livetorole.com` (CNAME → wtf8uhgs.up.railway.app) ❌
- `images.livetorole.com` (R2 → images-codex bucket) ❌
- `livetorole.com` (A → 192.0.2.1) ❌

## Steps to Reproduce

1. Log into Cloudflare dashboard
2. Navigate to livetorole.com → DNS → Records
3. Observe that `codex-api` CNAME record exists pointing to `wtf8uhgs.up.railway.app` with Proxied status
4. Run DNS query against Cloudflare nameserver:
   ```
   nslookup codex-api.livetorole.com jerome.ns.cloudflare.com
   ```
5. Result: `Server failed` / NXDOMAIN

## Expected Behavior
DNS queries to Cloudflare's authoritative nameservers should return the records that are visible in the dashboard.

## Actual Behavior
- Records show correctly in Cloudflare dashboard
- Records show "Proxied" (orange cloud) status
- Querying Cloudflare's own nameservers returns "Server failed"
- Older records (codex, www) continue to work correctly
- Newly added records do not resolve

## Diagnostic Information

### Working record query:
```
> nslookup codex.livetorole.com jerome.ns.cloudflare.com
Server:  jerome.ns.cloudflare.com
Name:    livetorole-codex.netlify.app
Aliases: codex.livetorole.com
```

### Non-working record query:
```
> nslookup codex-api.livetorole.com jerome.ns.cloudflare.com
Server:  jerome.ns.cloudflare.com
*** jerome.ns.cloudflare.com can't find codex-api.livetorole.com: Server failed
```

### Nameserver verification:
```
> nslookup -type=NS livetorole.com 8.8.8.8
livetorole.com  nameserver = jerome.ns.cloudflare.com
livetorole.com  nameserver = molly.ns.cloudflare.com
```
(Nameservers are correctly pointing to Cloudflare)

## Timeline
- Nameservers were updated to Cloudflare: Previously (working)
- New records added: December 16, 2025
- Time elapsed since adding records: Several hours
- Issue persists despite:
  - Editing and re-saving records
  - Adding root domain A record (as suggested by Cloudflare dashboard warning)
  - Waiting for propagation

## Troubleshooting Already Attempted
1. ✅ Verified nameservers point to Cloudflare (confirmed via Google DNS)
2. ✅ Edited and saved records to force sync
3. ✅ Added root domain A record (dashboard recommendation)
4. ✅ Verified records show correctly in dashboard with Proxied status
5. ✅ Waited several hours for propagation
6. ✅ Tested from multiple DNS resolvers (1.1.1.1, 8.8.8.8, direct to Cloudflare NS)

## Impact
- Cannot route traffic to our API backend (Railway)
- Cannot serve images from R2 storage bucket
- Production application is down

## Account Information
- Plan: [Your plan type]
- Zone ID: [Available in Cloudflare dashboard → Overview → API section]

## Request
Please investigate why newly added DNS records are not being served by Cloudflare nameservers despite appearing correctly in the dashboard. This appears to be an internal zone synchronization issue.
