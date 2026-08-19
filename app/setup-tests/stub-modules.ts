// this file takes care of stubbing modules that are not tested, like
// axios-progress-bar
// toastr

vi.mock('toastr');
vi.mock('axios-progress-bar', () => ({
  loadProgressBar() {},
}));
