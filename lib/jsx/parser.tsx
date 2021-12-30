import { Parser } from 'acorn'
import jsx from 'acorn-jsx'
import React, { ComponentType, ExoticComponent, Fragment } from 'react';
import { ATTRIBUTES, canHaveChildren, canHaveWhitespace, parseStyle, resolvePath } from './utils';

type Scope = Record<string, any>;
type ParsedJSX = JSX.Element | boolean | string;
type ParsedTree = ParsedJSX | ParsedJSX[] | null;
export type TProps = {
	allowUnknownElements?: boolean,
	autoCloseVoidElements?: boolean,
	bindings?: { [key: string]: unknown; },
	blacklistedAttrs?: Array<string | RegExp>,
	blacklistedTags?: string[],
	className?: string,
	components?: Record<string, ComponentType | ExoticComponent>,
	componentsOnly?: boolean,
	disableFragments?: boolean,
	disableKeyGeneration?: boolean,
	jsx?: string,
	onError?: (error: Error) => void,
	showWarnings?: boolean,
	renderError?: (props: { error: string }) => JSX.Element | null,
	renderInWrapper?: boolean,
	renderUnrecognized?: (tagName: string) => JSX.Element | null,
}

const parseExpression = (expression: AcornJSX.Expression, scope?: Scope, props?: TProps = {}): any => {
  switch (expression.type) {
  case 'JSXAttribute':
    if (expression.value === null) return true
    return parseExpression(expression.value, scope)
  case 'JSXElement':
  case 'JSXFragment':
    return parseElement(expression, scope)
  case 'JSXExpressionContainer':
    return parseExpression(expression.expression, scope)
  case 'JSXText':
    const key = props.disableKeyGeneration ? undefined : randomHash()
    return props.disableFragments
      ? expression.value
      : <Fragment key={key}>{expression.value}</Fragment>
  case 'ArrayExpression':
    return expression.elements.map(ele => parseExpression(ele, scope)) as ParsedTree
  case 'BinaryExpression':
    /* eslint-disable eqeqeq,max-len */
    switch (expression.operator) {
    case '-': return parseExpression(expression.left) - parseExpression(expression.right)
    case '!=': return parseExpression(expression.left) != parseExpression(expression.right)
    case '!==': return parseExpression(expression.left) !== parseExpression(expression.right)
    case '*': return parseExpression(expression.left) * parseExpression(expression.right)
    case '**': return parseExpression(expression.left) ** parseExpression(expression.right)
    case '/': return parseExpression(expression.left) / parseExpression(expression.right)
    case '%': return parseExpression(expression.left) % parseExpression(expression.right)
    case '+': return parseExpression(expression.left) + parseExpression(expression.right)
    case '<': return parseExpression(expression.left) < parseExpression(expression.right)
    case '<=': return parseExpression(expression.left) <= parseExpression(expression.right)
    case '==': return parseExpression(expression.left) == parseExpression(expression.right)
    case '===': return parseExpression(expression.left) === parseExpression(expression.right)
    case '>': return parseExpression(expression.left) > parseExpression(expression.right)
    case '>=': return parseExpression(expression.left) >= parseExpression(expression.right)
      /* eslint-enable eqeqeq,max-len */
    }
    return undefined
  case 'CallExpression':
    const parsedCallee = parseExpression(expression.callee)
    if (parsedCallee === undefined) {
      props.onError!(new Error(`The expression '${expression.callee}' could not be resolved, resulting in an undefined return value.`))
      return undefined
    }
    return parsedCallee(...expression.arguments.map(
      arg => parseExpression(arg, expression.callee),
    ))
  case 'ConditionalExpression':
    return parseExpression(expression.test)
      ? parseExpression(expression.consequent)
      : parseExpression(expression.alternate)
  case 'ExpressionStatement':
    return parseExpression(expression.expression)
  case 'Identifier':
    if (scope && expression.name in scope) {
      return scope[expression.name]
    }
    return (props.bindings || {})[expression.name]

  case 'Literal':
    return expression.value
  case 'LogicalExpression':
    const left = parseExpression(expression.left)
    if (expression.operator === '||' && left) return left
    if ((expression.operator === '&&' && left) || (expression.operator === '||' && !left)) {
      return parseExpression(expression.right)
    }
    return false
  case 'MemberExpression':
    return parseMemberExpression(expression, scope)
  case 'ObjectExpression':
    const object: Record<string, any> = {}
    expression.properties.forEach(prop => {
      object[prop.key.name! || prop.key.value!] = parseExpression(prop.value)
    })
    return object
  case 'TemplateElement':
    return expression.value.cooked
  case 'TemplateLiteral':
    return [...expression.expressions, ...expression.quasis]
      .sort((a, b) => {
        if (a.start < b.start) return -1
        return 1
      })
      .map(item => parseExpression(item))
      .join('')
  case 'UnaryExpression':
    switch (expression.operator) {
    case '+': return expression.argument.value
    case '-': return -expression.argument.value
    case '!': return !expression.argument.value
    }
    return undefined
  case 'ArrowFunctionExpression':
    if (expression.async || expression.generator) {
      props.onError?.(new Error('Async and generator arrow functions are not supported.'))
    }
    return (...args: any[]) : any => {
      const functionScope: Record<string, any> = {}
      expression.params.forEach((param, idx) => {
        functionScope[param.name] = args[idx]
      })
      return parseExpression(expression.body, functionScope)
    }
  }
}

