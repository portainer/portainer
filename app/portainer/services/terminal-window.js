angular.module('portainer').service('TerminalWindow', function ($window) {
  const terminalHeight = 495;
  this.terminalopen = function () {
    const contentWrapperHeight = $window.innerHeight;
    const newContentWrapperHeight = contentWrapperHeight - terminalHeight;
    document.getElementById('content-wrapper').style.height = newContentWrapperHeight + 'px';
    document.getElementById('content-wrapper').style.overflowY = 'auto';
    document.getElementById('sidebar-wrapper').style.height = newContentWrapperHeight + 'px';
  };
  this.terminalclose = function () {
    const wrapperCSS = {
      height: '100%',
      overflowY: 'initial',
    };
    document.getElementById('content-wrapper').style.height = wrapperCSS.height;
    document.getElementById('content-wrapper').style.overflowY = wrapperCSS.overflowY;
    document.getElementById('sidebar-wrapper').style.height = wrapperCSS.height;
  };
  this.terminalresize = function () {
    const contentWrapperHeight = $window.innerHeight;
    const newContentWrapperHeight = contentWrapperHeight - terminalHeight;
    document.getElementById('content-wrapper').style.height = newContentWrapperHeight + 'px';
    document.getElementById('content-wrapper').style.overflowY = 'auto';
    document.getElementById('sidebar-wrapper').style.height = newContentWrapperHeight + 'px';
  };
});
