/* eslint-disable react-hooks/refs */
/* eslint-disable no-console */
import { intersection } from 'lodash';
import { useEffect, useRef } from 'react';

function logPropDifferences(
  newProps: Record<string, unknown>,
  lastProps: Record<string, unknown>,
  verbose: boolean
) {
  const allKeys = intersection(Object.keys(newProps), Object.keys(lastProps));

  const changedKeys: string[] = [];

  allKeys.forEach((key) => {
    const newValue = newProps[key];
    const lastValue = lastProps[key];
    if (newValue !== lastValue) {
      changedKeys.push(key);
    }
  });

  if (changedKeys.length) {
    if (verbose) {
      changedKeys.forEach((key) => {
        const newValue = newProps[key];
        const lastValue = lastProps[key];
        console.log('Key [', key, '] changed');
        console.log('From: ', lastValue);
        console.log('To:   ', newValue);
        console.log('------');
      });
    } else {
      console.log('Changed keys: ', changedKeys.join());
    }
  }
}

export function useDebugPropChanges(
  newProps: Record<string, unknown>,
  verbose: boolean = true
) {
  const lastProps = useRef<Record<string, unknown>>();
  // Should only run when the component re-mounts
  useEffect(() => {
    console.log('Mounted');
  }, []);
  if (lastProps.current) {
    logPropDifferences(newProps, lastProps.current, verbose);
  }
  lastProps.current = newProps;
}
/* eslint-enable react-hooks/refs */
/* eslint-enable no-console */
