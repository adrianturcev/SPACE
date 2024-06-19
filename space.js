const  utils = require('./utils.js');
const  DamonTwo = require('damon2');
const  VirtualScroller = require('./virtualScroller.js');
//#### Space
// <element class="space">
module.exports =
class Space {
    //# MODEL
    /**
    * @param { object } rootElement
    * @param {{ mode: string; }} app
    */
    constructor(rootElement, prism, app) {
        let $ = this;
        $.dom = rootElement;
        $.dom.classList.add('space');
        $.innerHTML = '';
        $.editor = {};
        $.gutter = {};
        $.container = {};
        $.overlay = {};
        $.textarea = {};
        $.caretPadding = {};
        $.caret = {};
        $.statusBar = {};
        $.copyButton = {};
        $.prism = prism;
        $.indentation = "    ";
        $.currentLine = 0;
        $.history = [];
        $.historyPosition = 0;
        $.historyUpdateTimeoutId;
        $.lastTextareaValue = '';
        $.lastSelection = '';
        $.initialized = false;
        $.virtualScroller = {};
        $.damon = new DamonTwo();
        $.utils = utils;
    }

    // # Methods
    init() {
        let $ = this;
        $.statusBarHTML = utils.html`
<div>
    Spaces: <a href="https://github.com/adrianturcev/space/blob/master/bindings.md"><kbd>SPACE</kbd></a>
</div>
<a href="https://github.com/adrianturcev/damon/blob/master/language_reference.md">
    DAMON 
    <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg">
        <title>help-circle</title>
        <circle
            style="fill:#FEFEFE;stroke-width:1.04312;fill-opacity:1"
            cx="12"
            cy="12"
            r="9.6854191" />
        <path
            fill="#FEFEFE"
            d="M15.07,11.25L14.17,12.17C13.45,12.89 13,13.5 13,15H11V14.5C11,13.39 11.45,12.39 12.17,11.67L13.41,10.41C13.78,10.05 14,9.55 14,9C14,7.89 13.1,7 12,7A2,2 0 0,0 10,9H8A4,4 0 0,1 12,5A4,4 0 0,1 16,9C16,9.88 15.64,10.67 15.07,11.25M13,19H11V17H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z"
            style="fill:#4169e1;fill-opacity:1" />
    </svg>
</a>
<button class="space-copyButton">
    JSON
    <svg
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg">
        <title>content-copy</title>
        <path
            fill="#FEFEFE"
            d="M 4,21 H 15 V 7 H 4 M 4,5 h 11 a -2,2 0 0 1 2,2 v 14 a -2,2 0 0 1 -2,2 H 4 A -2,2 0 0 1 2,21 V 7 A -2,2 0 0 1 4,5 M 7,1 h 12 a -2,2 0 0 1 2,2 V 17 H 19 V 3 H 7 Z"/>
    </svg>
</button>`;
        $.innerHTML = utils.html`
<div class="space-editor" data-state="js-off">
    <div class="space-gutter"></div>
    <div class="space-container">
<pre class="space-dummyTextarea"><span class="space-caretPadding"></span><span class="space-caret">&nbsp;</span></pre>
        <pre class="space-overlay" aria-hidden="true" tabindex="-1">
            <code class="language-damon"></code>
        </pre>
        <textarea
            class="space-textarea"
            spellcheck="false"
            aria-labelledby=""
            aria-controls="space-statusBar0"
            maxlength="500000">
        </textarea>
        <ul class="space-suggestions"></ul>
    </div>
</div>
<div class="space-statusBar" id="space-statusBar0" role="log" aria-live="polite">${ $.statusBarHTML }</div>
        `;
        let textareaContent = '';
        if ($.dom.innerHTML !== $.innerHTML) {
            if ($.dom.getElementsByTagName('textarea')[0] !== undefined) {
                textareaContent = $.dom.getElementsByTagName('textarea')[0].innerHTML;
            }
            $.dom.innerHTML = $.innerHTML;
        }
        $.editor = $.dom.getElementsByClassName('space-editor')[0],
        $.gutter = $.dom.getElementsByClassName('space-gutter')[0];
        $.container = $.dom.getElementsByClassName('space-container')[0];
        $.overlay = $.dom.getElementsByClassName('space-overlay')[0];
        $.textarea = $.dom.getElementsByClassName('space-textarea')[0];
        $.textarea.innerHTML = textareaContent;
        $.caretPadding = $.dom.getElementsByClassName('space-caretPadding')[0];
        $.caret = $.dom.getElementsByClassName('space-caret')[0];
        $.statusBar = $.dom.getElementsByClassName('space-statusBar')[0];
        $.copyButton =  $.dom.getElementsByClassName('space-copyButton')[0];
        $.virtualScroller = new VirtualScroller(this);
        $.editor.dataset.state = '';
        // Normalizing textarea content
        $.textarea.value = $.formatIndentation($.textarea.value.replaceAll(/\r/g, ''));
        // $.virtualScroller.init();
        $.routes = require('./routes.js')(this);
        $.lint();
    }

