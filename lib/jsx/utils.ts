export const camelCase = (string: string) => string
	.replace(/([A-Z])([A-Z])/g, '$1 $2')
	.replace(/([a-z])([A-Z])/g, '$1 $2')
	.replace(/[^a-zA-Z\u00C0-\u00ff]/g, ' ')
	.toLowerCase()
	.split(' ')
	.filter(value => value)
	.map((s, i) => (i > 0 ? s[0].toUpperCase() + s.slice(1) : s))
	.join('')

export const ATTRIBUTES: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  maxlength: 'maxLength',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
};

const VOID_ELEMENTS = [
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'keygen',
	'link',
	'menuitem',
	'meta',
	'param',
	'source',
	'track',
	'wbr',
]

const NO_WHITESPACE = [
	'table',
	'tbody',
	'tfoot',
	'thead',
	'tr',
]

export default VOID_ELEMENTS

export function canHaveChildren(tagName: string): boolean {
	return VOID_ELEMENTS.indexOf(tagName.toLowerCase()) === -1
}
export function canHaveWhitespace(tagName: string): boolean {
	return NO_WHITESPACE.indexOf(tagName.toLowerCase()) !== -1
}

const pathToArrayPath = (path: string) => {
	if (path == null || path === '') return []
	return path.split('.')
}

const resolveArrayPath = (object: any, path: string[]): string | undefined => {
	const [property, ...subPath] = path
	if (object == null || property == null) {
		return undefined
	}
	return subPath.length === 0
		? object[property]
		: resolveArrayPath(object[property], subPath)
}

/**
 * Returns the result of a path query from an object
 * @param {any} object the object to search
 * @param {string} path the path, whose value will be retrieved
 * @returns {any} the value (undefined if the path doesn't exist)
 * @example
 * resolvePath({ foo: { bar: { baz: 3 } } }, 'foo.bar.baz') // 3
 */
export const resolvePath = (object: any, path: string): any => (
	resolveArrayPath(object, pathToArrayPath(path))
)

type Style = string | Partial<CSSStyleDeclaration>

/**
 * Converts a CSS Style string
 * @param {string | Partial<CSSStyleDeclaration>} style A string to convert, or object to return
 * @returns {Partial<CSSStyleDeclaration>} a partial CSSStyleDeclaration
 */
export const parseStyle = (style: Style): Partial<CSSStyleDeclaration> | undefined => {
	switch (typeof style) {
	case 'string':
		return style.split(';').filter(r => r)
			.reduce((map, rule) => {
				const name = rule.slice(0, rule.indexOf(':')).trim()
				const value = rule.slice(rule.indexOf(':') + 1).trim()

				return {
					...map,
					[camelCase(name)]: value,
				}
			}, {})
	case 'object':
		return style

	default:
		return undefined
	}
}
