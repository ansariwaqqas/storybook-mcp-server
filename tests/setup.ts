import '@testing-library/jest-dom';

jest.setTimeout(10000);

process.env.NODE_ENV = 'test';

afterAll(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});