    update() {
        let $ = this;
        if (
            $.initialized
            && $.lastTextareaValue == $.textarea.value
        ) {
            return;
        }
        if ($.gutter.children.length == 0) {
            $.virtualScroller.init(0);
        } else {
            $.virtualScroller.inputHandler();
        }
        if ($.initialized) {
            $.lastTextareaValue = $.textarea.value;
        }
    }

    updateHorizontalScroll() {
        let $ = this;
        // Fixes return carriage after long lines not scrolling caret back into view beyond the gutter
        if (document.activeElement == $.textarea) {
            let rows = $.textarea.value.split('\n'),
                charsToCurrentLine = 0,
                charWidth = $.gutter.children[0].children[0].getBoundingClientRect().width;
            for (let i = 0, c = rows.length; i < c; i++) {
                if (
                    (charsToCurrentLine + rows[i].length) < $.textarea.selectionEnd
                ) {
                    charsToCurrentLine += rows[i].length + 1;
                } else {
                    break;
                }
            }
            if (
                (($.textarea.selectionEnd - charsToCurrentLine) * charWidth) - $.gutter.clientWidth
                <= $.editor.scrollLeft
            ) {
                $.editor.scrollLeft = 0;
            }
        }
    }

    getCurrentLine() {
        let $ = this;
        let rows = $.textarea.value.split('\n'),
            lastCaretPos = 0,
            charsToCurrentLine = 0,
            currentLine = 0;
        if (
            $.textarea.selectionDirection == 'forward'
            || $.textarea.selectionStart == $.textarea.selectionEnd
        ) {
            lastCaretPos = $.textarea.selectionEnd;
        }
        if ($.textarea.selectionDirection == 'backward') {
            lastCaretPos = $.textarea.selectionStart;
        }
        for (let i = 0, c = rows.length; i < c; i++) {
            if (
                (charsToCurrentLine + rows[i].length + i) < lastCaretPos
            ) {
                charsToCurrentLine += rows[i].length;
            } else {
                currentLine = i;
                break;
            }
        }
        return currentLine;
    }

    getSelectionStartCoordinates() {
        let $ = this;
        let rows = $.textarea.value.split('\n'),
            lastCaretPos = $.textarea.selectionStart,
            charsToCurrentLine = 0,
            currentLine = 0;
        for (let i = 0, c = rows.length; i < c; i++) {
            if (
                (charsToCurrentLine + rows[i].length + i) < lastCaretPos
            ) {
                charsToCurrentLine += rows[i].length;
            } else {
                charsToCurrentLine += i;
                currentLine = i;
                break;
            }
        }
        return [currentLine, $.textarea.selectionStart - charsToCurrentLine];
    }

