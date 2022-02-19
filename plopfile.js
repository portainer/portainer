const angularComponents = require('./plop-templates/angular-component');

module.exports = function (plop) {
  // use of INIT_CWD instead of process.cwd() because yarn changes the cwd
  const cwd = process.env.INIT_CWD;
  plop.addHelper('cwd', () => cwd);
  plop.setGenerator('component', angularComponents(cwd));
};
