const {
    defineConfig,
} = require("eslint/config");

const globals = require("globals");
const tsParser = require("@typescript-eslint/parser");
const _import = require("eslint-plugin-import");
const jsdoc = require("eslint-plugin-jsdoc");
const preferArrow = require("eslint-plugin-prefer-arrow");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");

const {
    fixupPluginRules,
} = require("@eslint/compat");

const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    languageOptions: {
        globals: {
            ...globals.node,
        },

        parser: tsParser,
        "sourceType": "module",

        parserOptions: {
            "project": "tsconfig.json",
        },
    },

    extends: compat.extends(
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
    ),

    plugins: {
        import: fixupPluginRules(_import),
        jsdoc,
        "prefer-arrow": preferArrow,
        "@typescript-eslint": typescriptEslint,
    },

    "rules": {
        "@typescript-eslint/adjacent-overload-signatures": "error",
        "@typescript-eslint/array-type": "off",
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/consistent-type-assertions": "error",
        "@typescript-eslint/dot-notation": "error",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",

        "@typescript-eslint/member-delimiter-style": ["off", {
            "multiline": {
                "delimiter": "none",
                "requireLast": true,
            },

            "singleline": {
                "delimiter": "semi",
                "requireLast": false,
            },
        }],

        "@typescript-eslint/member-ordering": "off",

        "@typescript-eslint/naming-convention": ["off", {
            "selector": "variable",
            "format": ["camelCase", "UPPER_CASE"],
            "leadingUnderscore": "forbid",
            "trailingUnderscore": "forbid",
        }],

        "@typescript-eslint/no-empty-function": "error",
        "@typescript-eslint/no-empty-interface": "error",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-misused-new": "error",
        "@typescript-eslint/no-namespace": "error",
        "@typescript-eslint/no-parameter-properties": "off",

        "@typescript-eslint/no-shadow": ["error", {
            "hoist": "all",
        }],

        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-function-type": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-var-requires": "error",
        "@typescript-eslint/prefer-for-of": "error",
        "@typescript-eslint/prefer-function-type": "error",
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "@typescript-eslint/semi": ["off", null],

        "@typescript-eslint/triple-slash-reference": ["error", {
            "path": "always",
            "types": "prefer-import",
            "lib": "always",
        }],

        "@typescript-eslint/typedef": "off",
        "@typescript-eslint/unified-signatures": "error",
        "arrow-parens": ["off", "always"],
        "comma-dangle": "off",
        "complexity": "off",
        "constructor-super": "error",
        "curly": "error",
        "dot-notation": "off",
        "eqeqeq": ["error", "smart"],
        "guard-for-in": "error",
        "id-denylist": "off",
        "id-match": "off",

        "import/order": ["off", {
            "alphabetize": {
                "caseInsensitive": true,
                "order": "asc",
            },

            "newlines-between": "ignore",

            "groups": [
                ["builtin", "external", "internal", "unknown", "object", "type"],
                "parent",
                ["sibling", "index"],
            ],

            "distinctGroup": false,
            "pathGroupsExcludedImportTypes": [],

            "pathGroups": [{
                "pattern": "./",

                "patternOptions": {
                    "nocomment": true,
                    "dot": true,
                },

                "group": "sibling",
                "position": "before",
            }, {
                "pattern": ".",

                "patternOptions": {
                    "nocomment": true,
                    "dot": true,
                },

                "group": "sibling",
                "position": "before",
            }, {
                "pattern": "..",

                "patternOptions": {
                    "nocomment": true,
                    "dot": true,
                },

                "group": "parent",
                "position": "before",
            }, {
                "pattern": "../",

                "patternOptions": {
                    "nocomment": true,
                    "dot": true,
                },

                "group": "parent",
                "position": "before",
            }],
        }],

        "jsdoc/check-alignment": "error",
        "jsdoc/check-indentation": "off",

        "jsdoc/tag-lines": ["off", "any", {
            "startLines": 1,
        }],

        "max-classes-per-file": ["error", 1],
        "new-parens": "error",
        "no-bitwise": "error",
        "no-caller": "error",
        "no-cond-assign": "error",
        "no-console": "off",
        "no-debugger": "error",
        "no-empty": "error",
        "no-empty-function": "off",
        "no-eval": "error",
        "no-fallthrough": "off",
        "no-invalid-this": "off",
        "no-new-wrappers": "error",
        "no-shadow": "off",
        "no-throw-literal": "error",
        "no-trailing-spaces": "error",
        "no-undef-init": "error",
        "no-underscore-dangle": "off",
        "no-unsafe-finally": "error",
        "no-unused-expressions": "off",
        "no-unused-labels": "error",
        "no-use-before-define": "off",
        "no-var": "error",
        "object-shorthand": "error",
        "one-var": ["error", "never"],
        "prefer-arrow/prefer-arrow-functions": "off",
        "prefer-const": "off",
        "radix": "error",
        "semi": "off",

        "spaced-comment": ["error", "always", {
            "markers": ["/"],
        }],

        "use-isnan": "error",
        "valid-typeof": "off",
    },
}]);