const parseMemberExpression = (expression: AcornJSX.MemberExpression, scope?: Scope, props?: TProps = {}): any => {
  let { object } = expression
  const path = [expression.property?.name ?? JSON.parse(expression.property?.raw ?? '""')]

  if (expression.object.type !== 'Literal') {
    while (object && ['MemberExpression', 'Literal'].includes(object?.type)) {
      const { property } = (object as AcornJSX.MemberExpression)
      if ((object as AcornJSX.MemberExpression).computed) {
        path.unshift(parseExpression(property!, scope))
      } else {
        path.unshift(property?.name ?? JSON.parse(property?.raw ?? '""'))
      }

      object = (object as AcornJSX.MemberExpression).object
    }
  }

  const target = parseExpression(object, scope)
  try {
    let parent = target
    const member = path.reduce((value, next) => {
      parent = value
      return value[next]
    }, target)
    if (typeof member === 'function') return member.bind(parent)

    return member
  } catch {
    const name = (object as AcornJSX.MemberExpression)?.name || 'unknown'
    props.onError!(new Error(`Unable to parse ${name}["${path.join('"]["')}"]}`))
  }
}

const parseName = (element: AcornJSX.JSXIdentifier | AcornJSX.JSXMemberExpression): string => {
  if (element.type === 'JSXIdentifier') { return element.name }
  return `${parseName(element.object)}.${parseName(element.property)}`
}

const parseElement = (
  element: AcornJSX.JSXElement | AcornJSX.JSXFragment,
  scope?: Scope,
  props?: TProps = {}
): JSX.Element | JSX.Element[] | null => {
  const { allowUnknownElements, components, componentsOnly, onError } = props;
  const { children: childNodes = [] } = element
  const openingTag = element.type === 'JSXElement'
    ? element.openingElement
    : element.openingFragment
  const { attributes = [] } = openingTag
  const name = element.type === 'JSXElement'
    ? parseName(openingTag.name)
    : ''

  const blacklistedAttrs = (props.blacklistedAttrs || [])
    .map(attr => (attr instanceof RegExp ? attr : new RegExp(attr, 'i')))
  const blacklistedTags = (props.blacklistedTags || [])
    .map(tag => tag.trim().toLowerCase()).filter(Boolean)

  if (/^(html|head|body)$/i.test(name)) {
    return childNodes.map(c => parseElement(c, scope)) as JSX.Element[]
  }
  const tagName = name.trim().toLowerCase()
  if (blacklistedTags.indexOf(tagName) !== -1) {
    onError!(new Error(`The tag <${name}> is blacklisted, and will not be rendered.`))
    return null
  }

  if (name !== '' && !resolvePath(components, name)) {
    if (componentsOnly) {
      onError!(new Error(`The component <${name}> is unrecognized, and will not be rendered.`))
      return props.renderUnrecognized!(name)
    }

    if (!allowUnknownElements && document.createElement(name) instanceof HTMLUnknownElement) {
      onError!(new Error(`The tag <${name}> is unrecognized in this browser, and will not be rendered.`))
      return props.renderUnrecognized!(name)
    }
  }

  let children
  const component = element.type === 'JSXElement'
    ? resolvePath(components, name)
    : Fragment

  if (component || canHaveChildren(name)) {
    children = childNodes.map(node => parseExpression(node, scope))
    if (!component && !canHaveWhitespace(name)) {
      children = children.filter(child => (
        typeof child !== 'string' || !/^\s*$/.test(child)
      ))
    }

    if (children.length === 0) {
      children = undefined
    } else if (children.length === 1) {
      [children] = children
    } else if (children.length > 1 && !props.disableKeyGeneration) {
      // Add `key` to any child that is a react element (by checking if it has `.type`) if one
      // does not already exist.
      children = children.map((child, key) => (
        (child?.type && !child?.key) ? { ...child, key: child.key || key } : child
      ))
    }
  }


  const elementProps: { [key: string]: any } = {
    key: props.disableKeyGeneration ? undefined : randomHash(),
  }

  attributes.forEach(
    (expr: AcornJSX.JSXAttribute | AcornJSX.JSXAttributeExpression | AcornJSX.JSXSpreadAttribute) => {
      if (expr.type === 'JSXAttribute') {
        const rawName = expr.name.name
        const attributeName = ATTRIBUTES[rawName] || rawName
        // if the value is null, this is an implicitly "true" prop, such as readOnly
        const value = parseExpression(expr, scope)

        const matches = blacklistedAttrs.filter(re => re.test(attributeName))
        if (matches.length === 0) {
          elementProps[attributeName] = value
        }
      } else if (
        (expr.type === 'JSXSpreadAttribute' && expr.argument.type === 'Identifier')
        || expr.argument!.type === 'MemberExpression'
      ) {
        const value = parseExpression(expr.argument!, scope)
        if (typeof value === 'object') {
          Object.keys(value).forEach(rawName => {
            const attributeName: string = ATTRIBUTES[rawName] || rawName
            const matches = blacklistedAttrs.filter(re => re.test(attributeName))
            if (matches.length === 0) {
              props[attributeName] = value[rawName]
            }
          })
        }
      }
    },
  )

  if (typeof elementProps.style === 'string') {
    elementProps.style = parseStyle(elementProps.style)
  }
  const lowerName = name.toLowerCase()
  if (lowerName === 'option') {
    children = children.props.children
  }

  return React.createElement(component || lowerName, props, children)
}

export const parse = (input: string) => {
  const parser = Parser.extend(jsx());
  const wrappedJsx = `<root>${input}</root>`

  const parsed = parser.parse(wrappedJsx, { ecmaVersion: 'latest' })

  // @ts-ignore
  return parsed.body[0].expression.children || [];
}

