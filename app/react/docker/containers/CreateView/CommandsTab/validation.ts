import { object, SchemaOf, string } from 'yup';

import { validation as consoleValidation } from './ConsoleSettings';
import { validation as logConfigValidation } from './LoggerConfig';
import { Values } from './types';

export function validation(): SchemaOf<Values> {
  return object({
    cmd: string().nullable().default(''),
    entrypoint: string().nullable().default(''),
    logConfig: logConfigValidation(),
    console: consoleValidation(),
    user: string().default(''),
    workingDir: string().default(''),
  });
}