    getSelectionEndCoordinates() {
        let $ = this;
        let rows = $.textarea.value.split('\n'),
            lastCaretPos = $.textarea.selectionEnd,
            charsToCurrentLine = 0,
            currentLine = 0;
        for (let i = 0, c = rows.length; i < c; i++) {
            if (
                (charsToCurrentLine + rows[i].length + i) < lastCaretPos
            ) {
                charsToCurrentLine += rows[i].length;
            } else {
                charsToCurrentLine += i;
                currentLine = i;
                break;
            }
        }
        return [currentLine, $.textarea.selectionEnd - charsToCurrentLine];
    }
    /**
     * @param {number} lineNumber
     */
    setCarretLine(lineNumber) {
        let $ = this;
        if (lineNumber == 0) {
            $.textarea.selectionStart = 0;
        } else {
            $.textarea.selectionStart =
                $.textarea.value
                    .split('\n')
                    .slice(0, lineNumber)
                    .reduce(function (a, b) {
                        return a + b;
                    }).length
                    + lineNumber
                    + $.textarea.value.split('\n')[lineNumber].length;
        }
        $.textarea.selectionEnd = $.textarea.selectionStart;
        $.textarea.focus();
    }

    // firefox does not support document.getSelection() in inputs/textareas
    getTextareaSelection() {
        let $ = this;
        if ($.textarea.selectionStart < $.textarea.selectionEnd) {
            return $.textarea.value.slice($.textarea.selectionStart, $.textarea.selectionEnd);
        } else if ($.textarea.selectionStart < $.textarea.selectionEnd) {
            return $.textarea.value.slice($.textarea.selectionEnd, $.textarea.selectionStart);
        } else {
            return undefined;
        }
    }

    /**
     * @param {boolean} scrolling
     */
    updateCurrentLine(scrolling) {
        let $ = this;
        let lastCurrentLine = $.currentLine;
        $.currentLine =  $.getCurrentLine();
        if (
            lastCurrentLine != $.currentLine
            || !$.initialized
            || scrolling
            || (
                $.lastSelection != undefined
                && $.getTextareaSelection() == undefined
            )
        ) {
            for (let i = 0, c = $.gutter.children.length; i < c; i++) {
                $.gutter.children[i].classList.remove('currentLine');
                $.gutter.children[i].classList.remove('selectionEnd');
            }
            let currentLineDiv = $.gutter.children[$.currentLine - $.gutter.children[0].textContent.trim() + 1];
            if (currentLineDiv) {
                if ($.textarea.selectionEnd == $.textarea.selectionStart) {
                    $.gutter.children[$.currentLine - $.gutter.children[0].textContent.trim() + 1].classList.add('currentLine');
                } else {
                    $.gutter.children[$.currentLine - $.gutter.children[0].textContent.trim() + 1].classList.add('selectionEnd');
                }
            }
        }
    }

    historyUpdate() {
        let $ = this;
        if (
            $.history.length == 0
            || $.textarea.value != $.history[$.historyPosition - 1][0]
        ) {
            if ($.historyPosition != $.history.length) {
                // Classic rewrite case
                $.history = $.history.slice(0, $.historyPosition);
                // Stack case
                // historyPosition++;
            }
            $.history.push([
                $.textarea.value,
                $.textarea.selectionStart
            ]);
            // Not for essays anyways
            function concatenate2D(a, b) {
                return a + b[0] + b[1];
            }
            if ($.history.reduce(concatenate2D, '').length * 4 > 100000000) {
                let i = 0;
                while ($.history.reduce(concatenate2D, '').length * 4 > 100000000) {
                    i++;
                    $.history.shift();
                }
                $.historyPosition -= i;
            }
            $.historyPosition++;
        }
    }

    debounceHistoryUpdate() {
        var context = this,
            args = arguments;
        clearTimeout(this.historyUpdateTimeoutId);
        this.historyUpdateTimeoutId = setTimeout(function(){
            context.historyUpdateTimeoutId = null;
            context.historyUpdate.apply(context, args);
        }, 200);
    };

