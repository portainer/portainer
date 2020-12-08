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
        templateFile: './plop-templates/component.js.hbs',
      },
      {
        type: 'add',
        path: `{{cwd}}/{{dashCase name}}/{{camelCase name}}Controller.js`,
        templateFile: './plop-templates/component-controller.js.hbs',
      },
      {
        type: 'add',
        path: `{{cwd}}/{{dashCase name}}/{{camelCase name}}.html`,
        templateFile: './plop-templates/component.html.hbs',
      },
    ], // array of actions
  });

  plop.setGenerator('rbacTest', {
    prompts: [
      {
        type: 'list',
        name: 'testType',
        message: 'Select the test type to run:',
        choices: ['Basic', 'Full'],
      },
      {
        type: 'list',
        name: 'platform',
        message: 'Select the platform the test will be run against:',
        choices: ['Docker Swarm', 'Docker Standalone', 'Kubernetes'],
      },
      {
        type: 'list',
        name: 'connectionType',
        message: 'Select the connection used to access the environment:',
        choices: ['Local', 'Agent', 'Edge Agent'],
      },
      {
        type: 'list',
        name: 'resource',
        message: 'Select the resource the test will be run against:',
        choices: ['Endpoint', 'Endpoint Group'],
      },
      {
        type: 'list',
        name: 'authType',
        message: 'Select the authentication type the test will be run with:',
        choices: ['Internal', 'OAuth'],
      },
      {
        type: 'list',
        name: 'role',
        message: 'Select the RBAC role the test will be run with:',
        choices: ['Endpoint administrator', 'Helpdesk', 'Standard user', 'Read-only user'],
      },
    ], // array of inquirer prompts
    actions: [
      {
        type: 'add',
        path: `{{cwd}}/{{dashCase platform}}/{{dashCase connectionType}}-{{dashCase resource}}/{{camelCase role}}{{properCase authType}}.spec.js`,
        templateFile: './plop-templates/rbacTest.spec.js.hbs',
      },
    ], // array of actions
  });
};

function getCurrentPortainerModule(cwd) {
  const match = cwd.match(/\/app\/([^\/]*)(\/.*)?$/);
  if (!match || !match.length || match[1] === 'portainer') {
    return 'app';
  }
  return match[1];
}
