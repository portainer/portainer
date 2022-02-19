module.exports = (cwd) => ({
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
      templateFile: './plop/ng-component/component.js.hbs',
    },
    {
      type: 'add',
      path: `{{cwd}}/{{dashCase name}}/{{dashCase name}}.controller.js`,
      templateFile: './plop/ng-component/component-controller.js.hbs',
    },
    {
      type: 'add',
      path: `{{cwd}}/{{dashCase name}}/{{dashCase name}}.html`,
      templateFile: './plop/ng-component/component.html.hbs',
    },
  ], // array of actions
});

function getCurrentPortainerModule(cwd) {
  const match = cwd.match(/\/app\/([^\/]*)(\/.*)?$/);
  if (!match || !match.length || match[1] === 'portainer') {
    return 'app';
  }
  return match[1];
}
