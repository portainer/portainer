const angularComponents = require('./plop/ng-component/angular-component-plop-config');

module.exports = function (
  /** @type {import('plop').NodePlopAPI} */
  plop
) {
  // use of INIT_CWD instead of process.cwd() because yarn changes the cwd
  const cwd = process.env.INIT_CWD;
  plop.addHelper('cwd', () => cwd);
  plop.setGenerator('ng-component', angularComponents(cwd));
};
