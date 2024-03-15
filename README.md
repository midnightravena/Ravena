<p align="center">
		<img width="125" src="https://avatars.githubusercontent.com/u/162970380?s=200&v=4">
	</a>
</p>
<h1 align="center">Ravena</h1>
<p align="center">🐦‍⬛ The minimal & fast library for functional user interfaces</p>
<p align="center">
	<a href="https://license.kabir.sh"><img src="https://img.shields.io/badge/License-MIT-lightgreen.svg" alt="License"></a>
</p>

### Contributing

Check the [CONTRIBUTING](/CONTRIBUTING.md) file for more information about this project and how to help.

### About
An application is a function that uses the concept of drivers, functions that access the real world to provide information and perform effects. Drivers provide input to applications and then handle the output. It's a simple concept with endless potential. Pure functions bring clarity and immutability to application code, making it concise, modular, and easy to reason about.

At its core, Ravena is a runtime that calls drivers and runs a functional application in the imperative browser environment. It uses drivers to get information from the real world and provides them as input to an application function. The function outputs data to various drivers, and Ravena calls the drivers with the output to perform effects on the real world

### Installation
Ravena can be installed with a `<script>` tag or through npm. The view driver uses an extension of the JavaScript language, similar to JSX, that adds HTML-like syntax for creating views.
#### CLI
Ravena CLI can be installed through `npm` and ran with `raven`.

```js
npm install -g ravena-cli
ravena create my-app
```

#### Webpack
```js
npm install ravena-loader
```

```js
// webpack.config.js
module.exports = {
    module: {
        rules: [
            { test: /\.js/, use: "ravena-loader" }
        ]
    }
};
```

#### Rollup
```js
npm install rollup-plugin-ravena
```

```js
// rollup.config.js
import Plugin from "rollup-plugin-ravena";

export default {
    plugins: [
        Plugin()
    ]
};
```

#### Browser
Ravena can be embedded in the browser directly with a script tag. To use the Ravena view language in the browser, Ravena provides a moon-browser module that compiles `<script>` tags with type `"text/ravena"`.

```js
<script src="https://unpkg.com/ravena"></script>
<script src="https://unpkg.com/ravena-browser"></script>

<script type="text/ravena" src="scripts.js"></script>
<script type="text/ravena">
    const paragraph = <p>Hello Moon!</p>;
</script>
```
### Example
```js
const { div, h1, ul, li, input, button }
	= Ravena.view.raven;

const updateTodo = ({ data, view }) => {
	const dataNew = {
		...data,
		todo: view.target.value
	};

	return {
		data: dataNew,
		view: <viewTodos data=dataNew/>
	};
};

const createTodo = ({ data }) => {
	const dataNew = {
		todo: "",
		todos: [...data.todos, data.todo]
	};

	return {
		data: dataNew,
		view: <viewTodos data=dataNew/>
	};
};

const removeTodo = index => ({ data }) => {
	const dataNew = {
		...data,
		todos: data.todos.filter(
			(todo, todoIndex) =>
				todoIndex !== index
		)
	};

	return {
		data: dataNew,
		view: <viewTodos data=dataNew/>
	};
};

const viewTodos = ({ data }) => (
	<div>
		<h1>Todos</h1>
		<input
			type="text"
			placeholder="What needs to be done?"
			value=data.todo
			@input=updateTodo
		/>
		<button @click=createTodo>Create</button>
		<ul children=(data.todos.map((todo, index) =>
			<li @click=(removeTodo(index))>
				{todo}
			</li>
		))/>
	</div>
);

Ravena.use({
	data: Ravena.data.driver,
	view: Ravena.view.driver("#root")
});

Ravena.run(() => {
	const data = {
		todo: "",
		todos: [
			"Learn Moon",
			"Take a nap",
			"Go shopping"
		]
	};

	return {
		data,
		view: <viewTodos data=data/>
	};
});
```
