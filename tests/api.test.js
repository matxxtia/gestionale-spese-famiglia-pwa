/**
 * 🧪 JEST TEST SUITE
 * Test di integrazione per API e autenticazione
 * Utilizzabile con npm test
 */

const { TestSuite, CONFIG } = require('./automated-test');

// Configurazione Jest
jest.setTimeout(30000); // 30 secondi timeout

// Setup globale
let testSuite;
const baseUrl = process.env.TEST_BASE_URL || CONFIG.LOCAL_URL;

beforeAll(async () => {
  testSuite = new TestSuite(baseUrl);
  
  // Verifica che il servizio sia raggiungibile
  const isHealthy = await testSuite.runHealthCheck();
  if (!isHealthy) {
    throw new Error(`Servizio non raggiungibile su ${baseUrl}`);
  }
});

aftereAll(async () => {
  // Cleanup se necessario
  if (testSuite && testSuite.results) {
    const reportFile = `jest-test-report-${Date.now()}.json`;
    testSuite.saveReport(reportFile);
  }
});

describe('🔐 Test Autenticazione', () => {
  test('Registrazione utente', async () => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(baseUrl + '/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: `test-${Date.now()}@famiglia.com`,
          username: `testuser-${Date.now()}`,
          password: 'password123',
          name: 'Test User Jest'
        })
      });
      
      const duration = Date.now() - startTime;
      
      // Verifica status code
      expect([200, 201, 409]).toContain(response.status);
      
      // Verifica performance (< 5 secondi)
      expect(duration).toBeLessThan(5000);
      
      if (response.status !== 409) {
        const data = await response.json();
        expect(data).toBeDefined();
      }
      
    } catch (error) {
      throw new Error(`Test registrazione fallito: ${error.message}`);
    }
  });
  
  test('Login utente', async () => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(baseUrl + '/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: CONFIG.TEST_USER.email,
          password: CONFIG.TEST_USER.password
        })
      });
      
      const duration = Date.now() - startTime;
      
      // Verifica status code
      expect(response.status).toBe(200);
      
      // Verifica performance
      expect(duration).toBeLessThan(3000);
      
      const data = await response.json();
      expect(data).toBeDefined();
      
      // Salva token per test successivi
      if (data.token) {
        testSuite.authToken = data.token;
      }
      
    } catch (error) {
      throw new Error(`Test login fallito: ${error.message}`);
    }
  });
  
  test('Verifica sessione', async () => {
    if (!testSuite.authToken) {
      // Prova a fare login prima
      const loginResponse = await fetch(baseUrl + '/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: CONFIG.TEST_USER.email,
          password: CONFIG.TEST_USER.password
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        testSuite.authToken = loginData.token;
      }
    }
    
    const response = await fetch(baseUrl + '/api/auth/session', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testSuite.authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toBeDefined();
    expect(data.user).toBeDefined();
  });
});

describe('🌐 Test API', () => {
  beforeEach(async () => {
    // Assicurati di avere un token valido
    if (!testSuite.authToken) {
      const loginResponse = await fetch(baseUrl + '/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: CONFIG.TEST_USER.email,
          password: CONFIG.TEST_USER.password
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        testSuite.authToken = loginData.token;
      }
    }
  });
  
  test('Crea famiglia', async () => {
    const response = await fetch(baseUrl + '/api/family', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testSuite.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `Famiglia Test Jest ${Date.now()}`
      })
    });
    
    expect([200, 201]).toContain(response.status);
    
    const data = await response.json();
    expect(data).toBeDefined();
    expect(data.family || data.id).toBeDefined();
  });
  
  test('Lista categorie', async () => {
    const response = await fetch(baseUrl + '/api/categories', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testSuite.authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data) || Array.isArray(data.categories)).toBe(true);
  });
  
  test('Crea categoria', async () => {
    const response = await fetch(baseUrl + '/api/categories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testSuite.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `Test Category Jest ${Date.now()}`,
        icon: '🧪',
        color: '#3b82f6'
      })
    });
    
    expect([200, 201]).toContain(response.status);
    
    const data = await response.json();
    expect(data).toBeDefined();
    expect(data.category || data.id).toBeDefined();
  });
  
  test('Lista spese', async () => {
    const response = await fetch(baseUrl + '/api/expenses', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testSuite.authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data) || Array.isArray(data.expenses)).toBe(true);
  });
});

