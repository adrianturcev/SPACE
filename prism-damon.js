Prism.languages.damon = {
	'list-hyphen': {
		pattern: /(^\s*)(?:[*-]|\d+\.)/m,
		lookbehind: true,
		greedy: true
	},
	'string': {
		pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
		lookbehind: true,
		greedy: true
	},
	'comment': {
		pattern: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)\n/,
		greedy: true
	},
	'number': /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
	'operator': /:/,
	'boolean': /\b(?:false|true)\b/,
	'null': {
		pattern: /\bnull\b/,
		alias: 'keyword'
	},
	'map': {
		pattern: /(\{\})\n/,
	},
	'list': {
		pattern: /(\[\])\n/,
	},
	'punctuation': /[\{\}\[\],]/,
};

Prism.languages.webmanifest = Prism.languages.damon;