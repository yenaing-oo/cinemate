module.exports = {
    root: true,
    ignorePatterns: [".next", "src/components/ui/**"],
    extends: [
        "plugin:@next/next/core-web-vitals-legacy",
        "plugin:react-hooks/recommended",
    ],
    env: {
        browser: true,
        es2022: true,
        node: true,
    },
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
            jsx: true,
        },
    },
    overrides: [
        {
            files: ["**/*.ts", "**/*.tsx"],
            parser: "@typescript-eslint/parser",
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
                project: true,
                tsconfigRootDir: __dirname,
            },
            plugins: ["@typescript-eslint"],
            rules: {
                "@typescript-eslint/array-type": "off",
                "@typescript-eslint/consistent-type-definitions": "off",
                "@typescript-eslint/consistent-type-imports": [
                    "warn",
                    {
                        prefer: "type-imports",
                        fixStyle: "inline-type-imports",
                    },
                ],
                "@typescript-eslint/no-unused-vars": [
                    "warn",
                    { argsIgnorePattern: "^_" },
                ],
                "@typescript-eslint/require-await": "off",
                "@typescript-eslint/no-misused-promises": [
                    "error",
                    { checksVoidReturn: { attributes: false } },
                ],
            },
        },
    ],
    reportUnusedDisableDirectives: true,
};
