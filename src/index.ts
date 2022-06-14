import type { Program } from '@babel/types'
import { NodePath } from '@babel/traverse'
import { mainEntryImportDeclarationVisitor }
   from './main-entry.import-declaration-visitor'
import { PLUGIN_HANDLE } from './shared'


/** Cleans up unused macro imports */
const cleanUnusuedImportsProgramVisitor = {
   exit: (programPath: NodePath<Program>) =>
      programPath.traverse({
         ImportDeclaration: importDeclarationPath =>
            importDeclarationPath.node.source.value === PLUGIN_HANDLE
               && importDeclarationPath.remove()
      })
}


export default () => ({
   name: PLUGIN_HANDLE,
   visitor: {
      ImportDeclaration: mainEntryImportDeclarationVisitor,
      Program: cleanUnusuedImportsProgramVisitor
   }
})
