
import type { ImportDeclaration, Identifier } from '@babel/types'
import { NodePath } from '@babel/traverse'
import { PLUGIN_HANDLE } from './shared'
import { error } from './utils'
import { handleIfReference } from './handle-if-reference'


type AnyImportSpecifier = ImportDeclaration['specifiers'][0]

const validateImportSpecifier = (
   importSpecifier: AnyImportSpecifier
) => {
   // Error on import namespace specifier (import * as)
   if (importSpecifier.type === 'ImportNamespaceSpecifier')
      return void error(`
         ${PLUGIN_HANDLE} error: you tried to import using namespace
         specifier (import * as ... from '${PLUGIN_HANDLE}'). This syntax is 
         unsupported. Use nomral import specifier instead (import { If, Else 
         } from '${PLUGIN_HANDLE}').
      `)
   
   // Error on import default specifier (import x from)
   if (importSpecifier.type === 'ImportDefaultSpecifier')
      return void error(`
         ${PLUGIN_HANDLE} error: you tried to import using default specifier 
         (import x from '${PLUGIN_HANDLE}'). This syntax is unsupported. Use 
         nomral import specifier instead (import { If, Else } from 
         '${PLUGIN_HANDLE}').
      `)
 
   // Error on string literal import specifier (import { 'x' as y } from)
   const imported = importSpecifier.imported
   if (imported.type === 'StringLiteral')
      return void error(`
         ${PLUGIN_HANDLE} error: you tried to import using a string literal 
         in your specifier (import { 'x' as y } from z). This syntax is 
         unsupported. Use nomral import specifier instead (import { If, Else 
         } from '${PLUGIN_HANDLE}').
      `)
   
   const importedName = imported.name

   if (importedName !== 'If' && importedName !== 'Else')
      return void error(`
         ${PLUGIN_HANDLE} error: you tried to import from '${PLUGIN_HANDLE}' 
         using a specifier that is not 'If' or 'Else'. Those are the only 
         two valid specifiers.
      `)

   return { importedName: importedName as 'If' | 'Else' }
}

export const handleImportSpecifier = (
   importDeclarationPath: NodePath<ImportDeclaration>,
   showIdentifier: Identifier,
   importSpecifier: AnyImportSpecifier
) => {
   const { importedName } = validateImportSpecifier(importSpecifier)
   
   const bindingName = importSpecifier.local.name

   if (importedName === 'If')
      for (
         const referencePath of
            importDeclarationPath.scope.bindings[bindingName].referencePaths
      )
         handleIfReference(referencePath, showIdentifier)
   
   // Remove the import specifier
   importDeclarationPath.node.specifiers.splice(
      importDeclarationPath.node.specifiers.indexOf(importSpecifier),
      1
   )
}
