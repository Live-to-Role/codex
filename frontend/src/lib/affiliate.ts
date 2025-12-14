const DTRPG_AFFILIATE_ID = import.meta.env.VITE_DTRPG_AFFILIATE_ID || "";

export function addAffiliateTracking(url: string): string {
  if (!url) return url;

  try {
    const urlObj = new URL(url);

    if (
      urlObj.hostname.includes("drivethrurpg.com") ||
      urlObj.hostname.includes("dmsguild.com")
    ) {
      if (DTRPG_AFFILIATE_ID && !urlObj.searchParams.has("affiliate_id")) {
        urlObj.searchParams.set("affiliate_id", DTRPG_AFFILIATE_ID);
      }
    }

    return urlObj.toString();
  } catch {
    return url;
  }
}

export function isDtrpgUrl(url: string): boolean {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes("drivethrurpg.com") ||
      urlObj.hostname.includes("dmsguild.com")
    );
  } catch {
    return false;
  }
}
