import { command_re, string_re, re_re, float_re } from '../const';

export type argument_parser = (arg: string, strict?: boolean) => number | boolean | RegExp | string;

export function parse_arguments(string: string) {
    const m = string.match(command_re) ?? [];
    return m.map(str => parse_argument(str));
}

export function split_arguments(string: string) {
    const m = string.match(command_re) ?? [];
    return m.map(arg => parse_argument(arg, false));
}

function parse_string(string: string) {
    // split string to string literals and non-strings
    return string.split(string_re).map(function(string: string) {
        // remove quotes if before are even number of slashes
        // we don't remove slases becuase they are handled by JSON.parse
        if (string.match(/^['"`]/)) {
            // fixing regex to match empty string is not worth it
            if (string === '""' || string === '\'\'' || string === '``') {
                return '';
            }
            const quote = string[0];
            const re = new RegExp('(\\\\\\\\(?:\\\\\\\\)*)' + quote, 'g');
            string = string.replace(re, '$1').replace(/^[`'"]|[`'"]$/g, '');
            if (quote === '\'') {
                string = string.replace(/"/g, '\\"');
            }
        }
        string = '"' + string + '"';
        // use build in function to parse rest of escaped characters
        return JSON.parse(string);
    }).join('');
}


function parse_with_types(arg: string) {
    if (arg === 'true') {
        return true;
    } else if (arg === 'false') {
        return false;
    }
    const regex = arg.match(re_re);
    if (regex) {
        return new RegExp(regex[1], regex[2]);
    } else if (arg.match(/['"`]/)) {
        return parse_string(arg);
    } else if (arg.match(/^-?[0-9]+$/)) {
        return parseInt(arg, 10);
    } else if (arg.match(float_re)) {
        return parseFloat(arg);
    } else {
        return arg.replace(/\\(['"() ])/g, '$1');
    }
}

function parse_simple(arg: string) {
    if (arg[0] === '\'' && arg[arg.length - 1] === '\'') {
        return arg.replace(/^'|'$/g, '');
    } else if (arg[0] === '`' && arg[arg.length - 1] === '`') {
        return arg.replace(/^`|`$/g, '');
    } else if (arg[0] === '"' && arg[arg.length - 1] === '"') {
        return arg.replace(/^"|"$/g, '').replace(/\\([" ])/g, '$1');
    } else if (arg.match(/\/.*\/[gimy]*$/)) {
        return arg;
    } else if (arg.match(/['"`]/)) {
        // part of arg is in quote
        return parse_string(arg);
    } else {
        return arg.replace(/\\ /g, ' ');
    }
}

export function parse_argument(arg: string, strict: boolean = true) {
    if (strict === false) {
        return parse_simple(arg);
    }
    return parse_with_types(arg);
}
