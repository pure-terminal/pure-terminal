import {
    have_formatting,
    is_formatting,
    is_extended_command,
    parse_formatting,
    type FormatterFunction
} from './utils';
import { warn } from '../debug';

type Effect = 'g' | 'b' | 'i' | 'u' | 's' | 'o';
type NotEffect = `-${Effect}`;
type Item = '!' | '@';
type Effects = Array<Effect | NotEffect | Item>;
type Stack = Array<string>;

function is_valid_effect(string: string): string is Effect | NotEffect | Item {
    return !!string.match(/^[@!]|-?[gbiuso]$/);
}

// [style_effect, color, background, classes, full_text, attrs_json]
type Formating = [
    Effects,
    string,
    string,
    Array<string> | undefined,
    string | undefined,
    Attrs | undefined
];

type Style = {[key: string]: string};
type Attrs = {[key: string]: string} & {style?: Style};

const class_i = 3; // index of the class in formatting
const attrs_i = 5; // index of attributes in formattings

const re = /((?:\[\[(?:[^\][]|\\\])+\])?(?:[^\][]|\\\])*\]?)/;
const format_re = /\[\[([^\][]+)\][\s\S]*/;
const format_split_re = /^\[\[([^;]*);([^;]*);([^\]]*)\]/;

function parse_style(string: string) {
    const style: Style = {};
    string.split(/\s*;\s*/).forEach(function(string) {
        const parts = string.split(':').map(function(string) {
            return string.trim();
        });
        const prop = parts[0];
        const value = parts[1];
        style[prop] = value;
    });
    return style;
}

function update_style(style_string: string, old_style?: Style) {
    const new_style = parse_style(style_string);
    if (!old_style) {
        return new_style;
    }
    return {...old_style, ...new_style};
}

function unique(value: string, index: number, self: Array<string>) {
    return self.indexOf(value) === index;
}

function stringify_formatting(input: Formating) {
    const result = input.slice();
    if (input[attrs_i]) {
        result[attrs_i] = stringify_attrs(input[attrs_i]);
    }
    if (input[class_i]) {
        result[class_i] = stringify_class(input[class_i]);
    }
    result[0] = stringify_styles(input[0]);
    return result.filter(str => str !== undefined).join(';');
}

// ---------------------------------------------------------------------------
function stringify_styles(input: Array<string>) {
    const ignore = input.filter(function(s) {
        return s[0] === '-';
    }).map(function(s: string) {
        return s[1];
    });
    return input.filter(function(s) {
        return ignore.indexOf(s) === -1 && ignore.indexOf(s[1]) === -1;
    }).join('');
}
// ---------------------------------------------------------------------------
function stringify_attrs(attrs: Attrs) {
    return JSON.stringify(attrs, function(key, value) {
        if (key === 'style') {
            return stringify_style(value);
        }
        return value;
    });
}
// ---------------------------------------------------------------------------
function stringify_class(klass: Array<string>) {
    return klass.filter(unique).join(' ');
}

function stringify_style(style: Style) {
    return Object.keys(style).map(function(prop) {
        return prop + ':' + style[prop];
    }).join(';');
}

function get_inherit_style(stack: Stack) {
    const output: Formating = [[], '', '', undefined, undefined, undefined];
    function update_attrs(value: string) {
        if (!output[attrs_i]) {
            output[attrs_i] = {};
        }
        try {
            const new_attrs = JSON.parse(value);
            if (new_attrs.style) {
                const new_style = new_attrs.style;
                const old_style = output[attrs_i].style;
                output[attrs_i] = {
                    ...new_attrs,
                    ...output[attrs_i],
                    ...{
                        style: update_style(new_style, old_style)
                    }
                };
            } else {
                output[attrs_i] = {
                    ...new_attrs,
                    ...output[attrs_i]
                };
            }
        } catch (e) {
            warn('Invalid JSON ' + value);
        }
    }

    if (!stack.length) {
        return output;
    }
    for (let i = stack.length; i--;) {
        let formatting = parse_formatting(stack[i]);
        if (formatting.length > 5) {
            const last = formatting.slice(5).join(';');
            formatting = formatting.slice(0, 5).concat(last);
        }
        const style = formatting[0].split(/(-?[@!gbiuso])/g).filter(Boolean);
        style.forEach(function(s) {
            if (is_valid_effect(s) && output[0].indexOf(s) === -1) {
                output[0].push(s);
            }
        });
        for (let j = 1; j < formatting.length; ++j) {
            const value = formatting[j].trim();
            if (value) {
                if (j === class_i) {
                    if (!output[class_i]) {
                        output[class_i] = [];
                    }
                    const classes = value.split(/\s+/);
                    output[class_i] = output[class_i].concat(classes);
                } else if (j === attrs_i) {
                    update_attrs(value);
                } else if (!output[j]) {
                    output[j] = value;
                }
            }
        }
    }
    return stringify_formatting(output);
}

const nested_formatter = <FormatterFunction>function(string) {
    if (!have_formatting(string)) {
        return string;
    }
    const stack: Stack = [];

    return string.split(re).filter(Boolean).map(function(string) {
        let style;
        if (string.match(/^\[\[/) && !is_extended_command(string)) {
            const formatting = string.replace(format_re, '$1');
            const has_formatting = is_formatting(string);
            string = string.replace(format_split_re, '');
            stack.push(formatting);
            if (nested_formatter.__inherit__) {
                style = get_inherit_style(stack);
            } else {
                style = formatting;
            }
            if (!has_formatting) {
                string += ']';
            } else {
                stack.pop();
            }
            string = '[[' + style + ']' + string;
        } else {
            let pop = false;
            if (string.match(/\]/)) {
                pop = true;
            }
            if (stack.length) {
                if (nested_formatter.__inherit__) {
                    style = get_inherit_style(stack);
                } else {
                    style = stack[stack.length - 1];
                }
                string = '[[' + style + ']' + string;
            }
            if (pop) {
                stack.pop();
            } else if (stack.length) {
                string += ']';
            }
        }
        return string;
    }).join('');
};
// if set to false nested formatting will not process formatting, only text
// between formatting, we need this option because we're flattening the formatting
nested_formatter.__meta__ = true;
// if set to false nested formatting will not inherit styles colors and attribues
nested_formatter.__inherit__ = true;
// nested formatting will always return different length so we silent the warning
nested_formatter.__no_warn__ = true;

export default nested_formatter;
