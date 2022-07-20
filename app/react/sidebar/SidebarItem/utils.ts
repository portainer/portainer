import { ReactNode, ReactElement, Children } from 'react';

function isReactElement(element: ReactNode): element is ReactElement {
  return (
    !!element &&
    typeof element === 'object' &&
    'type' in element &&
    'props' in element
  );
}

export function getPathsForChildren(children: ReactNode): string[] {
  return Children.map(children, (child) => getPaths(child, []))?.flat() || [];
}

export function getPaths(element: ReactNode, paths: string[]): string[] {
  if (!isReactElement(element)) {
    return paths;
  }

  if (typeof element.props.to === 'undefined') {
    return Children.map(element.props.children, (child) =>
      getPaths(child, paths)
    );
  }

  return [element.props.to, ...paths];
}
