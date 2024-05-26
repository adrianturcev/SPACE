
//#### VirtualScroller
// <element id="gutter">
module.exports =
class VirtualScroller {
    //# MODEL
    constructor(parentContext) {
        let $ = this;
        this.parent = parentContext;
        this.itemHeight =
            parseFloat(getComputedStyle(this.parent.editor).getPropertyValue("--fontSize"))
            * parseFloat(getComputedStyle(this.parent.editor).getPropertyValue("--lineHeight"));
        this.viewportHeight = this.parent.editor.getBoundingClientRect().height;
        this.viewable = Math.ceil($.viewportHeight / $.itemHeight);
        this.maxCounter = this.parent.textarea.value.split('\n').length;
        this.buffer = $.viewable * 2;
        this.visibleNodesCount = $.viewable + $.buffer;
        this.lastScrollTop = undefined;
        this.lastStart = undefined;
        this.active = false;
    }

    inputHandler(undoOrRedoing) {
        let $ = this;
        // if (
        //     $.parent.lastTextareaValue.split('\n').length != $.parent.textarea.value.split('\n').length
        //     || $.lastStart != $.getStartNode($.parent.textarea.value.split('\n').length)
        //     || undoOrRedoing
        // ) {
            if ($.parent.textarea.value.split('\n').length <= $.visibleNodesCount) {
                $.parent.gutter.innerHTML = '';
                $.init(0);
            } else {
                $.parent.gutter.innerHTML = '';
                $.init($.getStartNode($.parent.textarea.value.split('\n').length));
            }
        // }
    }

    scrollHandler() {
        let $ = this;
        if ($.maxCounter < $.visibleNodesCount) {
            $.parent.gutter.innerHTML = '';
            $.parent.editor.style.setProperty('--scrollbarPadding', '0px');
            $.init(0);
        } else {
            $.active = true;
            // Prevents increasing width on h-scrolling
            $.parent.editor.style.setProperty('--scrollbarPadding', 'var(--textareaPadding) * 4');
            $.update($.getStartNode($.maxCounter));
        }
    }

    init(startNode) {
        let $ = this;
        $.parent.textarea.style.height =
            (($.parent.textarea.value.split('\n').length + 1) * $.itemHeight)
            + 'px';
        $.resetProperties();
        if (startNode > ($.maxCounter - $.visibleNodesCount)) {
            if ($.maxCounter - $.visibleNodesCount > 0) {
                startNode = $.maxCounter - $.visibleNodesCount;
            } else {
                startNode = 0;
            }
        }
        let clamp = Math.max(1, Math.min($.maxCounter - startNode, $.visibleNodesCount));
        // Gutter
        for (let i = startNode; i < startNode + clamp; i++) {
            let lineNumber = document.createElement('div'),
                span = document.createElement('span');
            let maxWhitespace = ($.maxCounter + '').length,
                currentSpace = (i + 1 + '').length,
                currentWhitespace = maxWhitespace - currentSpace;
            span.textContent = ' '.repeat(currentWhitespace) + (i + 1);
            lineNumber.appendChild(span);
            $.parent.gutter.appendChild(lineNumber);
        }
        $.parent.gutter.style.transform =
            'translate(' + $.parent.editor.scrollLeft + 'px, ' + (startNode * $.itemHeight) + 'px)';
        $.parent.overlay.firstElementChild.style.transform =
            'translate(' + $.parent.editor.scrollLeft + 'px, ' + (startNode * $.itemHeight) + 'px)';
        $.lastStart = startNode;
        $.lastScrollTop = $.parent.editor.scrollTop;
        if ($.maxCounter >= $.visibleNodesCount) {
            $.active = true;
        }
        $.setGutterWidth();
        $.parent.updateCurrentLine(true);

        // Textarea Height & width
        let rows = $.parent.textarea.value.split('\n');
        $.parent.textarea.rows = rows.length + 1;
        $.parent.textarea.cols =
            rows.map(x => x.length)
                .reduce(function (a, b) {
                    return Math.max(a, b);
                });
        // Overlay Highlighting
        let unEscapedValue =
                $.parent.textarea.value
                    .replaceAll(/&amp;/g, '&')
                    .replaceAll(/&lt;/g, '<')
                    .replaceAll(/&gt;/g, '>'),
            prismRows = $.parent.prism
                            .highlight(unEscapedValue, $.parent.prism.languages.damon, 'damon')
                            .split('\n</span>')
                            .map((x) => x + '\n</span>'),
            lastTextAreaRows = $.parent.lastTextareaValue.split('\n');
        for (let i = startNode, c = startNode + clamp; i < c; i++) {
            let line = document.createElement('span'),
                spaceCounter = 0;
            line.classList.add('space-Line');
            line.innerHTML = prismRows[i];
            for (let z = 0, x = line.children.length; z < x; z++) {
                if (line.children[z].textContent == ' ') {
                    spaceCounter++;
                    if (spaceCounter == 4) {
                        spaceCounter = 0;
                        line.children[z - 3].classList.add('indent-guide');
                    }
                } else {
                    break;
                }
            }
            if (
                lastTextAreaRows[i] == undefined
                || lastTextAreaRows[i] != rows[i]
                || (
                    $.parent.overlay.firstElementChild.children[i - startNode] != undefined
                    && line.innerHTML != $.parent.overlay.firstElementChild.children[i - startNode].innerHTML
                )
            ) {
                if (
                    lastTextAreaRows[i] == undefined
                    || !$.parent.initialized
                ) {
                    $.parent.overlay.firstElementChild.appendChild(line);
                    if ($.parent.overlay.firstElementChild.children.length > clamp + 1) {
                        $.parent.overlay.firstElementChild.firstElementChild.remove();
                    }
                } else {
                    $.parent
                        .overlay
                        .firstElementChild
                        .replaceChild(line, $.parent.overlay.firstElementChild.children[i - startNode]);
                }
            }
        }
        if ($.parent.overlay.firstElementChild.children.length > clamp) {
            for (let i = clamp, c = $.parent.overlay.firstElementChild.children.length; i < c; i++) {
                $.parent.overlay.firstElementChild.lastElementChild.remove();
            }
        }
    }

