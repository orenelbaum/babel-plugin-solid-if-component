import {
   importSpecifier as createImportSpecifier,
   identifier as createIdentifier,
   jSXIdentifier as createJsxIdentifier,
   jSXAttribute as createJsxAttribute,
   jSXFragment as creteJsxFragment,
   jSXOpeningFragment as createJsxOpeningFragment,
   jSXClosingFragment as createJsxClosingFragment,
   importDeclaration as createImportDeclaration,
   stringLiteral as createStringLiteral,
   type ImportDeclaration,
   type Identifier,
   type Node,
   type JSXAttribute,
   type JSXElement,
   type JSXIdentifier,
   type Program
} from '@babel/types'
import { NodePath } from '@babel/traverse'
import { error } from './utils'


// Cleans up unused macro imports
const programVisitor = {
   exit(programPath: NodePath<Program>) {
      programPath.traverse({
         ImportDeclaration: importDeclarationPath => {
            if (importDeclarationPath.node.source.value === 'babel-plugin-solid-if-component')
               importDeclarationPath.remove()
         }
      })
   }
}


const handleIfReference = (
   referencePath: NodePath<Node>,
   showIdentifier: Identifier,
) => {
   // Check that the reference is used as a JSX component
   if (!referencePath.isJSXIdentifier()) return error(`
      Babel plugin solid-if-component error: the 'If' import can only 
      be used as a JSX component.
   `)

   const reference = referencePath.node
   const referenceParent = referencePath.parent

   // Check if the reference is used in a closing component
   if (referenceParent.type === 'JSXClosingElement') return
   if (referenceParent.type !== 'JSXOpeningElement') return error(`
      Babel plugin solid-if-component error: you used 'if' as a normal 
      variable. You can only use it as a component.
   `) 

   const ifOpeningElementPath = referencePath.parentPath
   const ifOpeningElement = referenceParent
   const ifElementPath = ifOpeningElementPath.parentPath as NodePath<JSXElement>
   const ifElement = ifElementPath.node
   const ifElementParentChildren = (ifElementPath.parent as any).children

   // Check if the next sibling is an <Else> component
   
   // Find the index of the If element in the parent's children
   const ifElementChildIndex = ifElementParentChildren.indexOf(ifElement) as number

   let nextSibling = ifElementParentChildren[ifElementChildIndex + 1]

   const nextSiblingIsWhiteSpace = nextSibling.type === 'JSXText' && nextSibling.value.trim() === ''
   if (nextSiblingIsWhiteSpace) nextSibling = ifElementParentChildren[ifElementChildIndex + 2]

   const siblingElseElement =
      nextSibling
      && nextSibling.type === 'JSXElement'
      && nextSibling.openingElement.name.type === 'JSXIdentifier'
      && nextSibling.openingElement.name.name === 'Else'
      && nextSibling as JSXElement

   // Replace the If element with Show:

   // Change the opening element's name to 'Show'
   reference.name = showIdentifier.name
   // Change the closing element's name to 'Show'
   ;(ifElement.closingElement.name as JSXIdentifier).name = showIdentifier.name

   // Change the `cond` attribute to `when`
   const condAttribute = ifOpeningElement.attributes.find(
      attribute => {
         if (attribute.type !== 'JSXAttribute') return error(`
            Babel plugin solid-if-component error: the 'If' component 
            can only have a 'cond' normal JSX attribute attribute. Spread 
            attributes are not supported.
         `)
         return attribute.name.name === 'cond'
      }
   ) as JSXAttribute
   if (!condAttribute) return error(`
      Babel plugin solid-if-component error: the 'If' component must have a
      'cond' attribute.
   `)
   if (condAttribute.name.type === 'JSXNamespacedName') return error(`
      Babel plugin solid-if-component error: the 'If' component cannot have a
      namespaced 'cond' attribute.
   `)
   condAttribute.name.name = 'when'


   if (siblingElseElement) {
      // Add the Else element's children to the If element's fallback attribute
      const elseChildren = siblingElseElement.children
      ifOpeningElement.attributes.push(
         createJsxAttribute(
            createJsxIdentifier('fallback'),
            creteJsxFragment(
               createJsxOpeningFragment(),
               createJsxClosingFragment(),
               elseChildren
            )
         )
      )

      // Remove the Else element
      ifElementParentChildren.splice(ifElementChildIndex + (nextSiblingIsWhiteSpace ? 2 : 1), 1)
   }
}


const handleImportSpecifier = (
   importDeclarationPath: NodePath<ImportDeclaration>,
   showIdentifier: Identifier,
   importSpecifier: ImportDeclaration['specifiers'][0]
) => {
   // Handle import namespace specifier (import * as)
   if (importSpecifier.type === 'ImportNamespaceSpecifier')
      return error(`
         Babel plugin solid-if-component error: you tried to import using 
         namespace specifier (import * as ... from 'babel-plugin-solid-if-component'). This 
         syntax is unsupported. Use nomral import specifier instead 
         (import { If, Else } from 'babel-plugin-solid-if-component').
      `)
   
   // Handle import default specifier (import x from)
   if (importSpecifier.type === 'ImportDefaultSpecifier')
      return error(`
         Babel plugin solid-if-component error: you tried to import using
         default specifier (import x from 'babel-plugin-solid-if-component'). This syntax is
         unsupported. Use nomral import specifier instead (import { If, 
         Else } from 'babel-plugin-solid-if-component').
      `)

   const imported = importSpecifier.imported
   if (imported.type === 'StringLiteral')
      return error(`
         Babel plugin solid-if-component error: you tried to import using
         a string literal in your specifier (import { 'x' as y } from z).
         This syntax is unsupported. Use nomral import specifier instead
         (import { If, Else } from 'babel-plugin-solid-if-component').
      `)
   
   const importedName = imported.name

   if (importedName !== 'If' && importedName !== 'Else')
      error(`
         Babel plugin solid-if-component error: you tried to import from
         'babel-plugin-solid-if-component' using a specifier that is not 'If' or 'Else'.
         Those are the only two valid specifiers.
      `)
   
   const bindingName = importSpecifier.local.name

   if (importedName === 'If')
      for (
         const referencePath of importDeclarationPath.scope.bindings
            [bindingName].referencePaths
      )
         handleIfReference(referencePath, showIdentifier)
   
   // Remove the import specifier
   importDeclarationPath.node.specifiers.splice(
      importDeclarationPath.node.specifiers.indexOf(importSpecifier),
      1
   )
}

const importDeclarationVisitor = (
   importDeclarationPath: NodePath<ImportDeclaration>
) => {
   const importDeclaration = importDeclarationPath.node;

   if (importDeclaration.source.value !== 'babel-plugin-solid-if-component') return

   // Create a unique identifier for 'Show'
   const showIdentifier =
      importDeclarationPath.scope.generateUidIdentifier('Show')

   for (const importSpecifier of importDeclaration.specifiers) {
      handleImportSpecifier(importDeclarationPath, showIdentifier, importSpecifier)
   }

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

export default () => ({
   name: 'babel-plugin-solid-if-component',
   visitor: {
      ImportDeclaration: importDeclarationVisitor,
      Program: programVisitor
   }
})
