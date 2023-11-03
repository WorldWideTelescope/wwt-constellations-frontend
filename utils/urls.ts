// Make a "redirect URL" for use in OpenID exchanges. The key bit of
// functionality here is that if the `hostUrl` config item is specified, we
// always root our URLs there. OpenID redirect URLs have to belong to a
// pre-configured list, so we can't just use whichever origin the browser handed
// us.
//
// The `path` should begin with a slash.
export function makeRedirectUrl(loc: Location, path: string): string {
    const nuxtConfig = useRuntimeConfig();
    let origin: string;

    if (nuxtConfig.public.hostUrl) {
        origin = nuxtConfig.public.hostUrl;
    } else {
        origin = loc.origin;
    }

    return origin + path;
}