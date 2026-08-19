import { ComponentProps } from 'react';
import { JsonView, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import clsx from 'clsx';

import styles from './JsonTree.module.css';

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
    container: styles.jsonTree,
    booleanValue: styles.leafValue,
    nullValue: styles.leafValue,
    otherValue: styles.leafValue,
    numberValue: styles.leafValue,
    stringValue: styles.leafValue,
    undefinedValue: styles.leafValue,
    label: styles.key,
    punctuation: styles.leafValue,
    collapseIcon: clsx(defaultStyles.collapseIcon, styles.chevronIcon),
    expandIcon: clsx(defaultStyles.expandIcon, styles.chevronIcon),
    collapsedContent: clsx(
      defaultStyles.collapsedContent,
      styles.branchPreview
    ),
  };
}
