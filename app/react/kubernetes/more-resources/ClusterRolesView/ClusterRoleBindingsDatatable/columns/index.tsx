import { name } from './name';
import { roleName } from './roleName';
import { kind } from './kind';
import { created } from './created';
import { subjectKind } from './subjectKind';
import { subjectName } from './subjectName';
import { subjectNamespace } from './subjectNamespace';

export const columns = [
  name,
  roleName,
  kind,
  subjectKind,
  subjectName,
  subjectNamespace,
  created,
];
