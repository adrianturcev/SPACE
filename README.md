# SPACE: Portable and Accessible Code Editor

## Demo

[Hello, human!](https://planviii.com/)

## Use Cases

Built for interactive documents

## Features

- [x] DAMON synthax highlighting
- [x] DAMON linting
- [x] Light-enough for hardcoding
- [x] No tab-order hijacking
    - [x] Simply press Space for indentation
    - [x] Insert tab character ( ) shortcut
        - ctrl + space
        - auto-format after
- [x] Simple codebase
- [x] Look & feel close to a basic html element
    - [x] Indent with Space/BackSpace
- [x] Handles large number of rows
- [x] Layout shortcuts
    - [x] auto-indent on enter
    - [x] indent selection or line
        - ctrl + ]
        - ctrl + [
- [x] Indentation 
    - [x] auto-format indent on paste
    - [x] auto-format hyphens on paste
    - [x] formatting shortcut

## Building

### Development

```bash
node esbuild
# Builds and watch out.js
```

### Distribuable

```bash
node esbuild-dist
# Builds and watch space.min.js
grunt concat
# Builds ./dist/bundle.js
```

## Usage

```html
<script src="./bundle.js" type="text/javascript"></script>
<script  type="text/javascript">
    const space = new Space();
</script>
```

## Attributions

- help-circle forked from [Material Design Icons](https://pictogrammers.com/library/mdi/)
- content-copy forked from [Material Design Icons](https://pictogrammers.com/library/mdi/)

## License

Copyright © 2024 Adrian Turcev

Licensed under the MPL-2.0 license