import { name } from './name';
import { roleKind } from './roleKind';
import { roleName } from './roleName';
import { subjectKind } from './subjectKind';
import { subjectName } from './subjectName';
import { subjectNamespace } from './subjectNamespace';
import { created } from './created';
import { namespace } from './namespace';

export const columns = [
  name,
  namespace,
  roleKind,
  roleName,
  subjectKind,
  subjectName,
  subjectNamespace,
  created,
];
