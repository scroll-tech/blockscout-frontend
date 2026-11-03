// SPDX-License-Identifier: LicenseRef-Blockscout

export default function getDocumentCspNonce(header: string | number | Array<string> | undefined): string | undefined {
  const value = Array.isArray(header) ? header[0] : header;
  return typeof value === 'string' && /^[a-zA-Z0-9]+$/.test(value) ? value : undefined;
}
