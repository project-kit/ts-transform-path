import chalk from 'chalk';
import * as ts from 'typescript';
import * as compare from 'semver-compare';
import { logger } from './logger';
import { PluginConfig } from './config';
import { visitorFactory } from './visitor';

/**
 * Factory create plugin which analyze the source files and replace
 * found aliases according to path mapped in tsconfig.json.
 *
 * @param program Typescript program.
 * @param pluginConfig Plugin config.
 * @return Typescript transformer.
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 */
export default function pluginFactory(program: ts.Program, pluginConfig: PluginConfig = {}) {
  // Enable/disable plugin debug logging.
  logger.debugEnabled = pluginConfig.debug;

  // Verify ts compatibility.
  if (compare(ts.versionMajorMinor, '2.9') < 0) {
    throw new Error('Min requirement ts version is 2.9');
  }

  return {
    // Analyze and transform before compilation of sources.
    before(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
      return (sourceFile: ts.SourceFile): ts.SourceFile => {
        logger.debug(chalk.cyan(`* ${sourceFile.fileName} [ts]`));

        // Visit each node try to find aliases and replace with proper path.
        return ts.visitNode(sourceFile, visitorFactory({ program, context, sourceFile, pluginConfig }));
      };
    },
    // Analyze and transform after compilation of declarations.
    afterDeclarations(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
      return (sourceFile: ts.SourceFile): ts.SourceFile => {
        logger.debug(chalk.gray(`* ${sourceFile.fileName} [d.ts]`));

        // Visit each node try to find aliases and replace with proper path.
        return ts.visitNode(sourceFile, visitorFactory({ program, context, sourceFile, pluginConfig }));
      };
    }
  };
}