    /**
     * @param {string} value
     * @returns string
     */
    formatIndentation(value) {
        let $ = this;
        let rows = value.split('\n');
        for (let i = 0, c = rows.length; i < c; i++) {
            // - Replacing leading tabs
            if (/^ *(\t)+/.test(rows[i])) {
                const tabsPaddingLength = rows[i].match(/^ *(\t)+/)[0].length;
                for (let z = 0, x = tabsPaddingLength; z < x; z++) {
                    rows[i] = rows[i].replace('	', '    ');
                }
            }
            // Flooring fractionary space indentation
            if (
                /^( )+/.test(rows[i])
                && rows[i].match(/^( )+/)[0].length % 4 !== 0
            ) {
                for (let z = rows[i].match(/^( )+/)[0].length; 0 <= z; z--) {
                    if (z % 4 == 0) {
                        rows[i].trimStart();
                        rows[i] = " ".repeat(z) + rows[i];
                        break;
                    }
                }
            }
        }
        return rows.join('\n');
    }

    /**
     * @param {string} value
     * @returns string
     */
    formatHyphens(value) {
        let $ = this;
        let rows = value.split('\n');
        // Fixing missing hyphens
        for (let i = 0, c = rows.length; i < c; i++) {
            if (!/^ *- /.test(rows[i])) {
                let padding = "";
                if (/^ /.test(rows[i])) {
                    padding = rows[i].match(/^( )+/)[0];
                }
                rows[i] = padding + '- ' + rows[i].slice(padding.length);
            }
        }
        return rows.join('\n');
    }

    updateCaret() {
        let $ = this;
        // Unfortunately, monospace *can* get broken
        // https://superuser.com/questions/1672239/why-are-some-characters-in-monospaced-fonts-not-really-monospaced
        if (
            $.textarea.selectionDirection == 'forward'
            || $.textarea.selectionStart == $.textarea.selectionEnd
        ) {
            $.caretPadding.textContent = $.textarea.value.slice(0, $.textarea.selectionEnd);
        } else {
            $.caretPadding.textContent = $.textarea.value.slice(0, $.textarea.selectionStart);
        }
    }
    /**
     * @param {string} value
     * @param {number} selectionStart
     * @param {number} [selectionEnd=selectionStart]
     */
    setTextarea(value, selectionStart, selectionEnd = selectionStart) {
        let $ = this;
        $.lastTextareaValue = $.textarea.value;
        $.textarea.value = value;
        $.textarea.setSelectionRange(selectionStart, selectionEnd);
    }

    lint() {
        let $ = this;
        try {
            $.damon.damonToMap($.textarea.value);
            $.statusBar.innerHTML = $.statusBarHTML;
        } catch (error) {
            if (error.language == "JSON") {
                $.statusBar.innerHTML =
                "<span>( ! ) Error line number "
                + error.line + ': ' + error.type + ' not JSON-compliant'
                 + '</span>'
                + $.statusBarHTML;
            } else {
                $.statusBar.innerHTML =
                "<span>( ! ) " + error.message  + '</span>' + $.statusBarHTML;
            }
            console.error(error);
        }
        $.copyButton = $.dom.getElementsByClassName('space-copyButton')[0];
        $.copyButton.addEventListener('click', function (e) {
            let textInput = document.createElement('textarea');
            textInput.style.opacity = "0";
            try {
                textInput.value = $.damon.damonToJSON($.textarea.value);
            } catch (error) {
                setTimeout(function() {
                    $.copyButton.classList.remove('error');
                }, 1100);
                $.copyButton.classList.add('error');
                return;
            }
            document.body.appendChild(textInput);
            textInput.focus();
            textInput.select();
            try {
                const success = document.execCommand("copy");
                if (success) {
                    setTimeout(function() {
                        $.copyButton.classList.remove('success')
                    }, 1100);
                    $.copyButton.classList.add('success')
                }
            } catch (err) {
                console.error(err.name, err.message);
            }
            document.body.removeChild(textInput);
        });
    }
};