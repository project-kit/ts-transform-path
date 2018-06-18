import '../library/logger';
import { resolvePath } from '../library/resolve';

// Mock logger
jest.mock('../library/logger');

/**
 * Testing path resolver.
 *
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 */
describe('Path resolver', () => {
  // Fixture.
  const options = {
    scan: false,
    path: 'alias/dependency',
    file: 'X:/project/dir/file',
    root: 'X:/project',
    sources: []
  };

  it('should resolve alias with real file location on same directory', () => {
    const result = resolvePath({
      ...options,
      globs: [
        {
          alias: 'alias/**',
          paths: ['dir/**']
        }
      ]
    });

    expect(result).toBe('./dependency');
  });

  it('should resolve relative alias with real file location on sibling directory', () => {
    const result = resolvePath({
      ...options,
      globs: [
        {
          alias: 'alias/**',
          paths: ['test/**']
        }
      ]
    });

    expect(result).toBe('../test/dependency');
  });

  it('should resolve external package alias with real package location', () => {
    const result = resolvePath({
      ...options,
      globs: [
        {
          alias: 'alias/**',
          paths: ['node_modules/alias/**']
        }
      ]
    });

    expect(result).toBe('alias/dependency');
  });

  it('should avoid resolve when pattern not found and scan is turned off', () => {
    const result = resolvePath({
      ...options,
      globs: []
    });

    expect(result).toBe('alias/dependency');
  });

  it('should scan source when scan is turned on and resolve path', () => {
    const result = resolvePath({
      ...options,
      scan: true,
      files: ['X:/project/dir/dependency'],
      globs: [
        {
          alias: 'alias/**',
          paths: ['dir/**']
        }
      ]
    });

    expect(result).toBe('./dependency');
  });

  it('should throw error when pattern found but source not found and scan is turned on', () => {
    expect(() =>
      resolvePath({
        ...options,
        scan: true,
        globs: [
          {
            alias: 'alias/**',
            paths: ['node_modules/alias/**']
          }
        ]
      })
    ).toThrow();
  });
});
