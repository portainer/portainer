import { Directory, File, FileNode } from './types';
import {
  isDirectory,
  getAllFilePaths,
  getFolderState,
  filterToPattern,
} from './utils';

function file(name: string): File {
  return { name };
}

function dir(name: string, children: FileNode[] = []): Directory {
  return { name, children };
}

describe('isDirectory', () => {
  it('returns true when the item has a children property', () => {
    expect(isDirectory(dir('src'))).toBe(true);
  });

  it('returns true when the children property is present but undefined', () => {
    const dirWithUndefinedChildren: Directory = {
      name: 'empty',
      children: undefined,
    };
    expect(isDirectory(dirWithUndefinedChildren)).toBe(true);
  });

  it('returns false for a file without children', () => {
    expect(isDirectory(file('foo.ts'))).toBe(false);
  });
});

describe('getAllFilePaths', () => {
  it('returns the node path for a single file', () => {
    expect(getAllFilePaths(file('foo.ts'), 'foo.ts')).toEqual(['foo.ts']);
  });

  it('returns all child file paths for a flat directory', () => {
    const node = dir('src', [file('a.ts'), file('b.ts')]);
    expect(getAllFilePaths(node, 'src')).toEqual(['src/a.ts', 'src/b.ts']);
  });

  it('returns an empty array for an empty directory', () => {
    expect(getAllFilePaths(dir('empty'), 'empty')).toEqual([]);
  });

  it('returns deeply nested file paths', () => {
    const node = dir('root', [dir('sub', [file('deep.ts')])]);
    expect(getAllFilePaths(node, 'root')).toEqual(['root/sub/deep.ts']);
  });

  it('returns all paths across multiple nested levels', () => {
    const node = dir('a', [
      file('top.ts'),
      dir('b', [file('nested.ts'), dir('c', [file('deep.ts')])]),
    ]);
    expect(getAllFilePaths(node, 'a').sort()).toEqual([
      'a/b/c/deep.ts',
      'a/b/nested.ts',
      'a/top.ts',
    ]);
  });
});

describe('getFolderState', () => {
  const tree = dir('src', [file('a.ts'), file('b.ts')]);

  it('returns unchecked when no files are selected', () => {
    expect(getFolderState(tree, new Set(), 'src')).toBe('unchecked');
  });

  it('returns checked when all files in the directory are selected', () => {
    expect(getFolderState(tree, new Set(['src/a.ts', 'src/b.ts']), 'src')).toBe(
      'checked'
    );
  });

  it('returns indeterminate when some but not all files are selected', () => {
    expect(getFolderState(tree, new Set(['src/a.ts']), 'src')).toBe(
      'indeterminate'
    );
  });

  it('returns unchecked for an empty directory', () => {
    expect(getFolderState(dir('empty'), new Set(), 'empty')).toBe('unchecked');
  });

  it('ignores selected paths outside the directory', () => {
    expect(getFolderState(tree, new Set(['other/file.ts']), 'src')).toBe(
      'unchecked'
    );
  });
});

describe('filterToPattern', () => {
  it('wraps plain text with wildcards', () => {
    expect(filterToPattern('foo')).toBe('*foo*');
  });

  it('leaves a glob pattern with * unchanged', () => {
    expect(filterToPattern('*.yml')).toBe('*.yml');
  });

  it('leaves a glob pattern with ? unchanged', () => {
    expect(filterToPattern('file?.ts')).toBe('file?.ts');
  });

  it('trims whitespace before wrapping plain text', () => {
    expect(filterToPattern('  foo  ')).toBe('*foo*');
  });

  it('trims whitespace before preserving a glob', () => {
    expect(filterToPattern('  *.yml  ')).toBe('*.yml');
  });

  it('handles empty string after trimming', () => {
    expect(filterToPattern('   ')).toBe('**');
  });
});
