import { useRef, useState, useCallback, useEffect } from 'react';

export function useCaretPosition<
  T extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement,
>() {
  const node = useRef<T>(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);

  const updateCaret = useCallback(() => {
    if (node.current) {
      const { selectionStart, selectionEnd } = node.current;

      setStart(selectionStart || 0);
      setEnd(selectionEnd || 0);
    }
  }, []);

  useEffect(() => {
    if (node.current) {
      node.current.setSelectionRange(start, end);
    }
  });

  return { start, end, ref: node, updateCaret };
}
