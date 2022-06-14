import {
   importSpecifier as createImportSpecifier, identifier as createIdentifier,
   stringLiteral as createStringLiteral,
   importDeclaration as createImportDeclaration,
} from '@babel/types'
import type { ImportDeclaration } from '@babel/types'
import { NodePath } from '@babel/traverse'
import { PLUGIN_HANDLE } from './shared'
import { handleImportSpecifier } from './handle-import-specifier'


export const mainEntryImportDeclarationVisitor = (
   importDeclarationPath: NodePath<ImportDeclaration>
) => {
   const importDeclaration = importDeclarationPath.node;

   if (importDeclaration.source.value !== PLUGIN_HANDLE) return

   // Create a unique identifier for 'Show'
   const showIdentifier =
      importDeclarationPath.scope.generateUidIdentifier('Show')

   for (const importSpecifier of importDeclaration.specifiers)
      handleImportSpecifier(
         importDeclarationPath, showIdentifier, importSpecifier
      )

   // Add import of `Show` from 'solid-js' as the showIdentifier
   importDeclarationPath.insertAfter(
      createImportDeclaration(
         [
            createImportSpecifier(
               showIdentifier,
               createIdentifier('Show')
            )
         ],
         createStringLiteral('solid-js')
      )
   )
}
