import { useMemo } from 'react';
import {
  StreamLanguage,
  LanguageSupport,
  syntaxHighlighting,
  indentService,
} from '@codemirror/language';
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import {
  oneDarkHighlightStyle,
  keymap,
  Extension,
} from '@uiw/react-codemirror';
import type { JSONSchema7 } from 'json-schema';
import { lintKeymap, lintGutter } from '@codemirror/lint';
import { defaultKeymap } from '@codemirror/commands';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { yamlCompletion, yamlSchema } from 'yaml-schema';
import { compact } from 'lodash';
import { lineNumbers } from '@codemirror/view';

export type CodeEditorType = 'yaml' | 'shell' | 'dockerfile';

// Custom indentation service for YAML
const yamlIndentExtension = indentService.of((context, pos) => {
  const prevLine = context.lineAt(pos, -1);
  const prevIndent = /^\s*/.exec(prevLine.text)?.[0].length || 0;
  if (/:\s*$/.test(prevLine.text)) {
    return prevIndent + 2;
  }
  return prevIndent;
});

const dockerFileLanguage = new LanguageSupport(
  StreamLanguage.define(dockerFile)
);
const shellLanguage = new LanguageSupport(StreamLanguage.define(shell));

function yamlLanguage(schema?: JSONSchema7) {
  const [yaml, linter, , , stateExtensions] = yamlSchema(schema);

  return compact([
    yaml,
    linter,
    stateExtensions,
    yamlIndentExtension,
    syntaxHighlighting(oneDarkHighlightStyle),
    // explicitly setting lineNumbers() as an extension ensures that the gutter order is the same between the diff viewer and the code editor
    lineNumbers(),
    !!schema && lintGutter(),
    keymap.of([...defaultKeymap, ...completionKeymap, ...lintKeymap]),
    // only show completions when a schema is provided
    !!schema &&
      autocompletion({
        icons: false,
        activateOnTypingDelay: 300,
        selectOnOpen: true,
        activateOnTyping: true,
        override: [
          (ctx) => {
            const getCompletions = yamlCompletion();
            const completions = getCompletions(ctx);
            if (Array.isArray(completions)) {
              return null;
            }
            completions.validFor = /^\w*$/;
            return completions;
          },
        ],
      }),
  ]);
}

export function useCodeEditorExtensions(
  type?: CodeEditorType,
  schema?: JSONSchema7
): Extension[] {
  return useMemo(() => {
    switch (type) {
      case 'dockerfile':
        return [dockerFileLanguage];
      case 'shell':
        return [shellLanguage];
      case 'yaml':
        return yamlLanguage(schema);
      default:
        return [];
    }
  }, [type, schema]);
}
