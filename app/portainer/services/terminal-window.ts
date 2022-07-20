const terminalHeight = 495;

export function terminalClose() {
  update('100%', 'initial');
}

export function terminalResize() {
  const contentWrapperHeight = window.innerHeight;
  const newContentWrapperHeight = contentWrapperHeight - terminalHeight;
  update(`${newContentWrapperHeight}px`, 'auto');
}

function update(height: string, overflowY: string) {
  const pageWrapper = document.getElementById('pageWrapper-wrapper');

  if (pageWrapper) {
    pageWrapper.style.height = height;
    pageWrapper.style.overflowY = overflowY;
  }
}
