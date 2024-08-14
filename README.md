# SPACE: Portable and Accessible Code Editor

## Demo

[Hello, human!](https://planviii.com/)

## Use Cases

HTML interactive documents

## Features

- [x] [DAMON](https://github.com/adrianturcev/SPACE) synthax highlighting
- [x] DAMON linting
- [x] Light-enough for hardcoding
- [x] No tab-order hijacking
    - [x] Simply press Space for indentation
    - [x] Insert tab character (	) shortcut
        - Ctrl + Space
- [x] Look & feel close to a basic html element
    - [x] Indent with Space/BackSpace
- [x] Handles large number of rows
- [x] Layout shortcuts and automation
    - [x] auto-indent on enter
    - [x] indent selection or line
        - Ctrl + ]
        - Ctrl + [
    - [x] auto-format indent on paste
    - [x] auto-format hyphens on paste
    - [x] formatting shortcut
- [x] Pasting valid json produces damon

## Limitations

- [x] Implicitly-null keys syntax highlighting
    - Would require droping Prismjs

## Building

### Development

```bash
node esbuild
# Builds & watch ./out.js
```

### Distribuable

```bash
node esbuild-dist
# Builds and watch ./client.min.js
grunt concat
# Builds ./dist/space.min.js
```

## Usage

```HTML
<head>
    <link href="./dist/space.css" type="text/css" rel="stylesheet">
<head>
<body>
    
    <div class="space"><textarea>- Example</textarea></div>
    <script src="./dist/space.min.js" type="text/javascript"></script>
    <script  type="text/javascript">
        const space = new Space(document.getElementsByClassName('space')[0], Prism);
        space.init();
    </script>
</body>
```

## Attributions

- help-circle forked from [Material Design Icons](https://pictogrammers.com/library/mdi/)
- content-copy forked from [Material Design Icons](https://pictogrammers.com/library/mdi/)

## License

Copyright © 2024 Adrian Turcev

Licensed under the MPL-2.0 license