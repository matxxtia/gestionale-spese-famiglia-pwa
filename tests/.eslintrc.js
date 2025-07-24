module.exports = {
  env: {
    node: true,
    jest: true,
    es2021: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  globals: {
    fetch: 'readonly',
    testUtils: 'readonly',
    TEST_CONFIG: 'readonly'
  },
  rules: {
    // Regole generali
    'no-console': 'off', // Permesso nei test
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Regole per test
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
    
    // Stile codice
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    
    // Sicurezza
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Performance
    'no-await-in-loop': 'warn',
    'prefer-promise-reject-errors': 'error'
  },
  plugins: [
    'jest'
  ],
  overrides: [
    {
      files: ['*.test.js'],
      rules: {
        'max-lines': ['warn', 1000],
        'max-lines-per-function': ['warn', 100]
      }
    },
    {
      files: ['automated-test.js'],
      rules: {
        'max-lines': ['warn', 2000],
        'complexity': ['warn', 15]
      }
    }
  ]
};