// SPDX-License-Identifier: LicenseRef-Blockscout

// Only the Scroll backend needs cross-origin Cloudflare Access cookies.
export default function getScrollFetchCredentials(url: string): RequestCredentials {
  try {
    return new URL(url).origin === 'https://blockscout-backend.scroll.systems' ? 'include' : 'same-origin';
  } catch {
    return 'same-origin';
  }
}