    getStartNode(max) {
        let $ = this;
        let startNode = Math.floor($.parent.editor.scrollTop / $.itemHeight) - $.viewable;
        startNode = Math.min(Math.max(0, startNode), Math.max(0, max - $.buffer));
        return startNode;
    }

    resetProperties() {
        let $ = this;
        $.viewportHeight = $.parent.editor.getBoundingClientRect().height;
        $.viewable = Math.ceil($.viewportHeight / $.itemHeight);
        $.maxCounter = $.parent.textarea.value.split('\n').length;
        $.buffer = $.viewable * 2;
        $.visibleNodesCount = $.viewable + $.buffer;
        $.active = false;
    }

    update(startNode) {
        let $ = this;
        $.resetProperties();
        // let's initialize, then guards against going past space height
        if ($.parent.gutter.firstElementChild) {
            if ($.lastScrollTop != $.parent.editor.scrollTop) {
                if (startNode > ($.maxCounter - $.visibleNodesCount)) {
                    if ($.maxCounter - $.visibleNodesCount > 0) {
                        startNode = $.maxCounter - $.visibleNodesCount;
                    } else {
                        startNode = 0;
                    }
                }
                $.diffItems(startNode, $.visibleNodesCount);
                $.parent.gutter.style.transform =
                    'translate(' + $.parent.editor.scrollLeft + 'px, ' + (startNode * $.itemHeight) + 'px)';
                $.parent.overlay.firstElementChild.style.transform =
                    'translate(0px, ' + (startNode * $.itemHeight) + 'px)';
                $.lastScrollTop = $.parent.editor.scrollTop;
            } else {
                if (/^translate\(.+px, .+px\)$/.test($.parent.gutter.style.transform)) {
                    $.parent.gutter.style.transform =
                        'translate('
                        + $.parent.editor.scrollLeft
                        + 'px, '
                        + $.parent.gutter.style.transform.split(', ')[1];
                } else {
                    throw new Error('You need to update this regex.');
                }
            }
        }
        $.setGutterWidth();
    }

