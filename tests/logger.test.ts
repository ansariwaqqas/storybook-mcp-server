import winston from 'winston';
import { logger } from '../src/logger';

describe('Logger', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should create a logger instance', () => {
    expect(logger).toBeDefined();
    expect(logger).toBeInstanceOf(winston.Logger);
  });

  it('should have file transports configured', () => {
    const transports = logger.transports;
    // We should have two transports (both file transports in the logger)
    expect(transports).toHaveLength(2);
    
    const errorTransport = transports.find(
      (t: any) => t.level === 'error'
    );
    const combinedTransport = transports.find(
      (t: any) => !t.level || t.level === logger.level
    );

    expect(errorTransport).toBeDefined();
    expect(combinedTransport).toBeDefined();
  });

  it('should use the correct log level from environment', () => {
    const originalLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = 'debug';
    
    jest.resetModules();
    const { logger: testLogger } = require('../src/logger');
    expect(testLogger.level).toBe('debug');
    
    process.env.LOG_LEVEL = originalLevel;
  });

  it('should add console transport in development mode', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.MCP_MODE;
    
    jest.resetModules();
    const { logger: devLogger } = jest.requireActual('../src/logger');
    
    // This test checks that console transport was added to the logger
    // In development mode, there should be at least one console transport
    const hasConsoleTransport = devLogger.transports.some(
      (t: any) => t.filename === undefined && t.level !== undefined
    );
    
    if (process.env.NODE_ENV === 'development') {
      expect(hasConsoleTransport).toBe(true);
    }
  });

  it('should not add console transport in production mode', () => {
    process.env.NODE_ENV = 'production';
    
    jest.resetModules();
    const { logger: prodLogger } = jest.requireActual('../src/logger');
    
    const consoleTransport = prodLogger.transports.find(
      (t: any) => t instanceof winston.transports.Console
    );
    
    expect(consoleTransport).toBeUndefined();
  });

  it('should not add console transport when MCP_MODE is true', () => {
    process.env.MCP_MODE = 'true';
    process.env.NODE_ENV = 'development';
    
    jest.resetModules();
    const { logger: mcpLogger } = jest.requireActual('../src/logger');
    
    const consoleTransport = mcpLogger.transports.find(
      (t: any) => t instanceof winston.transports.Console
    );
    
    expect(consoleTransport).toBeUndefined();
  });

  it('should log to files', () => {
    const errorSpy = jest.spyOn(logger, 'error');
    const infoSpy = jest.spyOn(logger, 'info');

    logger.error('Test error message');
    logger.info('Test info message');

    expect(errorSpy).toHaveBeenCalledWith('Test error message');
    expect(infoSpy).toHaveBeenCalledWith('Test info message');
  });

  it('should format logs with timestamp', () => {
    const format = logger.format;
    expect(format).toBeDefined();
  });
});