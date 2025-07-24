/**
 * 🔧 JEST SETUP
 * Configurazione globale per i test Jest
 */

// Polyfill per fetch se non disponibile
if (!global.fetch) {
  global.fetch = require('node-fetch');
}

// Configurazione timeout globale
jest.setTimeout(30000);

// Variabili globali per i test
global.TEST_CONFIG = {
  BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  TIMEOUT: 30000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000
};

// Utility functions globali
global.testUtils = {
  /**
   * Attende per un numero specificato di millisecondi
   */
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Retry di una funzione con backoff
   */
  retry: async (fn, maxRetries = 3, delay = 1000) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await global.testUtils.sleep(delay * (i + 1));
        }
      }
    }
    
    throw lastError;
  },
  
  /**
   * Genera dati di test casuali
   */
  generateTestData: () => {
    const timestamp = Date.now();
    return {
      email: `test-${timestamp}@famiglia.com`,
      username: `testuser-${timestamp}`,
      password: 'TestPassword123!',
      name: `Test User ${timestamp}`,
      familyName: `Test Family ${timestamp}`,
      categoryName: `Test Category ${timestamp}`,
      expenseDescription: `Test Expense ${timestamp}`
    };
  },
  
  /**
   * Verifica se un URL è raggiungibile
   */
  isUrlReachable: async (url, timeout = 5000) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.status < 500;
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Valida la struttura di una risposta API
   */
  validateApiResponse: (response, expectedFields = []) => {
    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
    
    expectedFields.forEach(field => {
      expect(response).toHaveProperty(field);
    });
  },
  
  /**
   * Crea headers di autenticazione
   */
  createAuthHeaders: (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }),
  
  /**
   * Verifica performance di una richiesta
   */
  measurePerformance: async (fn, maxDuration = 5000) => {
    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(maxDuration);
    
    return { result, duration };
  },
  
  /**
   * Cleanup dei dati di test
   */
  cleanup: {
    users: [],
    families: [],
    categories: [],
    expenses: [],
    
    addUser: (userId) => {
      global.testUtils.cleanup.users.push(userId);
    },
    
    addFamily: (familyId) => {
      global.testUtils.cleanup.families.push(familyId);
    },
    
    addCategory: (categoryId) => {
      global.testUtils.cleanup.categories.push(categoryId);
    },
    
    addExpense: (expenseId) => {
      global.testUtils.cleanup.expenses.push(expenseId);
    },
    
    async cleanupAll(authToken) {
      const baseUrl = global.TEST_CONFIG.BASE_URL;
      const headers = global.testUtils.createAuthHeaders(authToken);
      
      // Cleanup in ordine inverso per rispettare le dipendenze
      for (const expenseId of this.expenses) {
        try {
          await fetch(`${baseUrl}/api/expenses/${expenseId}`, {
            method: 'DELETE',
            headers
          });
        } catch (error) {
          console.warn(`Errore cleanup expense ${expenseId}:`, error.message);
        }
      }
      
      for (const categoryId of this.categories) {
        try {
          await fetch(`${baseUrl}/api/categories/${categoryId}`, {
            method: 'DELETE',
            headers
          });
        } catch (error) {
          console.warn(`Errore cleanup category ${categoryId}:`, error.message);
        }
      }
      
      for (const familyId of this.families) {
        try {
          await fetch(`${baseUrl}/api/family/${familyId}`, {
            method: 'DELETE',
            headers
          });
        } catch (error) {
          console.warn(`Errore cleanup family ${familyId}:`, error.message);
        }
      }
      
      // Reset arrays
      this.users = [];
      this.families = [];
      this.categories = [];
      this.expenses = [];
    }
  }
};

// Matchers personalizzati per Jest
expect.extend({
  toBeValidApiResponse(received) {
    const pass = received && typeof received === 'object' && !Array.isArray(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid API response`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid API response object`,
        pass: false
      };
    }
  },
  
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = typeof received === 'string' && emailRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email address`,
        pass: false
      };
    }
  },
  
  toBeWithinPerformanceLimit(received, limit = 5000) {
    const pass = typeof received === 'number' && received < limit;
    
    if (pass) {
      return {
        message: () => `expected ${received}ms not to be within performance limit of ${limit}ms`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received}ms to be within performance limit of ${limit}ms`,
        pass: false
      };
    }
  }
});

// Setup e teardown globali
beforeAll(async () => {
  console.log('🚀 Inizializzazione test suite...');
  console.log(`📍 Base URL: ${global.TEST_CONFIG.BASE_URL}`);
  
  // Verifica che il servizio sia raggiungibile
  const isReachable = await global.testUtils.isUrlReachable(global.TEST_CONFIG.BASE_URL);
  if (!isReachable) {
    console.warn(`⚠️  Servizio non raggiungibile su ${global.TEST_CONFIG.BASE_URL}`);
  }
});

afterAll(async () => {
  console.log('🧹 Cleanup finale test suite...');
  
  // Cleanup globale se necessario
  if (global.testUtils.cleanup.users.length > 0 ||
      global.testUtils.cleanup.families.length > 0 ||
      global.testUtils.cleanup.categories.length > 0 ||
      global.testUtils.cleanup.expenses.length > 0) {
    console.log('🗑️  Eseguendo cleanup dei dati di test...');
    // Il cleanup specifico sarà gestito nei singoli test
  }
  
  console.log('✅ Test suite completata');
});

// Gestione errori non catturati
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

// Log delle variabili di ambiente per debug
if (process.env.NODE_ENV === 'test' || process.env.DEBUG) {
  console.log('🔧 Configurazione test:');
  console.log('  - BASE_URL:', global.TEST_CONFIG.BASE_URL);
  console.log('  - TIMEOUT:', global.TEST_CONFIG.TIMEOUT);
  console.log('  - RETRY_COUNT:', global.TEST_CONFIG.RETRY_COUNT);
  console.log('  - NODE_ENV:', process.env.NODE_ENV);
}

module.exports = {
  testUtils: global.testUtils,
  TEST_CONFIG: global.TEST_CONFIG
};