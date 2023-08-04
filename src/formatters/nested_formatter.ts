import {
    have_formatting,
    is_formatting,
    is_extended_command,
    parse_formatting,
    type FormatterFunction
} from './utils';

type EffectT = 'g' | 'b' | 'i' | 'u' | 's' | 'o';
type NotEffect = `-${EffectT}`;
type ItemT = '!' | '@';
type EffectsT = Array<EffectT | NotEffect | ItemT>;
type StackT = Array<string>;

function is_valid_effect(string: string): string is EffectT | NotEffect | ItemT {
    return !!string.match(/^[@!]|-?[gbiuso]$/);
}

// [style_effect, color, background, classes, full_text, attrs_json]
type FormatingT = [
    EffectsT,
    string,
    string,
    Array<string> | undefined,
    string | undefined,
    AttrsT | undefined
];

type StyleT = {[key: string]: string};
type AttrsT = {[key: string]: string} & {style?: StyleT};

const class_i = 3; // index of the class in formatting
const attrs_i = 5; // index of attributes in formattings

const re = /((?:\[\[(?:[^\][]|\\\])+\])?(?:[^\][]|\\\])*\]?)/;
const format_re = /\[\[([^\][]+)\][\s\S]*/;
const format_split_re = /^\[\[([^;]*);([^;]*);([^\]]*)\]/;

function parse_style(string: string) {
    const style: StyleT = {};
    string.split(/\s*;\s*/).forEach(function(string) {
        var parts = string.split(':').map(function(string) {
            return string.trim();
        });
        var prop = parts[0];
        var value = parts[1];
        style[prop] = value;
    });
    return style;
}

function update_style(style_string: string, old_style?: StyleT) {
    const new_style = parse_style(style_string);
    if (!old_style) {
        return new_style;
    }
    return {...old_style, ...new_style};
}

function unique(value: string, index: number, self: Array<string>) {
    return self.indexOf(value) === index;
}

function stringify_formatting(input: FormatingT) {
    var result = input.slice();
    if (input[attrs_i]) {
        result[attrs_i] = stringify_attrs(input[attrs_i]);
    }
    if (input[class_i]) {
        result[class_i] = stringify_class(input[class_i]);
    }
    result[0] = stringify_styles(input[0]);
    return result.join(';');
}

// ---------------------------------------------------------------------------
function stringify_styles(input: Array<string>) {
    var ignore = input.filter(function(s) {
        return s[0] === '-';
    }).map(function(s: string) {
        return s[1];
    });
    return input.filter(function(s) {
        return ignore.indexOf(s) === -1 && ignore.indexOf(s[1]) === -1;
    }).join('');
}
// ---------------------------------------------------------------------------
function stringify_attrs(attrs: AttrsT) {
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

function stringify_style(style: StyleT) {
    return Object.keys(style).map(function(prop) {
        return prop + ':' + style[prop];
    }).join(';');
}

function get_inherit_style(stack: StackT) {
    const output: FormatingT = [[], '', '', undefined, undefined, undefined];
    function update_attrs(value: string) {
        if (!output[attrs_i]) {
            output[attrs_i] = {};
        }
        try {
            var new_attrs = JSON.parse(value);
            if (new_attrs.style) {
                var new_style = new_attrs.style;
                var old_style = output[attrs_i].style;
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
            //warn('Invalid JSON ' + value);
        }
    }

    if (!stack.length) {
        return output;
    }
    for (var i = stack.length; i--;) {
        var formatting = parse_formatting(stack[i]);
        if (formatting.length > 5) {
            var last = formatting.slice(5).join(';');
            formatting = formatting.slice(0, 5).concat(last);
        }
        var style = formatting[0].split(/(-?[@!gbiuso])/g).filter(Boolean);
        style.forEach(function(s) {
            if (is_valid_effect(s) && output[0].indexOf(s) === -1) {
                output[0].push(s);
            }
        });
        for (var j = 1; j < formatting.length; ++j) {
            var value = formatting[j].trim();
            if (value) {
                if (j === class_i) {
                    if (!output[class_i]) {
                        output[class_i] = [];
                    }
                    var classes = value.split(/\s+/);
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
    const stack: StackT = [];

    return string.split(re).filter(Boolean).map(function(string) {
        var style;
        if (string.match(/^\[\[/) && !is_extended_command(string)) {
            var formatting = string.replace(format_re, '$1');
            string = string.replace(format_split_re, '');
            stack.push(formatting);
            if (nested_formatter.__inherit__) {
                style = get_inherit_style(stack);
            } else {
                style = formatting;
            }
            if (!is_formatting(string)) {
                string += ']';
            } else {
                stack.pop();
            }
            string = '[[' + style + ']' + string;
        } else {
            var pop = false;
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
}

export default nested_formatter;
