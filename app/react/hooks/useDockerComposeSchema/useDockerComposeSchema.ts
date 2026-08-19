import { JSONSchema7 } from 'json-schema';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { dockerComposeSchema } from './docker-compose-schema';

const COMPOSE_SCHEMA_URL =
  'https://raw.githubusercontent.com/compose-spec/compose-spec/master/schema/compose-spec.json';

export function useDockerComposeSchema() {
  return useQuery<JSONSchema7>(
    ['docker-compose-schema'],
    getDockerComposeSchema,
    {
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
      cacheTime: 24 * 24 * 60 * 60 * 1000, // 24 days - cacheTime is a 32 bit signed integer - so it can't be more than 24 days
      retry: 1,
      refetchOnWindowFocus: false,
      // Start with local schema while fetching
      initialData: dockerComposeSchema as JSONSchema7,
    }
  );
}

export async function getDockerComposeSchema() {
  try {
    const response = await axios.get<JSONSchema7>(COMPOSE_SCHEMA_URL);
    // just in case a non-object is returned from a proxy
    if (typeof response.data !== 'object') {
      return dockerComposeSchema as JSONSchema7;
    }
    return response.data;
  } catch (error) {
    // Return the local schema as fallback for airgapped environments
    return dockerComposeSchema as JSONSchema7;
  }
}
