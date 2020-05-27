module.exports = function (plop) {
  // use of INIT_CWD instead of process.cwd() because yarn changes the cwd
  const cwd = process.env.INIT_CWD;
  plop.addHelper('cwd', () => cwd);
  plop.setGenerator('component', {
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'component name please',
      },
      {
        type: 'input',
        name: 'module',
        message: 'module name please',
        default: `${getCurrentPortainerModule(cwd)}`,
        // when: false
      },
    ], // array of inquirer prompts
    actions: [
      {
        type: 'add',
        path: `{{cwd}}/{{dashCase name}}/index.js`,
        templateFile: './app/plop-templates/component.js.hbs',
      },
      {
        type: 'add',
        path: `{{cwd}}/{{dashCase name}}/{{camelCase name}}Controller.js`,
        templateFile: './app/plop-templates/component-controller.js.hbs',
      },
      {
        type: 'add',
        path: `{{cwd}}/{{dashCase name}}/{{camelCase name}}.html`,
        templateFile: './app/plop-templates/component.html.hbs',
      },
    ], // array of actions
  });
};

function getCurrentPortainerModule(cwd) {
  const match = cwd.match(/\/app\/([^\/]*)(\/.*)?$/);
  if (!match) {
    return 'app';
  }
  return match[1];
}
