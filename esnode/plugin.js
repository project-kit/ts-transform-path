"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const ts = require("typescript");
const compare = require("semver-compare");
const logger_1 = require("./logger");
const visitor_1 = require("./visitor");
/**
 * Factory create plugin which analyze the source files and replace
 * found aliases according to path mapped in tsconfig.json.
 *
 * @param program Typescript program.
 * @param pluginConfig Plugin config.
 * @return Typescript transformer.
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 */
function pluginFactory(program, pluginConfig = {}) {
    // Enable/disable plugin debug logging.
    logger_1.logger.debugEnabled = pluginConfig.debug;
    // Verify ts compatibility.
    if (compare(ts.versionMajorMinor, '2.9') < 0) {
        throw new Error('Min requirement ts version is 2.9');
    }
    return {
        // Analyze and transform before compilation of sources.
        before(context) {
            return (sourceFile) => {
                logger_1.logger.debug(chalk_1.default.cyan(`* ${sourceFile.fileName} [ts]`));
                // Visit each node try to find aliases and replace with proper path.
                return ts.visitNode(sourceFile, visitor_1.visitorFactory({ program, context, sourceFile, pluginConfig }));
            };
        },
        // Analyze and transform after compilation of declarations.
        afterDeclarations(context) {
            return (sourceFile) => {
                logger_1.logger.debug(chalk_1.default.gray(`* ${sourceFile.fileName} [d.ts]`));
                // Visit each node try to find aliases and replace with proper path.
                return ts.visitNode(sourceFile, visitor_1.visitorFactory({ program, context, sourceFile, pluginConfig }));
            };
        }
    };
}
exports.default = pluginFactory;
