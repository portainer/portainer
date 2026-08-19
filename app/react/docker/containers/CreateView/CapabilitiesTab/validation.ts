import { array, SchemaOf, string } from 'yup';

import { Values } from './CapabilitiesTab';

export function validation(): SchemaOf<Values> {
  return array(string().default('')).default([]);
}
