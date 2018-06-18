import chalk from 'chalk';
import { posix } from 'path';
import { isMatch, capture } from 'micromatch';
import { logger } from './logger';

/**
 * Delimiter to identify external package alias used to generate
 * real location with node module resolution style.
 *
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 * @hidden
 */
const EXTERNAL_DELIMITER = `node_modules${posix.sep}`;

/**
 * Contains alias and path wildcards to identify path need to be
 * analyzed and transformed to generate correct real location.
 *
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 */
export interface GlobMapping {
  alias: string;
  paths: ReadonlyArray<string>;
}

/**
 * Received options which specify way how to analyze, resolve,
 * transform and verify real location.
 *
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 */
export interface ResolveOptions {
  /**
   * Path received from ts compilation and need to be
   * analyzed and resolved.
   */
  path: string;

  /**
   * File location which include path to be resolved and used
   * to generate relative path.
   */
  file: string;

  /**
   * Root used to fulfill complete path and generate correct
   * relative path.
   */
  root: string;

  /**
   * Specify need to verify existence of real file location and
   * used to resolve alias with more than two path wildcards.
   */
  scan: boolean;

  /**
   * List of glob used to find, path and generate real file location.
   */
  globs: ReadonlyArray<GlobMapping>;

  /**
   * List of files compiled by ts and can be used with scan
   * to verify existence of real file location.
   */
  files: ReadonlyArray<string>;
}

/**
 * Validate glob mapping which must include
 * alias and path wildcards.
 *
 * @param globMapping Glob mapping to be validated.
 * @return True when glob mapping is valid; false otherwise.
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 */
function isGlobMappingValid({ alias, paths }: GlobMapping): boolean {
  return alias && Array.isArray(paths);
}

/**
 * Analyze, resolve and transform path using specified options.
 *
 * @param options Resolve options.
 * @return Resolved path.
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 */
export function resolvePath({ path, file, root, scan, globs, files }: ResolveOptions): string {
  // Output path.
  let output = path;

  // Find glob mapping by matching alias wildcard.
  const glob = globs.find(({ alias }) => isMatch(output, alias));

  // Check glob mapping validness.
  if (glob && isGlobMappingValid(glob)) {
    // Generate captures from glob.
    const captures = capture(glob.alias, output);

    // Possible real locations.
    const realLocations = glob.paths.map(pathGlob => {
      return posix.join(root, pathGlob.replace(/[*]{2}/g, () => captures.shift()));
    });

    if (scan) {
      // Match to find suitable file from compiled and external sources.
      output = realLocations.find(fileName => {
        return !!files.find(sourcePath => sourcePath.indexOf(fileName) > -1);
      });

      if (!output) {
        throw new Error(`Paths not found`);
      }
    } else {
      // When there are more than one path glob need to noitfy.
      if (realLocations.length > 1) {
        logger.warning('Path resolved only to first glob');
      }

      // Only use first one.
      output = realLocations[0];
    }

    // Relative path from file to path target.
    output = posix.relative(posix.dirname(file), output);

    // Same dir path.
    if (output[0] !== '.') {
      output = `./${output}`;
    }

    // Use node module resolution for external package.
    if (output.indexOf(EXTERNAL_DELIMITER) > -1) {
      output = output.split(EXTERNAL_DELIMITER)[1];
    }

    // Output debug: resolved alias.
    logger.debug(chalk.blue(`${path} => ${output}`));
  }

  return output;
}
