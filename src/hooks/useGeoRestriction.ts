import { useState, useEffect } from 'react';

interface GeoInfo {
  isRussia: boolean;
  loading: boolean;
  country: string | null;
}

/**
 * Try multiple geo-IP services to get the real client country code.
 * Some services may return the proxy/CDN IP instead of the real client IP,
 * so we try several until we get a consistent answer.
 */
async function detectCountryCode(signal: AbortSignal): Promise<string | null> {
  // List of free geo-IP APIs that return country code
  const apis = [
    {
      url: 'https://api.country.is/',
      parse: (d: any) => d?.country || null,
    },
    {
      url: 'https://ipwho.is/',
      parse: (d: any) => d?.country_code || null,
    },
    {
      url: 'https://freeipapi.com/api/json',
      parse: (d: any) => d?.countryCode || null,
    },
    {
      url: 'https://ipapi.co/json/',
      parse: (d: any) => d?.country_code || null,
    },
  ];

  for (const api of apis) {
    try {
      const res = await fetch(api.url, {
        signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const code = api.parse(data);
      if (code && typeof code === 'string' && code.length === 2) {
        return code.toUpperCase();
      }
    } catch {
      // Try next API
    }
  }

  return null;
}

export function useGeoRestriction(profileLocation?: string | null): GeoInfo {
  const [ipCountry, setIpCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();

    detectCountryCode(abortController.signal)
      .then((code) => {
        if (!abortController.signal.aborted) {
          setIpCountry(code);
        }
      })
      .catch(() => {
        // Don't restrict if all APIs fail
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });

    return () => abortController.abort();
  }, []);

  // Check both IP-based country and profile location
  const profileIsRussia = profileLocation
    ? /россия|russia|рф|rf|ru\b/i.test(profileLocation)
    : false;

  const ipIsRussia = ipCountry === 'RU';

  return {
    isRussia: ipIsRussia || profileIsRussia,
    loading,
    country: ipCountry,
  };
}
