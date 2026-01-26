/* spell-checker: ignore tseslint */
import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import importPlugin from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{js,ts}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2018,
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      quotes: ['warn', 'single'],
      'quote-props': ['warn', 'as-needed'],
      'import/order': [
        'warn',
        { 'newlines-between': 'never', alphabetize: { order: 'asc' } }
      ],
      'sort-imports': [
        'warn',
        { ignoreDeclarationSort: true, ignoreCase: true }
      ],
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-inferrable-types': [
        'warn',
        { ignoreParameters: true }
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'none',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
])
