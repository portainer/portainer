import controller from './nomadLogViewerController';

export const nomadLogViewer = {
  templateUrl: './nomadLogViewer.html',
  controller,
  bindings: {
    stderrLog: '<',
    stdoutLog: '<',
    resourceName: '<',
    logCollectionChange: '<',
  },
};
