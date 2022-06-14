import {
   jSXIdentifier as createJsxIdentifier, jSXAttribute as createJsxAttribute,
   jSXFragment as creteJsxFragment,
   jSXOpeningFragment as createJsxOpeningFragment,
   jSXClosingFragment as createJsxClosingFragment,
} from '@babel/types'
import type {
   Identifier, Node, JSXAttribute, JSXElement, JSXIdentifier
} from '@babel/types'
import { NodePath } from '@babel/traverse'
import { PLUGIN_HANDLE } from './shared'
import { error } from './utils'


export const handleIfReference = (
   referencePath: NodePath<Node>,
   showIdentifier: Identifier,
) => {
   // Check that the reference is used as a JSX component
   if (!referencePath.isJSXIdentifier()) return error(`
      ${PLUGIN_HANDLE} error: the 'If' import can only be used as a JSX
      component.
   `)

   const reference = referencePath.node
   const referenceParent = referencePath.parent

   // Check if the reference is used in a closing component
   if (referenceParent.type === 'JSXClosingElement') return
   if (referenceParent.type !== 'JSXOpeningElement') return error(`
      ${PLUGIN_HANDLE} error: you used 'if' as a normal variable. You can 
      only use it as a component.
   `) 

   const ifOpeningElementPath = referencePath.parentPath
   const ifOpeningElement = referenceParent
   const ifElementPath =
      ifOpeningElementPath.parentPath as NodePath<JSXElement>
   const ifElement = ifElementPath.node
   const ifElementParentChildren = (ifElementPath.parent as any).children

   // Check if the next sibling is an <Else> component
   
   // Find the index of the If element in the parent's children
   const ifElementChildIndex =
      ifElementParentChildren.indexOf(ifElement) as number

   let nextSibling = ifElementParentChildren[ifElementChildIndex + 1]

   const nextSiblingIsWhiteSpace =
      nextSibling.type === 'JSXText' && nextSibling.value.trim() === ''
   if (nextSiblingIsWhiteSpace)
      nextSibling = ifElementParentChildren[ifElementChildIndex + 2]

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
   ;(ifElement.closingElement.name as JSXIdentifier).name = 
      showIdentifier.name

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
      ifElementParentChildren.splice(
         ifElementChildIndex + (nextSiblingIsWhiteSpace ? 2 : 1),
         1
      )
   }
}
