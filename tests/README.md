# 🧪 Test Suite Intensiva - PWA Gestionale Spese Famiglia

Suite completa di test automatici per API, autenticazione e funzionalità PWA.

## 📋 Indice

- [🚀 Quick Start](#-quick-start)
- [🔧 Installazione](#-installazione)
- [🎯 Tipi di Test](#-tipi-di-test)
- [📱 Interfaccia Web](#-interfaccia-web)
- [⚡ Script Automatici](#-script-automatici)
- [🧪 Jest Testing](#-jest-testing)
- [🔄 CI/CD Integration](#-cicd-integration)
- [📊 Report e Risultati](#-report-e-risultati)
- [🛠️ Configurazione](#️-configurazione)
- [🐛 Troubleshooting](#-troubleshooting)

## 🚀 Quick Start

```bash
# 1. Installa dipendenze
npm install

# 2. Test rapido locale
npm run test:local

# 3. Interfaccia web
npm run start:test-server
# Apri http://localhost:8080

# 4. Test completo con Jest
npm test
```

## 🔧 Installazione

### Prerequisiti

- Node.js >= 16.0.0
- npm >= 8.0.0
- Applicazione PWA in esecuzione (locale o Vercel)

### Setup

```bash
# Clona e naviga nella cartella tests
cd tests

# Installa dipendenze
npm install

# Verifica configurazione
npm run validate:config

# Test di connettività
npm run test:automated -- --type=health
```

## 🎯 Tipi di Test

### 🔐 Test Autenticazione
- Registrazione utente
- Login/Logout
- Gestione sessioni
- Validazione token
- Sicurezza password

### 🌐 Test API
- CRUD Famiglie
- CRUD Categorie
- CRUD Spese
- Gestione membri
- Validazione dati
- Rate limiting

### 📱 Test PWA
- Web App Manifest
- Service Worker
- Icone e assets
- Installabilità
- Funzionalità offline
- Cache strategies

### 🔒 Test Sicurezza
- Headers di sicurezza
- Protezione endpoint
- Validazione input
- XSS/CSRF protection
- HTTPS enforcement

### ⚡ Test Performance
- Tempo di risposta API
- Dimensione payload
- Compressione
- Core Web Vitals
- Bundle analysis

### 🔄 Test End-to-End
- Flussi utente completi
- Integrazione componenti
- Scenari realistici

## 📱 Interfaccia Web

### Avvio

```bash
npm run start:test-server
```

Apri [http://localhost:8080](http://localhost:8080)

### Funzionalità

- **Dashboard**: Panoramica stato test
- **Test Manuali**: Esecuzione test singoli
- **Monitoraggio Real-time**: Risultati in tempo reale
- **Report Visivi**: Grafici e statistiche
- **Export Risultati**: Download report JSON/HTML

### Screenshot

```
┌─────────────────────────────────────┐
│  🧪 PWA Test Dashboard             │
├─────────────────────────────────────┤
│  📊 Status: ✅ 45/50 test passed   │
│  ⏱️  Durata: 2m 34s                │
│  🎯 Coverage: 89%                  │
├─────────────────────────────────────┤
│  [🔐 Auth] [🌐 API] [📱 PWA]       │
│  [🔒 Security] [⚡ Performance]    │
└─────────────────────────────────────┘
```

## ⚡ Script Automatici

### Comandi Principali

```bash
# Test completo automatico
npm run test:automated

# Test ambiente specifico
npm run test:automated:local
npm run test:automated:vercel

# Test per categoria
node automated-test.js --type=auth
node automated-test.js --type=api
node automated-test.js --type=pwa

# Test con opzioni
node automated-test.js --env=vercel --type=all --verbose
```

### Parametri Disponibili

- `--env`: `local` | `vercel`
- `--type`: `all` | `auth` | `api` | `pwa` | `health`
- `--verbose`: Output dettagliato
- `--timeout`: Timeout personalizzato (ms)
- `--retries`: Numero di retry

### Output

```
🧪 PWA Test Suite v1.0.0
📍 Environment: local (http://localhost:3000)
🎯 Test Type: all

🔐 Authentication Tests
  ✅ User Registration (1.2s)
  ✅ User Login (0.8s)
  ✅ Session Validation (0.5s)

🌐 API Tests
  ✅ Create Family (1.1s)
  ✅ List Categories (0.3s)
  ✅ Create Category (0.9s)
  ✅ List Expenses (0.4s)

📱 PWA Tests
  ✅ Web App Manifest (0.2s)
  ✅ Service Worker (0.3s)
  ✅ PWA Icons (0.8s)

📊 Results: 8/8 passed (100%) in 6.3s
💾 Report saved: test-report-1703123456789.json
```

## 🧪 Jest Testing

### Comandi Jest

```bash
# Test completo
npm test

# Test con watch mode
npm run test:watch

# Test con coverage
npm run test:coverage

# Test specifici
npm run test:auth
npm run test:api
npm run test:pwa
npm run test:security
npm run test:performance
npm run test:e2e

# Test ambiente specifico
npm run test:local
npm run test:vercel
```

### Struttura Test

```javascript
describe('🔐 Test Autenticazione', () => {
  test('Registrazione utente', async () => {
    const testData = testUtils.generateTestData();
    
    const { result, duration } = await testUtils.measurePerformance(
      () => fetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(testData)
      })
    );
    
    expect(result.status).toBe(201);
    expect(duration).toBeWithinPerformanceLimit(3000);
  });
});
```

### Matchers Personalizzati

```javascript
// Validazione risposta API
expect(response).toBeValidApiResponse();

// Validazione email
expect(email).toBeValidEmail();

// Performance
expect(duration).toBeWithinPerformanceLimit(5000);
```

## 🔄 CI/CD Integration

### GitHub Actions

Il workflow `.github/workflows/test-suite.yml` esegue automaticamente:

- **Vercel Deployment Tests**: Test su ambiente di produzione
- **Local Development Tests**: Test su ambiente locale
- **Security Tests**: Audit sicurezza
- **Performance Tests**: Lighthouse CI
- **Notifications**: Notifiche risultati

### Trigger

- Push su `main` e `develop`
- Pull Request su `main`
- Schedule giornaliero
- Manual dispatch

### Configurazione

```yaml
# .github/workflows/test-suite.yml
name: 🧪 PWA Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC
  workflow_dispatch:
```

## 📊 Report e Risultati

### Formati Report

1. **JSON**: Dati strutturati per integrazione
2. **HTML**: Report visuale con grafici
3. **Console**: Output real-time
4. **GitHub**: Summary nei workflow

### Struttura Report JSON

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "environment": "vercel",
  "baseUrl": "https://famiglia-pwa.vercel.app",
  "summary": {
    "total": 50,
    "passed": 47,
    "failed": 3,
    "duration": 45.6,
    "passRate": 94
  },
  "categories": {
    "auth": { "passed": 8, "failed": 0 },
    "api": { "passed": 15, "failed": 1 },
    "pwa": { "passed": 12, "failed": 0 },
    "security": { "passed": 8, "failed": 1 },
    "performance": { "passed": 4, "failed": 1 }
  },
  "tests": [
    {
      "name": "User Registration",
      "category": "auth",
      "status": "passed",
      "duration": 1.2,
      "details": "✅ Status: 201, Duration: 1.2s"
    }
  ]
}
```

### Metriche Monitorate

- **Pass Rate**: Percentuale test superati
- **Performance**: Tempo di risposta medio
- **Coverage**: Copertura funzionalità
- **Reliability**: Stabilità nel tempo
- **Security Score**: Punteggio sicurezza

## 🛠️ Configurazione

### Variabili Ambiente

```bash
# .env.test
TEST_BASE_URL=http://localhost:3000
TEST_TIMEOUT=30000
TEST_RETRY_COUNT=3
TEST_USER_EMAIL=test@famiglia.com
TEST_USER_PASSWORD=password123
DEBUG=true
```

### Configurazione automated-test.js

```javascript
const CONFIG = {
  LOCAL_URL: 'http://localhost:3000',
  VERCEL_URL: 'https://famiglia-pwa.vercel.app',
  TIMEOUT: 30000,
  RETRY_COUNT: 3,
  TEST_USER: {
    email: 'test@famiglia.com',
    password: 'password123',
    username: 'testuser',
    name: 'Test User'
  }
};
```

### Configurazione Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## 🐛 Troubleshooting

### Problemi Comuni

#### ❌ Connessione Fallita

```bash
# Verifica servizio
curl -I http://localhost:3000

# Test connettività
npm run test:automated -- --type=health

# Debug verbose
DEBUG=true npm test
```

#### ❌ Test Timeout

```bash
# Aumenta timeout
TEST_TIMEOUT=60000 npm test

# Test singolo
npm test -- --testNamePattern="User Registration"
```

#### ❌ Autenticazione Fallita

```bash
# Verifica credenziali
node -e "console.log(require('./automated-test').CONFIG.TEST_USER)"

# Reset database test
npm run db:reset:test
```

#### ❌ PWA Assets Mancanti

```bash
# Verifica manifest
curl http://localhost:3000/manifest.json

# Verifica service worker
curl http://localhost:3000/sw.js

# Build assets
npm run build
```

### Debug Avanzato

```bash
# Log dettagliati
DEBUG=* npm test

# Test specifico con debug
DEBUG=true npm test -- --testNamePattern="API"

# Analisi performance
npm run test:performance -- --verbose

# Report coverage
npm run test:coverage
open coverage/lcov-report/index.html
```

### Log Files

- `test-reports/`: Report HTML Jest
- `coverage/`: Report coverage
- `test-report-*.json`: Report automatici
- `npm-debug.log`: Log npm

## 📚 Risorse Aggiuntive

### Documentazione

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [PWA Testing Guide](https://web.dev/pwa-testing/)

### Best Practices

1. **Isolamento**: Ogni test deve essere indipendente
2. **Cleanup**: Rimuovi dati di test dopo l'esecuzione
3. **Performance**: Monitora tempi di esecuzione
4. **Retry**: Implementa retry per test flaky
5. **Mocking**: Usa mock per dipendenze esterne

### Contribuire

1. Fork del repository
2. Crea branch feature (`git checkout -b feature/new-test`)
3. Aggiungi test con documentazione
4. Commit (`git commit -m 'Add: new security test'`)
5. Push (`git push origin feature/new-test`)
6. Crea Pull Request

---

## 🎯 Quick Commands Reference

```bash
# Setup rapido
npm install && npm run validate:config

# Test completo
npm test

# Interfaccia web
npm run start:test-server

# Test automatico locale
npm run test:automated:local

# Test automatico Vercel
npm run test:automated:vercel

# Coverage report
npm run test:coverage

# Debug mode
DEBUG=true npm test
```

**🚀 Happy Testing!** 🧪✨