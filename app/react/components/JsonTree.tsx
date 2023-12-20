import { ComponentProps } from 'react';
import { JsonView, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import clsx from 'clsx';

import './JsonTree.css';

export function JsonTree({ style, ...props }: ComponentProps<typeof JsonView>) {
  const currentStyle = getCurrentStyle(style);
  return (
    <JsonView
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      style={currentStyle}
    />
  );
}

type StyleProps = ComponentProps<typeof JsonView>['style'];

function getCurrentStyle(style: StyleProps | undefined): StyleProps {
  if (style) {
    return style;
  }

  return {
    ...defaultStyles,
    container: 'json-tree',
    booleanValue: 'leaf-value',
    nullValue: 'leaf-value',
    otherValue: 'leaf-value',
    numberValue: 'leaf-value',
    stringValue: 'leaf-value',
    undefinedValue: 'leaf-value',
    label: 'key',
    punctuation: 'leaf-value',
    collapseIcon: clsx(defaultStyles.collapseIcon, 'key'),
    expandIcon: clsx(defaultStyles.expandIcon, 'key'),
    collapsedContent: clsx(defaultStyles.collapsedContent, 'branch-preview'),
  };
}