describe('📱 Test PWA', () => {
  test('Web App Manifest', async () => {
    const response = await fetch(baseUrl + '/manifest.json');
    
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    
    const manifest = await response.json();
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display).toBeDefined();
    expect(manifest.theme_color).toBeDefined();
    expect(manifest.background_color).toBeDefined();
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
  
  test('Service Worker', async () => {
    const response = await fetch(baseUrl + '/sw.js');
    
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('javascript');
    
    const swContent = await response.text();
    expect(swContent).toContain('CACHE_NAME');
    expect(swContent).toContain('install');
    expect(swContent).toContain('fetch');
    expect(swContent).toContain('activate');
  });
  
  test('Icone PWA', async () => {
    const icons = [
      { path: '/icon-192.png', size: '192x192' },
      { path: '/icon-512.png', size: '512x512' }
    ];
    
    for (const icon of icons) {
      const response = await fetch(baseUrl + icon.path);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('image');
      
      // Verifica dimensione file (non troppo grande)
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        expect(parseInt(contentLength)).toBeLessThan(500000); // < 500KB
      }
    }
  });
});

describe('🔒 Test Sicurezza', () => {
  test('Headers di sicurezza', async () => {
    const response = await fetch(baseUrl + '/');
    
    // Verifica headers di sicurezza
    const headers = response.headers;
    
    // Content Security Policy
    expect(headers.get('x-frame-options') || headers.get('content-security-policy')).toBeDefined();
    
    // HTTPS redirect (se in produzione)
    if (baseUrl.startsWith('https://')) {
      expect(headers.get('strict-transport-security')).toBeDefined();
    }
  });
  
  test('Protezione endpoint sensibili', async () => {
    const sensitiveEndpoints = [
      '/api/family',
      '/api/expenses',
      '/api/categories'
    ];
    
    for (const endpoint of sensitiveEndpoints) {
      const response = await fetch(baseUrl + endpoint, {
        method: 'GET'
      });
      
      // Dovrebbe richiedere autenticazione
      expect([401, 403]).toContain(response.status);
    }
  });
  
  test('Validazione input', async () => {
    // Test con dati malformati
    const malformedData = {
      email: 'not-an-email',
      password: '123', // troppo corta
      name: 'a'.repeat(1000) // troppo lunga
    };
    
    const response = await fetch(baseUrl + '/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(malformedData)
    });
    
    // Dovrebbe rifiutare dati malformati
    expect([400, 422]).toContain(response.status);
  });
});

describe('⚡ Test Performance', () => {
  test('Tempo di risposta API', async () => {
    const endpoints = [
      '/',
      '/api/auth/session',
      '/manifest.json',
      '/sw.js'
    ];
    
    for (const endpoint of endpoints) {
      const startTime = Date.now();
      
      const response = await fetch(baseUrl + endpoint, {
        headers: endpoint.includes('/api/') ? {
          'Authorization': `Bearer ${testSuite.authToken}`
        } : {}
      });
      
      const duration = Date.now() - startTime;
      
      // Tempo di risposta < 2 secondi
      expect(duration).toBeLessThan(2000);
      
      // Status code valido
      expect(response.status).toBeLessThan(500);
    }
  });
  
  test('Dimensione payload', async () => {
    const response = await fetch(baseUrl + '/');
    
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      // Pagina principale < 1MB
      expect(parseInt(contentLength)).toBeLessThan(1048576);
    }
    
    // Verifica compressione
    const contentEncoding = response.headers.get('content-encoding');
    if (baseUrl.startsWith('https://')) {
      expect(['gzip', 'br', 'deflate']).toContain(contentEncoding);
    }
  });
});

describe('🌐 Test Cross-Browser', () => {
  test('Headers compatibilità', async () => {
    const response = await fetch(baseUrl + '/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TestBot/1.0)'
      }
    });
    
    expect(response.status).toBe(200);
    
    const html = await response.text();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain('<meta name="viewport"');
  });
});

// Test di integrazione end-to-end
describe('🔄 Test End-to-End', () => {
  test('Flusso completo utente', async () => {
    const uniqueId = Date.now();
    const testEmail = `e2e-test-${uniqueId}@famiglia.com`;
    
    // 1. Registrazione
    const registerResponse = await fetch(baseUrl + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        username: `e2euser${uniqueId}`,
        password: 'password123',
        name: 'E2E Test User'
      })
    });
    
    expect([200, 201, 409]).toContain(registerResponse.status);
    
    // 2. Login
    const loginResponse = await fetch(baseUrl + '/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'password123'
      })
    });
    
    expect(loginResponse.status).toBe(200);
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    // 3. Crea famiglia
    const familyResponse = await fetch(baseUrl + '/api/family', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `E2E Test Family ${uniqueId}`
      })
    });
    
    expect([200, 201]).toContain(familyResponse.status);
    
    // 4. Crea categoria
    const categoryResponse = await fetch(baseUrl + '/api/categories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `E2E Category ${uniqueId}`,
        icon: '🧪',
        color: '#3b82f6'
      })
    });
    
    expect([200, 201]).toContain(categoryResponse.status);
    
    // 5. Verifica sessione finale
    const sessionResponse = await fetch(baseUrl + '/api/auth/session', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    expect(sessionResponse.status).toBe(200);
  }, 60000); // Timeout esteso per test E2E
});