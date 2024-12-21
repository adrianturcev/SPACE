Prism.languages.damon = {
    'list-hyphen': {
        pattern: /(^\s*)(?:[*-])/m,
        lookbehind: true,
        greedy: true
    },
    'key': {
        pattern: /.+(?=(: (true *$|false *$|null *$|\".*\" *$|\\{.*\\} *$|\\[.*] *$|-?(?:0|[1-9]\\d*)(?:(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)? *$)))/,
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
