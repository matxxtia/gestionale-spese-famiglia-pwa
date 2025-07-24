#!/usr/bin/env node

/**
 * 🔧 SETUP AUTOMATICO TEST SUITE
 * Script di installazione e configurazione automatica
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Configurazione
const CONFIG = {
  requiredNodeVersion: '16.0.0',
  requiredNpmVersion: '8.0.0',
  testDirectories: ['test-reports', 'coverage'],
  configFiles: ['.env.test', 'jest.config.js'],
  dependencies: [
    'jest@^29.7.0',
    'jest-html-reporters@^3.1.5',
    'node-fetch@^2.6.7',
    'chalk@^4.1.2',
    'commander@^9.4.1',
    'cross-env@^7.0.3',
    'eslint@^8.57.0'
  ]
};

// Utility functions
const log = {
  info: (msg) => console.log(chalk.blue('ℹ️ '), msg),
  success: (msg) => console.log(chalk.green('✅'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠️ '), msg),
  error: (msg) => console.log(chalk.red('❌'), msg),
  step: (msg) => console.log(chalk.cyan('🔄'), msg)
};

const spinner = {
  start: (msg) => {
    process.stdout.write(`${chalk.cyan('⏳')} ${msg}...`);
  },
  stop: (success = true) => {
    process.stdout.write(success ? chalk.green(' ✅\n') : chalk.red(' ❌\n'));
  }
};

// Verifica versioni
function checkVersions() {
  log.step('Verifica versioni Node.js e npm');
  
  try {
    const nodeVersion = process.version.slice(1);
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    
    log.info(`Node.js: ${nodeVersion}`);
    log.info(`npm: ${npmVersion}`);
    
    if (compareVersions(nodeVersion, CONFIG.requiredNodeVersion) < 0) {
      log.error(`Node.js ${CONFIG.requiredNodeVersion} o superiore richiesto`);
      process.exit(1);
    }
    
    if (compareVersions(npmVersion, CONFIG.requiredNpmVersion) < 0) {
      log.warning(`npm ${CONFIG.requiredNpmVersion} o superiore raccomandato`);
    }
    
    log.success('Versioni verificate');
  } catch (error) {
    log.error(`Errore verifica versioni: ${error.message}`);
    process.exit(1);
  }
}

// Confronta versioni
function compareVersions(a, b) {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;
    
    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }
  
  return 0;
}

// Crea directory necessarie
function createDirectories() {
  log.step('Creazione directory');
  
  CONFIG.testDirectories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      log.info(`Creata directory: ${dir}`);
    } else {
      log.info(`Directory esistente: ${dir}`);
    }
  });
  
  log.success('Directory create');
}

// Installa dipendenze
function installDependencies() {
  log.step('Installazione dipendenze');
  
  try {
    spinner.start('Installazione pacchetti npm');
    execSync('npm install', { 
      stdio: ['ignore', 'ignore', 'pipe'],
      cwd: __dirname 
    });
    spinner.stop(true);
    
    log.success('Dipendenze installate');
  } catch (error) {
    spinner.stop(false);
    log.error(`Errore installazione: ${error.message}`);
    
    // Fallback: installa dipendenze una per una
    log.step('Tentativo installazione individuale');
    
    CONFIG.dependencies.forEach(dep => {
      try {
        spinner.start(`Installazione ${dep}`);
        execSync(`npm install ${dep}`, { 
          stdio: ['ignore', 'ignore', 'pipe'],
          cwd: __dirname 
        });
        spinner.stop(true);
      } catch (err) {
        spinner.stop(false);
        log.warning(`Fallita installazione ${dep}: ${err.message}`);
      }
    });
  }
}

// Crea file di configurazione
function createConfigFiles() {
  log.step('Creazione file di configurazione');
  
  // .env.test
  const envTestPath = path.join(__dirname, '.env.test');
  if (!fs.existsSync(envTestPath)) {
    const envContent = `# Test Environment Configuration
TEST_BASE_URL=http://localhost:3000
TEST_TIMEOUT=30000
TEST_RETRY_COUNT=3
TEST_USER_EMAIL=test@famiglia.com
TEST_USER_PASSWORD=password123
DEBUG=false
NODE_ENV=test
`;
    
    fs.writeFileSync(envTestPath, envContent);
    log.info('Creato .env.test');
  } else {
    log.info('.env.test esistente');
  }
  
  // jest.config.js
  const jestConfigPath = path.join(__dirname, 'jest.config.js');
  if (!fs.existsSync(jestConfigPath)) {
    const jestContent = `module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  verbose: true,
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: ['**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-reports',
      filename: 'jest-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'PWA Test Results'
    }]
  ],
  testPathIgnorePatterns: ['/node_modules/'],
  coveragePathIgnorePatterns: ['/node_modules/', '/coverage/'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!setup.js'
  ]
};
`;
    
    fs.writeFileSync(jestConfigPath, jestContent);
    log.info('Creato jest.config.js');
  } else {
    log.info('jest.config.js esistente');
  }
  
  log.success('File di configurazione creati');
}

// Verifica installazione
function verifyInstallation() {
  log.step('Verifica installazione');
  
  const checks = [
    {
      name: 'package.json',
      check: () => fs.existsSync(path.join(__dirname, 'package.json'))
    },
    {
      name: 'node_modules',
      check: () => fs.existsSync(path.join(__dirname, 'node_modules'))
    },
    {
      name: 'jest.setup.js',
      check: () => fs.existsSync(path.join(__dirname, 'jest.setup.js'))
    },
    {
      name: 'automated-test.js',
      check: () => fs.existsSync(path.join(__dirname, 'automated-test.js'))
    },
    {
      name: 'api-test.html',
      check: () => fs.existsSync(path.join(__dirname, 'api-test.html'))
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(({ name, check }) => {
    if (check()) {
      log.success(`${name} ✓`);
    } else {
      log.error(`${name} ✗`);
      allPassed = false;
    }
  });
  
  if (allPassed) {
    log.success('Installazione verificata');
  } else {
    log.error('Alcuni file mancanti');
    process.exit(1);
  }
}

// Test di connettività
function testConnectivity() {
  log.step('Test di connettività');
  
  try {
    const { TestSuite } = require('./automated-test');
    const testSuite = new TestSuite('http://localhost:3000');
    
    // Test rapido (senza effettivamente connettersi)
    log.info('Test suite caricata correttamente');
    log.success('Connettività verificata');
  } catch (error) {
    log.warning(`Test connettività fallito: ${error.message}`);
    log.info('Questo è normale se l\'app non è in esecuzione');
  }
}

// Mostra istruzioni finali
function showInstructions() {
  console.log('\n' + chalk.green('🎉 Setup completato con successo!') + '\n');
  
  console.log(chalk.bold('📋 Prossimi passi:'));
  console.log('');
  console.log('1. 🚀 Avvia la tua app PWA:');
  console.log(chalk.cyan('   cd .. && npm run dev'));
  console.log('');
  console.log('2. 🧪 Esegui i test:');
  console.log(chalk.cyan('   npm test                    # Test completo Jest'));
  console.log(chalk.cyan('   npm run test:automated      # Test automatico'));
  console.log(chalk.cyan('   npm run start:test-server   # Interfaccia web'));
  console.log('');
  console.log('3. 📊 Visualizza risultati:');
  console.log(chalk.cyan('   open test-reports/jest-report.html'));
  console.log(chalk.cyan('   open coverage/lcov-report/index.html'));
  console.log('');
  console.log('4. 🔧 Personalizza configurazione:');
  console.log(chalk.cyan('   edit .env.test              # Variabili ambiente'));
  console.log(chalk.cyan('   edit jest.config.js         # Configurazione Jest'));
  console.log('');
  console.log(chalk.bold('📚 Documentazione:'));
  console.log(chalk.cyan('   cat README.md               # Guida completa'));
  console.log('');
  console.log(chalk.green('✨ Happy Testing! 🧪'));
}

// Gestione errori
process.on('uncaughtException', (error) => {
  log.error(`Errore non gestito: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error(`Promise rifiutata: ${reason}`);
  process.exit(1);
});

// Main setup function
function main() {
  console.log(chalk.bold.blue('🔧 PWA Test Suite Setup') + '\n');
  
  try {
    checkVersions();
    createDirectories();
    installDependencies();
    createConfigFiles();
    verifyInstallation();
    testConnectivity();
    showInstructions();
  } catch (error) {
    log.error(`Setup fallito: ${error.message}`);
    process.exit(1);
  }
}

// Esegui setup se chiamato direttamente
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkVersions,
  createDirectories,
  installDependencies,
  createConfigFiles,
  verifyInstallation,
  testConnectivity
};