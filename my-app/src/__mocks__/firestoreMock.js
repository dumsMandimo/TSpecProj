module.exports = {
  collection:      jest.fn((_, name) => ({ name })),
  query:           jest.fn((...args) => args),
  where:           jest.fn((...args) => args),
  onSnapshot:      jest.fn(),
  addDoc:          jest.fn(),
  updateDoc:       jest.fn(),
  deleteDoc:       jest.fn(),
  getDoc:          jest.fn(),
  getDocs:         jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TS'),
  Timestamp:       { fromMillis: (ms) => ({ toMillis: () => ms }) },
  doc:             jest.fn((_db, col, id) => ({ path: col + '/' + id })),
};
