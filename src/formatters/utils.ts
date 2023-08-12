import {
    format_split_re,
    format_exist_re,
    format_full_re,
    format_exec_re,
    format_parts_re,
    entity_re,
    emoji_re,
    combine_chr_re,
    astral_symbols_re
} from '../const';

import { text } from '../sanitize';

type MatchResultT = ReturnType<typeof String.prototype.match>;

export function format_split(str: string) {
    return str.split(format_split_re).filter(Boolean);
}

export function have_formatting(str: string) {
    return typeof str === 'string' && !!str.match(format_exist_re);
}

export function is_formatting(str: string) {
    return typeof str === 'string' && !!str.match(format_full_re);
}

export function is_extended_command(str: string) {
    return typeof str === 'string' &&
        str.match(format_exec_re) &&
        !is_formatting(str);
}

export function strip(str: string) {
    if (!have_formatting(str)) {
        return str;
    }
    return format_split(str).map(function(str) {
        if (is_formatting(str)) {
            str = str.replace(format_parts_re, '$6');
            return str.replace(/\\([[\]])/g, function(whole, bracket) {
                return bracket;
            });
        }
        return str;
    }).join('');
}

export function length(string: string, raw: boolean = false) {
    if (!string) {
        return 0;
    }
    return split_characters(raw ? string : text(string)).length;
}

export function split_characters(string: string) {
    const result = [];
    const get_next_character = make_next_char_fun(string);
    while (string.length) {
        const chr = get_next_character(string);
        string = string.slice(chr.length);
        result.push(chr);
    }
    return result;
}

export function make_re_fn(re: RegExp) {
    return function(string: string) {
        const m = string.match(re);
        if (starts_with(m)) {
            return m[1];
        }
    };
}

function starts_with(match: MatchResultT): match is NonNullable<MatchResultT> {
    return !!(match && match.index === 0);
}
// -------------------------------------------------------------------------
// :: optimized higher order function that it check complex regexes
// :: only when bigger string match those regexes, function is always
// :: used in loop when you process whole string, it's used to create local
// :: get_next_character function only cmd in input use original
// :: not optimized function
// -------------------------------------------------------------------------
function make_next_char_fun(string: string) {
    const tests: Array<(arg: string) => string | void> = [];
    [
        entity_re,
        emoji_re,
        combine_chr_re
    ].forEach(function(re) {
        if (string.match(re)) {
            tests.push(make_re_fn(re));
        }
    });
    if (string.match(astral_symbols_re)) {
        tests.push(function(string: string) {
            const m1 = string.match(astral_symbols_re);
            if (starts_with(m1)) {
                const m2 = string.match(combine_chr_re);
                if (m2 && m2.index === 1) {
                    return string.slice(0, 3);
                }
                return m1[1];
            }
        });
    }
    return function(string: string) {
        for (let i = 0; i < tests.length; ++i) {
            const test = tests[i];
            const ret = test(string);
            if (ret) {
                return ret;
            }
        }
        return string[0];
    };
}
// -------------------------------------------------------------------------
// :: function that return character from beginning of the string
// :: counting emoji, suroggate pairs and combine characters
// -------------------------------------------------------------------------
export function get_next_character(string: string) {
    const match_entity = string.match(entity_re);
    if (starts_with(match_entity)) {
        return match_entity[1];
    }
    const match_combo = string.match(combine_chr_re);
    if (starts_with(match_combo)) {
        return match_combo[1];
    }
    const match_emoji = string.match(emoji_re);
    if (starts_with(match_emoji)) {
        return match_emoji[1];
    } else if (string.charCodeAt(0) < 255) {
        return string[0];
    } else {
        const astral_match = string.match(astral_symbols_re);
        if (starts_with(astral_match)) {
            const match_combo = string.match(combine_chr_re);
            if (match_combo && match_combo.index === 1) {
                return string.slice(0, 3);
            }
            return string.slice(0, 2);
        } else {
            return string[0];
        }
    }
}

export function parse_formatting(string: string) {
    const formatting = unescape_brackets(string).split(';');
    const text_part = 4;
    if (formatting.length >= 5) {
        const escaped = escape_brackets(formatting[text_part]);
        formatting[text_part] = escaped;
    }
    return formatting;
}

export function unescape_brackets(string: string) {
    return string.replace(/&#91;/g, '[')
        .replace(/&#93;/g, ']')
        .replace(/&#92;/g, '\\');
}

export function escape_brackets(string: string) {
    return string.replace(/\[/g, '&#91;')
        .replace(/\]/g, '&#93;')
        .replace(/\\/g, '&#92;');
}

type FormatterFunctionOptions = {
    echo: boolean;
    animation: boolean;
    prompt: boolean;
    command: boolean;
    position: number;
};

export type FormatterRegExpFunction = (...args: string[]) => string;
type FormaterRegExpReplacement = string | FormatterRegExpFunction;

export interface FormatterFunction {
    (str: string, options?: FormatterFunctionOptions): (string | [string, number]);
    __inherit__: boolean;
    __no_warn__: boolean;
    __meta__: boolean;
}
type FormatterArrayOptions = {
    loop?: boolean;
    echo?: boolean;
    animation?: boolean;
    command?: boolean;
    prompt?: boolean;
};

export type Formatter = [RegExp, FormaterRegExpReplacement] | [RegExp, FormaterRegExpReplacement, FormatterArrayOptions] | FormatterFunction;