    diffItems(n, visible) {
        let $ = this;
        if ($.lastStart != n) {
            if ($.lastStart < n) {
                let delta = Math.min(visible, Math.abs(n - $.lastStart));
                for (let i = 0, c = delta; i < c; i++) {
                    $.parent.gutter.firstElementChild.remove();
                }
                for (let i = n + visible - delta; i < n + visible; i++) {
                    let lineNumber = document.createElement('div'),
                        span = document.createElement('span');
                    let maxWhitespace = ($.maxCounter + '').length,
                        currentSpace = (i + 1 + '').length,
                        currentWhitespace = maxWhitespace - currentSpace;
                    span.textContent = ' '.repeat(currentWhitespace) + (i + 1);
                    lineNumber.appendChild(span);
                    $.parent.gutter.appendChild(lineNumber);
                }
                
                // Textarea Height & width
                let rows = $.parent.textarea.value.split('\n');
                $.parent.textarea.rows = rows.length + 1;
                $.parent.textarea.cols =
                    rows.map(x => x.length)
                        .reduce(function (a, b) {
                            return Math.max(a, b);
                        });
                // Overlay Highlighting
                let unEscapedValue =
                        $.parent.textarea.value
                            .replaceAll(/&amp;/g, '&')
                            .replaceAll(/&lt;/g, '<')
                            .replaceAll(/&gt;/g, '>'),
                    prismRows =
                        $.parent.prism
                            .highlight(unEscapedValue, $.parent.prism.languages.damon, 'damon')
                            .split('\n</span>')
                            .map((x) => x + '\n</span>'),
                    lastTextAreaRows = $.parent.lastTextareaValue.split('\n');
                for (let i = 0, c = delta; i < c; i++) {
                    $.parent.overlay.firstElementChild.firstElementChild.remove();
                }
                for (let i = n + visible - delta; i < n + visible; i++) {
                    let line = document.createElement('span'),
                        spaceCounter = 0;
                    line.classList.add('space-Line');
                    line.innerHTML = prismRows[i];
                    for (let z = 0, x = line.children.length; z < x; z++) {
                        if (line.children[z].textContent == ' ') {
                            spaceCounter++;
                            if (spaceCounter == 4) {
                                spaceCounter = 0;
                                line.children[z - 3].classList.add('indent-guide');
                            }
                        } else {
                            break;
                        }
                    }
                    $.parent.overlay.firstElementChild.appendChild(line);
                }
            } else {
                let delta = Math.min(visible, Math.abs($.lastStart - n));
                for (let i = 0, c = delta; i < c; i++) {
                    $.parent.gutter.lastElementChild.remove();
                }
                let fragment = document.createDocumentFragment();
                for (let i = n; i < n + delta; i++) {
                    let lineNumber = document.createElement('div'),
                        span = document.createElement('span');
                    let maxWhitespace = ($.maxCounter + '').length,
                        currentSpace = (i + 1 + '').length,
                        currentWhitespace = maxWhitespace - currentSpace;
                    span.textContent = ' '.repeat(currentWhitespace) + (i + 1);
                    lineNumber.appendChild(span);
                    fragment.appendChild(lineNumber);
                }
                $.parent.gutter.insertBefore(fragment, $.parent.gutter.firstElementChild);
                // Textarea Height & width
                let rows = $.parent.textarea.value.split('\n');
                $.parent.textarea.rows = rows.length + 1;
                $.parent.textarea.cols =
                    rows.map(x => x.length)
                        .reduce(function (a, b) {
                            return Math.max(a, b);
                        });
                // Overlay Highlighting
                let unEscapedValue =
                        $.parent.textarea.value
                            .replaceAll(/&amp;/g, '&')
                            .replaceAll(/&lt;/g, '<')
                            .replaceAll(/&gt;/g, '>'),
                    prismRows =
                        $.parent.prism
                            .highlight(unEscapedValue, $.parent.prism.languages.damon, 'damon')
                            .split('\n</span>')
                            .map((x) => x + '\n</span>'),
                    lastTextAreaRows = $.parent.lastTextareaValue.split('\n');
                for (let i = 0, c = delta; i < c; i++) {
                    $.parent.overlay.firstElementChild.lastElementChild.remove();
                }
                let overlayFragment = document.createDocumentFragment();
                for (let i = n; i < n + delta; i++) {
                    let line = document.createElement('span'),
                        spaceCounter = 0;
                    line.classList.add('space-Line');
                    line.innerHTML = prismRows[i];
                    for (let z = 0, x = line.children.length; z < x; z++) {
                        if (line.children[z].textContent == ' ') {
                            spaceCounter++;
                            if (spaceCounter == 4) {
                                spaceCounter = 0;
                                line.children[z - 3].classList.add('indent-guide');
                            }
                        } else {
                            break;
                        }
                    }
                    overlayFragment.appendChild(line);
                }
                $.parent.overlay.firstElementChild
                    .insertBefore(overlayFragment, $.parent.overlay.firstElementChild.firstElementChild);
            }
            $.lastStart = n;
        }
    }

    // Adjust to max line number
    setGutterWidth() {
        let $ = this;
        let width = $.parent.gutter.children[0].children[0].getBoundingClientRect().width,
            gutterWidth = parseFloat(getComputedStyle($.parent.editor).getPropertyValue("--gutterWidth"));
        if (width > gutterWidth) {
            $.parent.gutter.style.width = width + 'px';
            $.parent.container.style.left = width + 'px';
        } else {
            $.parent.gutter.style.width = '';
            $.parent.container.style.left = '';
        }
    }
};