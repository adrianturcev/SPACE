exports = {
// For sanity's sake

// # NIL

// I like the NOT operator's conciseness when testing for null or undefined
// I like strict type checking
// So I made a strictly typed equivalent functions with:
// - 3-letters name
// - single argument

/**
 * neither null nor undefined
 *
 * @param { boolean } exp
 * @returns { boolean }
 */
nil(exp) { // values implicitly considered functions
    if (
        exp === null
        || typeof exp === 'undefined'
    ) {
        return true;
    } else {
        return false;
    }
},

// # Hack

// .slice() uses a closed-open interval
// the *sane* convention goes closed-closed

/**
 * Hack
 *
 * @param { number } start
 * @param { number } end
 * @returns
 */
hack(array, start, end) {
    return array.slice(start, end + 1);
},

// # Prune

// Javascript inherited spreadsheet-like .filter()
// It felt confusing there
// It feels confusing here too

/**
 * Prune
 *
 * @param {*} array
 * @param {*} pruningFunction
 * @returns
 */
pick(array, pruningFunction) {
    return array.filter(pruningFunction);
},
/**
 * The inverse of filter
 *
 * @param {*} array
 * @param {*} filteringFunction
 * @returns
 */
prune(array, filteringFunction) {
    return array.filter(function (x) {
        return !filteringFunction(x);
    });
},

// # Check

// .every() just sounds weird
/**
 * Check
 *
 * @param {*} array
 * @param {*} checkingFunction
 * @returns
 */
check(array, checkingFunction) {
    return array.every(checkingFunction);
},
/**
 *
 *
 * @param { string } string
 * @returns
 */
escape(string) {
    return string
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
},

/**
 * Template tag identity
 * triggers html syntax highlighting
 *
 * @param {*} strings
 * @returns
 */
html(strings) {
    let output = strings[0], // assumes empty string start?
        max = Math.max(strings.length, arguments.length - 1);
    for (let i = 1; i < strings.length; i++) {
        output += arguments[i];
        output += strings[i];
    }
    return output;
},

// # DATA-STATE

// Alternative CSS state management with data-attributes rather than classes
// - using data-attributes css selectors instead of classes in dynamic cases fits the MVC pattern better
//     - makes it easier to match model and vue in css and html
//     - using dataset instead of classlist allows to distinguish static .class from dynamic state
//     - classes essentialy work as booleans types like ".walked"
//         - you have to notice their abscence, amongst other potential use of .class
//     - data-state work as a string type you can dedicate to store state only, and more than one state

/**
 * Add
 *
 * @param { object } element
 * @param { string } state
 */
addDataState(element, state) {
    let stateArray = [];
    if (
        element.dataset.state
        && element.dataset.state.indexOf(' ') > -1
    ) {
        stateArray = element.dataset.state.split(' ');
    } else {
        stateArray = [element.dataset.state];
    }
    if (stateArray.indexOf(state) === -1) {
        stateArray.push(state);
        element.dataset.state = stateArray.join(' ');
    }
},

/**
 * Remove
 *
 * @param { object } element
 * @param { string } state
 */
removeDataState(element, state) {
    let stateArray = [];
    if (
        element.dataset.state
        && element.dataset.state.indexOf(' ') > -1
    ) {
        stateArray = element.dataset.state.split(' ');
    } else {
        stateArray = [element.dataset.state];
    }
    element.dataset.state =
        stateArray
            .filter(element => (element !== state))
            .join(' ');
},

/**
 * Replace
 *
 * @param { object } element
 * @param { string } stateToRemove
 * @param { string } stateToAdd
 */
replaceDataState(element, stateToRemove, stateToAdd) {
    this.removeDataState(element, stateToRemove);
    this.addDataState(element, stateToAdd);
},

/**
 * Toggle
 *
 * @param { object } element
 * @param { string } state
 */
toggleDataState(element, state) {
    let stateArray = element.dataset.state.split(' ');
    if (stateArray.indexOf(state) == -1) {
        this.addDataState(element, state);
    } else {
        this.removeDataState(element, state);
    }
}

};