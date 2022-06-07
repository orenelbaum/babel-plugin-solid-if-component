import { identifier, numericLiteral, memberExpression } from '@babel/types'


export const getGetterMemberExpression = 
   (bindingName: string) =>
      memberExpression(
         identifier(bindingName),
         numericLiteral(0),
         true
      )

// Take a string and remove all new lines and whitespaces longer than 1 character
const removeUnnecessaryWhitespace = (message: string) =>
   message
      .replace(/\n/g, "")
      .replace(/\s+/g, " ")

export const error = (message: string) => {
   throw new Error(removeUnnecessaryWhitespace(message))
}