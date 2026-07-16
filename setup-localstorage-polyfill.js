// Polyfill for localStorage/sessionStorage during SSR
// Required for Node.js v25 + Next.js 15 + Turbopack compatibility

if (typeof global !== 'undefined') {
  const createStorageMock = () => {
    const storage = {};
    return {
      getItem: (key) => storage[key] || null,
      setItem: (key, value) => { storage[key] = String(value); },
      removeItem: (key) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
      get length() { return Object.keys(storage).length; },
      key: (index) => Object.keys(storage)[index] || null,
    };
  };

  if (typeof global.localStorage === 'undefined' ||
      typeof global.localStorage.getItem !== 'function') {
    global.localStorage = createStorageMock();
  }

  if (typeof global.sessionStorage === 'undefined' ||
      typeof global.sessionStorage.getItem !== 'function') {
    global.sessionStorage = createStorageMock();
  }
}

if (typeof window !== 'undefined') {
  if (typeof window.localStorage === 'undefined' ||
      typeof window.localStorage.getItem !== 'function') {
    window.localStorage = global.localStorage;
  }

  if (typeof window.sessionStorage === 'undefined' ||
      typeof window.sessionStorage.getItem !== 'function') {
    window.sessionStorage = global.sessionStorage;
  }
}
