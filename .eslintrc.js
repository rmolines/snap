module.exports = {
	root: true,
	env: {
		es2021: true,
		node: true,
	},
	extends: [
		"eslint:recommended",
		"plugin:react/recommended",
		"plugin:react-hooks/recommended",
		"plugin:@typescript-eslint/eslint-recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking",
		"plugin:tailwindcss/recommended",
		"prettier",
	],
	parser: "@typescript-eslint/parser",
	overrides: [
		{
			files: ["*.ts", "*.tsx", "*.js"],
			parser: "@typescript-eslint/parser",
		},
	],
	parserOptions: {
		project: "./tsconfig.json",
		ecmaVersion: "latest",
		sourceType: "module",
	},
	plugins: ["react", "react-native", "react-hooks", "@typescript-eslint"],
};
