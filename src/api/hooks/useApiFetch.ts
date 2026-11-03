// SPDX-License-Identifier: LicenseRef-Blockscout

import { useQueryClient } from '@tanstack/react-query';
import { omit } from 'es-toolkit';
import React from 'react';

import type { CsrfData } from 'src/features/account/types/client';
import type { ExternalChainExtended } from 'src/shared/external-chains/types';

import type { ResourceName, ResourcePathParams } from '../resources';
import buildHeaders from '../utils/build-headers';
import buildUrl from '../utils/build-url';
import getResourceParams from '../utils/get-resource-params';
import { getResourceKey } from './useApiQuery';
import type { Params as FetchParams } from './useFetch';
import useFetch from './useFetch';

export interface Params<R extends ResourceName> {
  pathParams?: ResourcePathParams<R>;
  queryParams?: Record<string, string | Array<string> | number | boolean | undefined | null>;
  fetchParams?: Pick<FetchParams, 'body' | 'method' | 'signal' | 'headers'>;
  logError?: boolean;
  chain?: ExternalChainExtended;
}

export default function useApiFetch() {
  const fetch = useFetch();
  const queryClient = useQueryClient();

  const { token: csrfToken } = queryClient.getQueryData<CsrfData>(getResourceKey('core:csrf')) || {};

  return React.useCallback(<R extends ResourceName, SuccessType = unknown, ErrorType = unknown>(
    resourceName: R,
    { pathParams, queryParams, fetchParams, logError, chain }: Params<R> = {},
  ) => {
    const { resource } = getResourceParams(resourceName, chain);
    const url = buildUrl(resourceName, pathParams, queryParams, undefined, chain);
    const headers = buildHeaders(resourceName, {
      chain,
      csrfToken,
      method: fetchParams?.method,
      extraHeaders: fetchParams?.headers,
    });

    return fetch<SuccessType, ErrorType>(
      url,
      {
        // useFetch includes Access cookies only for the trusted Scroll backend.
        // Other API origins retain the default same-origin credentials policy.
        headers,
        ...(fetchParams ? omit(fetchParams, [ 'headers' ]) : {}),
      },
      {
        resource: resource.path,
        logError,
      },
    );
  }, [ fetch, csrfToken ]);
}
