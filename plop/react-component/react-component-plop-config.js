module.exports = () => ({
  prompts: [
    {
      type: 'input',
      name: 'name',
      message: 'component name please',
    },
    {
      type: 'confirm',
      name: 'addStyles',
      default: false,
      when: false,
    },
  ], // array of inquirer prompts
  actions: ({ addStyles }) => {
    return [
      {
        type: 'add',
        path: `{{cwd}}/{{pascalCase name}}/index.ts`,
        templateFile: './plop/react-component/index.ts.hbs',
      },
      {
        type: 'add',
        path: `{{cwd}}/{{pascalCase name}}/{{pascalCase name}}.tsx`,
        templateFile: './plop/react-component/component.tsx.hbs',
      },
      {
        type: 'add',
        path: `{{cwd}}/{{pascalCase name}}/{{pascalCase name}}.test.tsx`,
        templateFile: './plop/react-component/component.test.tsx.hbs',
      },
      {
        type: 'add',
        path: `{{cwd}}/{{pascalCase name}}/{{pascalCase name}}.stories.tsx`,
        templateFile: './plop/react-component/component.stories.tsx.hbs',
      },
      addStyles && {
        type: 'add',
        path: `{{cwd}}/{{pascalCase name}}/{{pascalCase name}}.module.css`,
        templateFile: './plop/react-component/component.module.css.hbs',
      },
    ].filter(Boolean);
  },
});
