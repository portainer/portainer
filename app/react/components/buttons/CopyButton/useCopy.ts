import { useEffect, useState } from 'react';

export type CopyTextType = string | (() => string);

export function useCopy(
  copyText: CopyTextType,
  fadeDelay = 1000,
  context: HTMLElement = document.body
) {
  const [copiedSuccessfully, setCopiedSuccessfully] = useState(false);

  useEffect(() => {
    const fadeoutTime = setTimeout(
      () => setCopiedSuccessfully(false),
      fadeDelay
    );
    // clear timeout when component unmounts
    return () => {
      clearTimeout(fadeoutTime);
    };
  }, [copiedSuccessfully, fadeDelay]);

  function handleCopy() {
    const text = typeof copyText === 'function' ? copyText() : copyText;

    if (!text) {
      return;
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard
    // https://caniuse.com/?search=clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      // https://stackoverflow.com/a/57192718
      const inputEl = document.createElement('textarea');
      inputEl.value = text;
      context.appendChild(inputEl);
      inputEl.select();
      document.execCommand('copy');
      inputEl.hidden = true;
      context.removeChild(inputEl);
    }
    setCopiedSuccessfully(true);
  }

  return { handleCopy, copiedSuccessfully };
}
