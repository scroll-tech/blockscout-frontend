// SPDX-License-Identifier: LicenseRef-Blockscout

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { CSP_NONCE_HEADER } from 'src/server/constants';
import * as csp from 'src/server/csp/index';
import * as middlewares from 'src/server/middlewares/index';

export async function proxy(req: NextRequest) {
  const isPageRequest = req.headers.get('accept')?.includes('text/html');
  const start = Date.now();

  if (!isPageRequest) {
    return;
  }

  const accountResponse = middlewares.account(req);
  if (accountResponse) {
    return accountResponse;
  }

  const nonce = crypto.randomUUID().replaceAll('-', '');
  const cspHeader = await csp.get(req, nonce);
  // Next.js reads CSP from the incoming request while rendering its scripts.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('Content-Security-Policy', cspHeader);
  requestHeaders.set(CSP_NONCE_HEADER, nonce);
  const res = NextResponse.next({ request: { headers: requestHeaders } });

  middlewares.appProfile(req, res);
  middlewares.colorTheme(req, res);
  middlewares.addressFormat(req, res);
  middlewares.scamTokens(req, res);
  middlewares.poorReputationTokens(req, res);

  const end = Date.now();

  res.headers.append('Content-Security-Policy', cspHeader);
  res.headers.append('Server-Timing', `middleware;dur=${ end - start }`);
  res.headers.append('Docker-ID', process.env.HOSTNAME || '');

  if (nonce) {
    res.headers.append(CSP_NONCE_HEADER, nonce);
  }

  return res;
}

/**
 * Configure which routes should pass through the proxy.
 */
export const config = {
  matcher: [ '/', '/:notunderscore((?!_next).+)' ],
  // matcher: [
  //   '/((?!.*\\.|api\\/|node-api\\/).*)', // exclude all static + api + node-api routes
  // ],
};
