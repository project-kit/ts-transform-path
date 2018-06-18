"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const path_1 = require("path");
const micromatch_1 = require("micromatch");
const logger_1 = require("./logger");
/**
 * Delimiter to identify external package alias used to generate
 * real location with node module resolution style.
 *
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 * @hidden
 */
const EXTERNAL_DELIMITER = `node_modules${path_1.posix.sep}`;
/**
 * Validate glob mapping which must include
 * alias and path wildcards.
 *
 * @param globMapping Glob mapping to be validated.
 * @return True when glob mapping is valid; false otherwise.
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 */
function isGlobMappingValid({ alias, paths }) {
    return alias && Array.isArray(paths);
}
/**
 * Analyze, resolve and transform path using specified options.
 *
 * @param options Resolve options.
 * @return Resolved path.
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 */
function resolvePath({ path, file, root, scan, globs, files }) {
    // Output path.
    let output = path;
    // Find glob mapping by matching alias wildcard.
    const glob = globs.find(({ alias }) => micromatch_1.isMatch(output, alias));
    // Check glob mapping validness.
    if (glob && isGlobMappingValid(glob)) {
        // Generate captures from glob.
        const captures = micromatch_1.capture(glob.alias, output);
        // Possible real locations.
        const realLocations = glob.paths.map(pathGlob => {
            return path_1.posix.join(root, pathGlob.replace(/[*]{2}/g, () => captures.shift()));
        });
        if (scan) {
            // Match to find suitable file from compiled and external sources.
            output = realLocations.find(fileName => {
                return !!files.find(sourcePath => sourcePath.indexOf(fileName) > -1);
            });
            if (!output) {
                throw new Error(`Paths not found`);
            }
        }
        else {
            // When there are more than one path glob need to noitfy.
            if (realLocations.length > 1) {
                logger_1.logger.warning('Path resolved only to first glob');
            }
            // Only use first one.
            output = realLocations[0];
        }
        // Relative path from file to path target.
        output = path_1.posix.relative(path_1.posix.dirname(file), output);
        // Same dir path.
        if (output[0] !== '.') {
            output = `./${output}`;
        }
        // Use node module resolution for external package.
        if (output.indexOf(EXTERNAL_DELIMITER) > -1) {
            output = output.split(EXTERNAL_DELIMITER)[1];
        }
        // Output debug: resolved alias.
        logger_1.logger.debug(chalk_1.default.blue(`${path} => ${output}`));
    }
    return output;
}
exports.resolvePath = resolvePath;
