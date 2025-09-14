import { jest } from '@jest/globals';

// Don't mock fs globally - let individual tests mock it as needed

// Mock puppeteer config to avoid fs issues
jest.mock('cosmiconfig', () => ({
  cosmiconfigSync: jest.fn(() => ({
    search: jest.fn(() => null),
    load: jest.fn(() => null),
  })),
}))

jest.mock('winston', () => {
  const actualWinston = jest.requireActual('winston') as any;
  const EventEmitter = require('events');
  
  class MockFileTransport extends EventEmitter {
    level: string;
    silent: boolean;
    format?: any;
    filename?: string;
    
    constructor(options: any = {}) {
      super();
      this.level = options.level || 'info';
      this.silent = options.silent || false;
      this.format = options.format;
      this.filename = options.filename;
    }
    
    log(_info: any, callback?: () => void) {
      setImmediate(() => this.emit('logged', _info));
      if (callback && typeof callback === 'function') {
        callback();
      }
    }
    
    on(event: string, listener: Function): this {
      return super.on(event, listener);
    }
    
    close() {
      this.emit('close');
    }
  }
  
  class MockConsoleTransport extends EventEmitter {
    level: string;
    format?: any;
    
    constructor(options: any = {}) {
      super();
      this.level = options.level || 'info';
      this.format = options.format;
    }
    
    log(_info: any, callback?: () => void) {
      setImmediate(() => this.emit('logged', _info));
      if (callback && typeof callback === 'function') {
        callback();
      }
    }
    
    on(event: string, listener: Function): this {
      return super.on(event, listener);
    }
    
    close() {
      this.emit('close');
    }
  }
  
  // Don't extend from actual transports to avoid filesystem dependencies
  const FileTransport = MockFileTransport;
  const ConsoleTransport = MockConsoleTransport;
  
  return {
    ...actualWinston,
    transports: {
      ...actualWinston.transports,
      File: FileTransport,
      Console: ConsoleTransport,
    },
  };
});

process.env.NODE_ENV = 'test';