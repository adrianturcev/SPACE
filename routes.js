var VirtualScroller = require("./virtualScroller");

module.exports =
(function (space) {
// # Scheduling
// ## Space.js

space.editor
    .addEventListener('focusin', spaceFocusInRoute);

space.editor
    .addEventListener('focusout', spaceFocusOutRoute);

space.gutter
    .addEventListener('click', gutterClickRoute);

document
    .addEventListener('mousedown', containerMousedownRoute);

document
    .addEventListener('mousemove', containerMousemoveRoute);

document
    .addEventListener('mouseup', containerMouseupRoute);

document
    .addEventListener('selectionchange', documentSelectionChangeRoute);

space.textarea
    .addEventListener('beforeinput', textareaBeforeinputRoute);

space.textarea
    .addEventListener('keydown', textareaKeydownRoute);

space.textarea
    .addEventListener('cut', textareaCutRoute)

space.textarea
    .addEventListener('copy', textareaCopyRoute)

space.textarea
    .addEventListener('paste', textareaPasteRoute)

function spaceFocusInRoute(e) {
    space.utils.addDataState(space.editor, 'focused');
}

function spaceFocusOutRoute(e) {
    if (!space.editor.contains(e.target)) {
        space.utils.removeDataState(space.editor, 'focused');
    }
}

function gutterClickRoute(e) {
    if (
        Array.from(space.gutter.children).indexOf(e.target) > -1
        || Array.from(space.gutter.children).indexOf(e.target.parentNode) > -1
    ) {
        space.setCarretAt(parseInt(e.target.textContent.trim()) - 1);
    }
}

var lastMousedownTarget;
function containerMousedownRoute(e) {
    if (e.target == space.container) {
        lastMousedownTarget = e.target;
        e.preventDefault();
        let gutterChildren = space.gutter.children,
            carretLine = '0';
        for (let i = 0, c = gutterChildren.length; i < c; i++) {
            if (e.clientY > gutterChildren[i].getBoundingClientRect().y) {
                carretLine = gutterChildren[i].textContent.trim();
            }
        }
        if (carretLine - 1 < 0)
            carretLine = 1;
        space.setCarretAt(carretLine - 1);
        space.textarea.focus();
    }
}

// Handles height > content case
function containerMousemoveRoute(e) {
    if (
        lastMousedownTarget == space.container
        && e.buttons == 1
    ) {
        let gutterChildren = space.gutter.children,
            selectionLine = '0';
        for (let i = 0, c = gutterChildren.length; i < c; i++) {
            if (e.clientY > gutterChildren[i].getBoundingClientRect().y) {
                selectionLine = gutterChildren[i].textContent.trim();
            }
        }
        space.textarea.focus();
        space.textarea.setSelectionRange(
            space.textarea.value.split('\n').slice(0, selectionLine).join().length,
            space.textarea.value.length,
            'backward'
        );
    }
}

// Handles height > content case
function containerMouseupRoute(e) {
    if (
        lastMousedownTarget == space.container
        && e.target == space.textarea
    ) {
        space.textarea.selectionEnd = space.textarea.value.length;
        space.textarea.selectionStart = space.textarea.value.length;
        space.textarea.focus();
    }
    lastMousedownTarget = undefined;
}

function documentSelectionChangeRoute(e) {
    if (document.activeElement === space.textarea) {
        space.updateCaret();
        space.updateCurrentLine();
        space.updateHorizontalScroll();
        space.lastSelection = space.getTextareaSelection();
    }
}

function textareaBeforeinputRoute(e) {
    space.lastTextareaValue = space.textarea.value;
}

function textareaKeydownRoute(e) {
    if (!e.ctrlKey && !e.shiftKey && !e.altKey) {
        if (e.key == " ") {
            if (space.textarea.selectionStart == space.textarea.selectionEnd) {
                if (
                    ( // First line
                        !/\n/.test(space.textarea.value.slice(0, space.textarea.selectionStart))
                        && (
                            / +$/.test(space.textarea.value.slice(0, space.textarea.selectionStart))
                            || space.textarea.selectionStart === 0
                        )
                    ) || (
                        /\n +$/.test(space.textarea.value.slice(0, space.textarea.selectionStart))
                        || (
                            space.textarea.selectionStart < space.textarea.value.length
                            && (
                                /\n +\n$/.test(space.textarea.value.slice(0, space.textarea.selectionStart + 1))
                                || /\n$/.test(space.textarea.value.slice(0, space.textarea.selectionStart))
                            )
                        )
                        || ( // Last line
                            space.textarea.value.length == space.textarea.selectionStart
                            && (
                                /\n +$/.test(space.textarea.value)
                                || /\n$/.test(space.textarea.value)
                            )
                        )
                    )
                ) {
                    e.preventDefault();
                    let nextCaretPosition = space.textarea.selectionStart + 4;
                    let value =
                        space.textarea.value.slice(0, space.textarea.selectionStart)
                        + "    "
                        + space.textarea.value.slice(space.textarea.selectionEnd);
                    space.setTextarea(value, nextCaretPosition)
                    textareaInputRoute();
                }
            }
        }
        if (e.key == "Enter") {
            let value = space.textarea.value,
                rows = value.split('\n'),
                currentCoordinates = space.getSelectionStartCoordinates(),
                currentLine = currentCoordinates[0],
                currentColumn = currentCoordinates[1],
                currentLineContent = rows[currentLine];
            if (
                /^    /.test(currentLineContent)
            ) {
                e.preventDefault();
                if (
                    currentColumn % 4 !== 0
                    && currentColumn < currentLineContent.match(/^(    )+/)[0].length
                ) {
                    for (let i = currentColumn; 0 <= i; i--) {
                        if (i % 4 == 0) {
                            if (space.textarea.selectionStart == space.textarea.selectionEnd) {
                                space.textarea.selectionEnd = rows.slice(0, currentLine).join().length + i;
                            }
                            space.textarea.selectionStart = rows.slice(0, currentLine).join().length + i;
                            currentColumn = i;
                            break;
                        }
                    }
                }
                let paddingToCarret = 0;
                if (currentColumn > 0) {
                    paddingToCarret = currentLineContent.slice(0, currentColumn).match(/^(    )+/)[0].length;
                }
                let selectionStart = space.textarea.selectionStart,
                    endString = space.textarea.value.slice(space.textarea.selectionEnd);
                if (endString.split('\n')[0].trim() == "") {
                    endString = '\n' + endString.split('\n').slice(1).join('\n');
                }
                let value =
                    space.textarea.value.slice(0, space.textarea.selectionStart)
                    + '\n'
                    + " ".repeat(paddingToCarret)
                    + endString;
                space.setTextarea(value, selectionStart + paddingToCarret + 1);
                textareaInputRoute();
            }
        }
    } else if (!e.ctrlKey && e.shiftKey && !e.altKey) {
        if (e.key == " ") {
            if (space.textarea.selectionStart == space.textarea.selectionEnd) {

            } else {

            }
        }
    } else if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        // Correcting <textarea> default behavior...
        if (e.key == "Backspace") {
            let rows = space.textarea.value.split('\n'),
                currentCoordinates = space.getSelectionStartCoordinates(),
                currentLine = rows[currentCoordinates[0]],
                currentLineToCaret = currentLine.slice(0, currentCoordinates[1]);
            if (
                space.textarea.selectionEnd == space.textarea.selectionStart
                && /^ +$/.test(currentLineToCaret)
            ) {
                e.preventDefault();
                let paddingRemoved = 0;
                if (currentLineToCaret.length % 4 == 0) {
                    rows[currentCoordinates[0]] = currentLine.slice(4);
                    paddingRemoved = 4;
                } else {
                    rows[currentCoordinates[0]] = currentLine.slice(currentLineToCaret.length % 4);
                    paddingRemoved = currentLineToCaret.length % 4;
                }
                space.setTextarea(rows.join('\n'));
                textareaInputRoute();
                space.setCarretAt(currentCoordinates[0], currentCoordinates[1] - paddingRemoved);
            }

        }
        if (e.key == " ") {
            let value =
                space.textarea.value.slice(0, space.textarea.selectionStart)
                + '	'
                + space.textarea.value.slice(space.textarea.selectionEnd);
            space.setTextarea(space.formatIndentation(value), space.textarea.selectionEnd + 1);
            textareaInputRoute();
        }
        if (e.key == "]") {
            e.preventDefault();
            let rows = space.textarea.value.split('\n'),
                selectionStartLineNumber =
                    space.textarea.value.slice(0, space.textarea.selectionStart).split('\n').length - 1,
                selectionEndLineNumber =
                    space.textarea.value.slice(0, space.textarea.selectionEnd).split('\n').length - 1,
                newSelectionStart = space.textarea.selectionStart + 4,
                newSelectionEnd =
                    space.textarea.selectionEnd
                    + (4 * (selectionEndLineNumber - selectionStartLineNumber + 1));
            for (let i = 0, c = rows.length; i < c; i++) {
                if (
                    i >= selectionStartLineNumber
                    && i <= selectionEndLineNumber
                ) {
                    rows[i] = "    " + rows[i];
                }
            }
            space.setTextarea(rows.join('\n'), newSelectionStart, newSelectionEnd);
            textareaInputRoute();
        }
        if (e.key == "[") {
            let value = space.textarea.value,
                rows = space.textarea.value.split('\n'),
                selectionStartLineNumber =
                    space.textarea.value.slice(0, space.textarea.selectionStart).split('\n').length - 1,
                selectionEndLineNumber =
                    space.textarea.value.slice(0, space.textarea.selectionEnd).split('\n').length - 1,
                newSelectionStart = space.textarea.selectionStart,
                newSelectionEnd = space.textarea.selectionEnd;
            for (let i = 0, c = rows.length; i < c; i++) {
                if (
                    i >= selectionStartLineNumber
                    && i <= selectionEndLineNumber
                    && rows[i].startsWith("    ")
                ) {
                    if (i == selectionStartLineNumber)
                        newSelectionStart -= 4;
                    newSelectionEnd -= 4;
                    rows[i] = rows[i].slice(4);
                }
            }
            space.setTextarea(rows.join('\n'), newSelectionStart, newSelectionEnd);
            textareaInputRoute();
        }
        if (e.key == "Enter") {
            let rows = space.textarea.value.split('\n'),
                currentLineNumber = space.getCurrentLine();
            if (currentLineNumber == rows.length - 1) {
                space.setTextarea(
                    rows.join('\n')
                    + '\n'
                );
            } else {
                space.setTextarea(
                    rows.slice(0, currentLineNumber + 1).join('\n')
                    + '\n\n'
                    + rows.slice(currentLineNumber + 1).join('\n')
                );
            }
            textareaInputRoute();
            space.setCarretAt(currentLineNumber + 1);
        }
        if (e.key == "z") {
            e.preventDefault();
            if (space.historyPosition > 1) {
                space.historyPosition -= 1;
                let lastTextareaState = space.history[space.historyPosition - 1];
                space.setTextarea(lastTextareaState[0], lastTextareaState[1]);
                space.update();
                space.virtualScroller.inputHandler(true);
                space.textarea.blur();
                space.textarea.focus();
            }
        }
        if (e.key == "y") {
            e.preventDefault();
            if (space.historyPosition < space.history.length) {
                space.historyPosition += 1;
                let lastTextareaState = space.history[space.historyPosition - 1];
                space.setTextarea(lastTextareaState[0], lastTextareaState[1]);
                space.update();
                space.virtualScroller.inputHandler(true);
                space.textarea.blur();
                space.textarea.focus();
            }
        }
    } else if (!e.ctrlKey && e.shiftKey && e.altKey) {
        if (e.key == "f") {
            space.setTextarea(space.formatIndentation(space.textarea.value), space.textarea.selectionEnd);
        }
    } else if (!e.ctrlKey && !e.shiftKey && e.altKey) {
        if (e.key == "ArrowDown") {
            if (space.getSelectionStartCoordinates()[0] == space.getSelectionEndCoordinates()[0]) {
                let rows = space.textarea.value.split('\n'),
                    currentLineNumber = space.getCurrentLine(),
                    currentLine = rows[space.getCurrentLine()].slice();
                if (space.getCurrentLine() !== rows.length) {
                    let nextLine = rows[space.getCurrentLine() + 1].slice();
                    rows[space.getCurrentLine()] = nextLine;
                    rows[space.getCurrentLine() + 1] = currentLine;
                    space.setTextarea(rows.join('\n'));
                    textareaInputRoute();
                    space.setCarretAt(currentLineNumber + 1);
                }
            } else {
                let rows = space.textarea.value.split('\n'),
                    currentSelectionLineStart = space.getSelectionStartCoordinates()[0],
                    currentSelectionLineEnd = space.getSelectionEndCoordinates()[0];
                if (currentSelectionLineEnd < currentSelectionLineStart) {
                    currentSelectionLineStart = space.getSelectionEndCoordinates()[0];
                    currentSelectionLineEnd = space.getSelectionStartCoordinates()[0];
                }
                if (currentSelectionLineEnd != rows.length) {
                    let currentLines = rows.slice(currentSelectionLineStart, currentSelectionLineEnd + 1),
                        nextLine = rows[currentSelectionLineEnd + 1].slice();
                    rows[currentSelectionLineStart] = nextLine;
                    for (let i = currentSelectionLineStart, c = i + currentLines.length; i < c; i++) {
                        rows[i + 1] = currentLines[i - currentSelectionLineStart];
                    }
                    if (currentSelectionLineEnd < currentSelectionLineStart) {
                        space.setTextarea(
                            rows.join('\n'),
                            space.textarea.selectionEnd + nextLine.length + 1,
                            space.textarea.selectionStart + nextLine.length + 1
                        );
                    } else {
                        space.setTextarea(
                            rows.join('\n'),
                            space.textarea.selectionStart + nextLine.length + 1,
                            space.textarea.selectionEnd + nextLine.length + 1
                        );
                    }
                    textareaInputRoute();
                }
            }
        } else if (e.key == "ArrowUp") {
            if (space.getSelectionStartCoordinates()[0] == space.getSelectionEndCoordinates()[0]) {
                let rows = space.textarea.value.split('\n'),
                    currentLineNumber = space.getCurrentLine(),
                    currentLine = rows[space.getCurrentLine()].slice();
                if (space.getCurrentLine() !== 0) {
                    let previousLine = rows[space.getCurrentLine() - 1].slice();
                    rows[space.getCurrentLine()] = previousLine;
                    rows[space.getCurrentLine() - 1] = currentLine;
                    space.setTextarea(rows.join('\n'));
                    textareaInputRoute();
                    space.setCarretAt(currentLineNumber - 1);
                }
            } else {
                let rows = space.textarea.value.split('\n'),
                    currentSelectionLineStart = space.getSelectionStartCoordinates()[0],
                    currentSelectionLineEnd = space.getSelectionEndCoordinates()[0];
                if (currentSelectionLineEnd < currentSelectionLineStart) {
                    currentSelectionLineStart = space.getSelectionEndCoordinates()[0];
                    currentSelectionLineEnd = space.getSelectionStartCoordinates()[0];
                }
                if (currentSelectionLineStart != 0) {
                    let currentLines = rows.slice(currentSelectionLineStart, currentSelectionLineEnd + 1),
                        previousLine = rows[currentSelectionLineStart - 1].slice();
                    rows[currentSelectionLineEnd] = previousLine;
                    for (let i = currentSelectionLineStart, c = i + currentLines.length; i < c; i++) {
                        rows[i - 1] = currentLines[i - currentSelectionLineStart];
                    }
                    if (currentSelectionLineEnd < currentSelectionLineStart) {
                        space.setTextarea(
                            rows.join('\n'),
                            space.textarea.selectionEnd - previousLine.length - 1,
                            space.textarea.selectionStart - previousLine.length - 1
                        );
                    } else {
                        space.setTextarea(
                            rows.join('\n'),
                            space.textarea.selectionStart - previousLine.length - 1,
                            space.textarea.selectionEnd - previousLine.length - 1
                        );
                    }
                    textareaInputRoute();
                }
            }
        }
    }
    space.debounceLint();
}

function textareaCutRoute(e) {
    if (space.textarea.selectionStart == space.textarea.selectionEnd) {
        e.preventDefault();
        let rows = space.textarea.value.split('\n'),
            currentLine = space.getCurrentLine(),
            currentLineStart = rows.slice(0, currentLine).join('\n').length,
            currentLineEnd = currentLineStart + rows[currentLine].length + 1;
        space.textarea.setSelectionRange(currentLineStart, currentLineEnd);
        space.lastTextareaValue = space.textarea.value;
        document.execCommand('cut');
        textareaInputRoute();
        spaceScrollRoute();
    }
}

function textareaCopyRoute(e) {
    if (space.textarea.selectionStart == space.textarea.selectionEnd) {
        e.preventDefault();
        let rows = space.textarea.value.split('\n'),
            currentLine = space.getCurrentLine(),
            currentLineStart = rows.slice(0, currentLine).join('\n').length,
            currentLineEnd = currentLineStart + rows[currentLine].length + 1;
        space.textarea.setSelectionRange(currentLineStart, currentLineEnd);
        document.execCommand('copy');
    }
}

function textareaPasteRoute(e) {
    e.preventDefault();
    let clipboardText = e.clipboardData.getData("text").replace(new RegExp(/\r/g), ''),
        textStart = space.textarea.value.slice(0, space.textarea.selectionStart),
        textEnd = space.textarea.value.slice(space.textarea.selectionEnd),
        value = textStart + clipboardText + textEnd,
        selectionEnd = space.textarea.selectionStart + clipboardText.length;
    // JSON auto-conversion
    if (
        textStart + textEnd == ''
        || space.textarea.selectionStart == 0 && space.textarea.selectionEnd == value.length - 1
    ) {
        try {
            let object = JSON.parse(value);
            if ( // Array of flat-arrays
                Array.isArray(object)
                && object.map(x => Array.isArray(x)).indexOf(false) == -1
                && object.map(
                    x => x.map(
                        y => (!Array.isArray(y) && (typeof x !== 'object' || x == null))
                    ).indexOf(false) == -1
                ).indexOf(false) == -1
            ) {
                space.setTextarea(space.damonUtils.jsonToDamonTable(value));
            } else if ( // Array of flat-objects
                Array.isArray(object)
                && object.map(x => (typeof x == 'object' && !Array.isArray(x) && x !== null)).indexOf(false) == -1
                && object.map(
                    x => Object.keys(x).map(
                        y => (
                            !(typeof x[y] === 'object' && !Array.isArray(x[y]) && x[y] !== null)
                            && !Array.isArray(x[y])
                        )
                    ).indexOf(false) == -1
                ).indexOf(false) == -1
            ) {
                space.setTextarea(
                    space.damonUtils.jsonToDamonTable(value, 'dict-rows').replaceAll(': null\n', '\n').slice(0, -6)
                );
            } else if ( // Object of nulls or flat-objects
                (typeof object == 'object' && !Array.isArray(object) && object !== null)
                && Object.keys(object).map(
                    x => (object[x] !== null)
                ).indexOf(true) > -1
                && Object.keys(object).map(
                    x => (
                        (typeof object[x] === 'object' && !Array.isArray(object[x]) && object[x] !== null)
                        || object[x] === null
                    )
                ).indexOf(false) == -1
                && Object.keys(object).map(
                    x => (
                        object[x] === null
                        || Object.keys(object[x]).map(
                            y => (
                                !(typeof x[y] === 'object' && !Array.isArray(x[y]) && x[y] !== null)
                                && !Array.isArray(x[y])
                            )
                        ).indexOf(false) == -1
                    )
                ).indexOf(false) == -1
            ) {
                let map = space.damon.jsonToMap(value);
                map.headless = true;
                space.setTextarea(
                    space.damon.mapToDamon(map).replaceAll(': null\n', '\n').slice(0, -6)
                );
            } else {
                let sExpression = true;
                if (Array.isArray(object)) {
                    recurse(object);
                } else {
                    sExpression = false;
                }
                function recurse(array) {
                    if (typeof array[0] === 'string') {
                        for (let i = 0, c = array.length; i < c; i++) {
                            if (Array.isArray(array[i])) {
                                recurse(array[i])
                            } else if (
                                typeof array[i] == 'object' && !Array.isArray(array[i]) && array[i] !== null
                            ) {
                                sExpression = false;
                            }
                        }
                    } else {
                        sExpression = false;
                    }
                }
                if (sExpression) {
                    space.setTextarea(
                        space.damonUtils.sExpressionToDamon(value).replaceAll(': null\n', '\n').slice(0, -6)
                    );
                } else {
                    let map = space.damon.jsonToMap(value);
                    if (
                        typeof map === 'object'
                        && map !== null
                        && !Array.isArray(map)
                        && map instanceof Map
                        && map.constructor === Map
                    ) {
                        map.headless = true;
                    }
                    space.setTextarea(space.damon.mapToDamon(map));
                }
            }
            textareaInputRoute();
            spaceScrollRoute();
            return;
        } catch (error) {
            try {
                space.damon.damonToMap(value);
            } catch (error) {
                let content = value,
                    delimiter = /\r\n/.test(content) ? '\r\n' : '\n',
                    lines = content.split(delimiter);
                if (delimiter == '\n' && /\\*\n/.test(content)) {
                    if (/[^\\]\\(\\\\)*\n/.test(content)) {
                        let errorLine = content.split(/[^\\]\\(\\\\)*\n/)[0].split('\n').length;
                        let error = new Error(
                            "Error line " + errorLine + ": oddly escaped newline"
                        );
                        console.log(error);
                    }
                    let reversedcontent = content.split('').reverse().join(''),
                        reversedmdLines = reversedcontent.split(/\n/);
                    lines = reversedmdLines.map((x) => x.split('').reverse().join('')).reverse();
                }
                try {
                    space.setTextarea(space.damonUtils.csvToDamonTable(value));
                    textareaInputRoute();
                    spaceScrollRoute();
                    return;
                } catch (error) {
                    console.log(error);
                }
            }
        }
    }
    let rows = value.split('\n'),
        lastCaretPos = selectionEnd,
        charsToSelectionEndLine = 0,
        selectionEndLine = 0;
    for (let i = 0, c = rows.length; i < c; i++) {
        if (
            (charsToSelectionEndLine + rows[i].length + i) < lastCaretPos
        ) {
            charsToSelectionEndLine += rows[i].length;
        } else {
            charsToSelectionEndLine += i;
            selectionEndLine = i;
            break;
        }
    }
    let coordinates = [selectionEndLine, selectionEnd - charsToSelectionEndLine],
        selectionEndLineText = rows[selectionEndLine].slice(0);
    value = space.formatIndentation(value);
    rows = value.split('\n');
    if (space.textarea.value !== value) {
        let selectionStart =
            rows.slice(0, selectionEndLine + 1).join('\n').length
            - selectionEndLineText.length
            + coordinates[1];
        space.setTextarea(value, selectionStart);
        textareaInputRoute();
        spaceScrollRoute();
    }
}

// # virtualScroller.js

space.textarea
    .addEventListener('input', textareaInputRoute);
space.editor
    .addEventListener('scroll', spaceScrollRoute);
// Bug: resizing after a linting error empties the overlay
// window
//     .addEventListener('resize', windowResizeRoute);

function textareaInputRoute() {
    if (document.activeElement != space.textarea) {
        return;
    }
    // space.virtualScroller.inputHandler();
    space.update();
    space.debounceHistoryUpdate();
    space.updateCurrentLine();
    space.updateHorizontalScroll();
    space.updateCaret();
    space.debounceLint();
}

function spaceScrollRoute(e) {
    space.virtualScroller.scrollHandler();
}

window.spaceResizeTimeout = null;
function windowResizeRoute(e) {
    // Throtles resize events
    console.log('B');
    if (spaceResizeTimeout) {clearTimeout(spaceResizeTimeout)};
    window.spaceResizeTimeout = setTimeout(function() {
        let previousScrollTop = space.editor.scrollTop;
        space.gutter.innerHTML = '';
        space.overlay.firstElementChild.innerHTML = '';
        space.initialized = false;
        space.virtualScroller.inputHandler();
        space.initialized = true;
        space.editor.scrollTop = previousScrollTop;
    },100);
}
});
