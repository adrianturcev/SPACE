module.exports =
(function (space) {
// # Scheduling
// ## Space.js
// Filling the overlay as to trigger Prismjs on load
// Won't auto-load plugins otherwise
space.update();
space.historyUpdate();
window
    .addEventListener('load', windowLoadRoute);

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

function windowLoadRoute(e) {
    // Removing plugin-less code and avoiding duplication
    space.overlay.firstElementChild.innerHTML = '';
    space.gutter.innerHTML = '';
    space.update();
    space.updateCurrentLine();
    space.initialized = true;
}

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
        space.setCarretLine(parseInt(e.target.textContent.trim()) - 1);
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
        space.setCarretLine(carretLine - 1);
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
                selectionEndLineNumber = space.textarea.value.slice(0, space.textarea.selectionEnd).split('\n').length - 1,
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
        if (e.key == "z") {
            e.preventDefault();
            if (space.historyPosition > 1) {
                space.historyPosition -= 1;
                space.setTextarea(space.history[space.historyPosition - 1][0], space.history[space.historyPosition - 1][1]);
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
                space.setTextarea(space.history[space.historyPosition - 1][0], space.history[space.historyPosition - 1][1]);
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
    }
    try {
        space.lint();
    } catch (error) {
        space.lint()
        console.error(error);
    }
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
        space.updateCaret();
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
    }
    space.updateCaret();
    try {
        space.lint();
    } catch (error) {
        space.lint()
        console.error(error);
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
    try {
        space.lint();
    } catch (error) {
        space.lint()
        console.error(error);
    }
}

function spaceScrollRoute(e) {
    space.virtualScroller.scrollHandler();
    space.updateCurrentLine(true);
}

window.spaceResizeTimeout = null;
function windowResizeRoute(e) {
    // Throtles resize events
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