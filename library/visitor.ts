import * as ts from 'typescript';
import { resolvePath } from './resolve';
import { PluginConfig } from './config';

/**
 * Cache for storing an already resolved paths and optimizing
 * the generation by excluding duplicates.
 *
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 * @hidden
 */
const cachedPaths = new Map();

/**
 * Excessive characters are part of the generated node declaration
 * and need to be removed to correctly update path.
 *
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 * @hidden
 */
const excessiveChars = /['"\s]+/g;

/**
 * Received options determine the configuration of the compiler
 * for resolving and checking paths.
 *
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 */
export interface Options {
  /**
   * Program contains the general configuration of the project
   * and compiled sources.
   */
  program: ts.Program;

  /**
   * Context contains the tsconfig.json options used by compiler
   * and path mappings.
   */
  context: ts.TransformationContext;

  /**
   * The file metadata is used as the point of entry for visitors
   * and the base for resolving a relative path.
   */
  sourceFile: ts.SourceFile;

  /**
   * Specified plugin configuration.
   */
  pluginConfig: PluginConfig;
}

/**
 * Options contains the necessary data to generate correct path
 * used to update node declaration.
 *
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 */
interface PathOptions extends Options {
  path: string;
}

/**
 * Path mapping use single * to identify alias and path and to correctly
 * generate it's need to be transformed to global star (**).
 *
 * @param pattern Typescript pattern.
 * @return Created wildcard.
 */
function createWildcard(pattern: string): string {
  return pattern.replace('*', '**');
}

/**
 * Remove the excessive characters from path.
 *
 * @param path Path to be cleared.
 * @return Path without redundant chars.
 */
function clearPath(path: string): string {
  return path.replace(excessiveChars, '');
}

/**
 * Create literal with resolved path.
 *
 * @param program Ts program.
 * @param ctx Transformation context.
 * @param path Path to be processed.
 * @return String literal.
 */
function createPathLiteral({ program, context, sourceFile, pluginConfig, path }: PathOptions): ts.StringLiteral {
  // Compiler options used to generate code.
  const compilerOptions = context.getCompilerOptions();

  // Check for the path in the cache.
  if (!cachedPaths.has(path)) {
    // Resolve path
    const output = resolvePath({
      // Path to be resolved.
      path,
      // Scan sources.
      scan: pluginConfig.scan,
      // File location which include node.
      file: sourceFile.fileName,
      // Path mapping root.
      root: compilerOptions.baseUrl,
      // List of found sources.
      files: program.getSourceFiles().map(({ fileName }) => fileName),
      // Patterns used to resolve path.
      globs: Object.keys(compilerOptions.paths).map(alias => ({
        alias: createWildcard(alias),
        paths: compilerOptions.paths[alias].map(createWildcard)
      }))
    });

    // Verify output.
    if (!output) {
      throw new Error('Resolved path must exist');
    }

    // Remember resolved path.
    cachedPaths.set(path, output);
  }

  return ts.createLiteral(cachedPaths.get(path));
}

/**
 * Update nodes with ES6 declaration syntax (import/export).
 *
 * @param node Node to be updated.
 * @param options Options to resolve path.
 * @return Updated node.
 */
function updateDeclaration(node: ts.ImportDeclaration | ts.ExportDeclaration, options: Options) {
  // ModuleSpecifier must exist and include path.
  if (node.moduleSpecifier) {
    // Clean path from redundant characters.
    const path = clearPath(node.moduleSpecifier.getFullText());

    // Module specifier with new resolved path.
    const moduleSpecifier = createPathLiteral({ ...options, path });

    // Change only when path is changed.
    if (path !== moduleSpecifier.text) {
      const flags = node.flags;

      if (ts.isImportDeclaration(node)) {
        node = ts.updateImportDeclaration(node, node.decorators, node.modifiers, node.importClause, moduleSpecifier);
      } else if (ts.isExportDeclaration(node)) {
        // Resolve export reference error.
        Object.assign(moduleSpecifier, {
          parent: node.moduleSpecifier.parent
        });

        node = ts.updateExportDeclaration(node, node.decorators, node.modifiers, node.exportClause, moduleSpecifier);
      }

      // Flags need to be copied.
      node.flags = flags;
    }
  }

  return node;
}

/**
 * Factory create visitor which analyze each node and
 * update nodes with resolved path.
 *
 * @param options Visitor options.
 * @return Node visitor.
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 */
export function visitorFactory(options: Options): ts.Visitor {
  // Visitor which traverse across AST tree.
  return function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
    if (ts.isCallExpression(node)) {
      // Resolve require ts syntax.
      if (node.expression.getText() === 'require' && node.arguments.length > 0) {
        const [importArg] = node.arguments;

        // Resolve only string literal.
        if (importArg && ts.isStringLiteral(importArg)) {
          node = ts.updateCall(node, node.expression, node.typeArguments, [
            createPathLiteral({ ...options, path: clearPath(importArg.getText()) })
          ]);
        }
      }
    } else if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      // Update ES declaration syntax.
      node = updateDeclaration(node, options);
    }

    return ts.visitEachChild(node, visitor, options.context);
  };
}
