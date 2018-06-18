import mockConsole from 'jest-mock-console';
import { logger } from '../library/logger';

/**
 * Testing logger.
 *
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 */
describe('Logger', () => {
  let restoreConsole;

  beforeEach(() => {
    restoreConsole = mockConsole();
  });

  afterEach(() => {
    restoreConsole();
  });

  it('should output message to console', () => {
    logger.debugEnabled = true;

    logger.debug('Test');

    expect(console.log).toHaveBeenCalled();
  });

  it('should avoid debug message when it not enabled', () => {
    logger.debugEnabled = false;

    logger.debug('Test');

    expect(console.log).not.toHaveBeenCalled();
  });
});
