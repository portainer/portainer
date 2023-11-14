import { PropsWithChildren, useEffect, useMemo } from 'react';
import { useTransitionHook } from '@uirouter/react';

import { BROWSER_OS_PLATFORM } from '@/react/constants';

import { CodeEditor } from '@@/CodeEditor';
import { Tooltip } from '@@/Tip/Tooltip';

import { FormSectionTitle } from './form-components/FormSectionTitle';
import { FormError } from './form-components/FormError';
import { confirm } from './modals/confirm';
import { ModalType } from './modals';
import { buildConfirmButton } from './modals/utils';

const otherEditorConfig = {
  tooltip: (
    <>
      <div>Ctrl+F - Start searching</div>
      <div>Ctrl+G - Find next</div>
      <div>Ctrl+Shift+G - Find previous</div>
      <div>Ctrl+Shift+F - Replace</div>
      <div>Ctrl+Shift+R - Replace all</div>
      <div>Alt+G - Jump to line</div>
      <div>Persistent search:</div>
      <div className="ml-5">Enter - Find next</div>
      <div className="ml-5">Shift+Enter - Find previous</div>
    </>
  ),
  searchCmdLabel: 'Ctrl+F for search',
} as const;

const editorConfig = {
  mac: {
    tooltip: (
      <>
        <div>Cmd+F - Start searching</div>
        <div>Cmd+G - Find next</div>
        <div>Cmd+Shift+G - Find previous</div>
        <div>Cmd+Option+F - Replace</div>
        <div>Cmd+Option+R - Replace all</div>
        <div>Option+G - Jump to line</div>
        <div>Persistent search:</div>
        <div className="ml-5">Enter - Find next</div>
        <div className="ml-5">Shift+Enter - Find previous</div>
      </>
    ),
    searchCmdLabel: 'Cmd+F for search',
  },

  lin: otherEditorConfig,
  win: otherEditorConfig,
} as const;

interface Props {
  value: string;
  onChange: (value: string) => void;

  id: string;
  placeholder?: string;
  yaml?: boolean;
  readonly?: boolean;
  hideTitle?: boolean;
  error?: string;
  height?: string;
}

export function WebEditorForm({
  id,
  onChange,
  placeholder,
  value,
  hideTitle,
  readonly,
  yaml,
  children,
  error,
  height,
}: PropsWithChildren<Props>) {
  return (
    <div>
      <div className="web-editor overflow-x-hidden">
        {!hideTitle && (
          <FormSectionTitle htmlFor={id}>
            Web editor
            <div className="text-muted small vertical-center ml-auto">
              {editorConfig[BROWSER_OS_PLATFORM].searchCmdLabel}

              <Tooltip message={editorConfig[BROWSER_OS_PLATFORM].tooltip} />
            </div>
          </FormSectionTitle>
        )}

        {children && (
          <div className="form-group text-muted small">
            <div className="col-sm-12 col-lg-12">{children}</div>
          </div>
        )}

        {error && <FormError>{error}</FormError>}

        <div className="form-group">
          <div className="col-sm-12 col-lg-12">
            <CodeEditor
              id={id}
              placeholder={placeholder}
              readonly={readonly}
              yaml={yaml}
              value={value}
              onChange={onChange}
              height={height}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function usePreventExit(
  initialValue: string,
  value: string,
  check: boolean
) {
  const isChanged = useMemo(
    () => cleanText(initialValue) !== cleanText(value),
    [initialValue, value]
  );

  const preventExit = check && isChanged;

  // when navigating away from the page with unsaved changes, show a portainer prompt to confirm
  useTransitionHook('onBefore', {}, async () => {
    if (!preventExit) {
      return true;
    }
    const confirmed = await confirm({
      modalType: ModalType.Warn,
      title: 'Are you sure?',
      message:
        'You currently have unsaved changes in the text editor. Are you sure you want to leave?',
      confirmButton: buildConfirmButton('Yes', 'danger'),
    });
    return confirmed;
  });

  // when reloading or exiting the page with unsaved changes, show a browser prompt to confirm
  useEffect(() => {
    function handler(event: BeforeUnloadEvent) {
      if (!preventExit) {
        return undefined;
      }

      event.preventDefault();
      // eslint-disable-next-line no-param-reassign
      event.returnValue = '';
      return '';
    }

    // if the form is changed, then set the onbeforeunload
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [preventExit]);
}

function cleanText(value: string) {
  return value.replace(/(\r\n|\n|\r)/gm, '');
}
