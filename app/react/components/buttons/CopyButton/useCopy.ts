import { useEffect, useState } from 'react';

export function useCopy(copyText: string, fadeDelay = 1000) {
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
    // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard
    // https://caniuse.com/?search=clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(copyText);
    } else {
      // https://stackoverflow.com/a/57192718
      const inputEl = document.createElement('textarea');
      inputEl.value = copyText;
      document.body.appendChild(inputEl);
      inputEl.select();
      document.execCommand('copy');
      inputEl.hidden = true;
      document.body.removeChild(inputEl);
    }
    setCopiedSuccessfully(true);
  }

  return { handleCopy, copiedSuccessfully };
}
