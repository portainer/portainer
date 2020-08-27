# Plop generator

We use [plop.js](https://plopjs.com/) to generate angular components in our app (in the future we might use it for other things).
in order to create a component with the name `exampleComponent`, go in your terminal to the folder in which you want to create the component (for example, if I want to create it in the portainer module components, I'll go to `./app/portainer/components`). then execute the following line:

```
yarn plop exampleComponent
```

this will create the following files and folders:

```
example-component/index.js - the component file
example-component/exampleComponent.html - the template file
example-component/exampleComponentController.js - the component controller file
```
