import $ from 'cash-dom';
import wcwidth from 'wcwidth';

// TODO: missing items
// * warn function

import { bare_text } from './sanitize';
import { email_re, format_parts_re } from './const';
import { valid_color } from './color';
import { format_split, is_formatting, length, split_characters } from './formatters/utils';
import { is_ch_unit_supported, is_css_variables_supported } from './supports';
import { warn } from './debug';

type CharWidthOptionT = {
    charWidth: number;
};

type FormatOptionT = {
    linksNoReferrer?: boolean;
    linksNoFollow?: boolean;
    allowedAttributes?: AllowedAttrArrayT;
    charWidth?: number;
    escape?: boolean;
    anyLinks?: boolean;
};

type AllowedAttrT = string | RegExp;
type AllowedAttrArrayT = Array<AllowedAttrT>;

type StringObjectT = {
    [key: string]: string;
}

type CharSpecT = {
    len: number;
    chr: string;
}

type WideCharactersT = {
    sum: number;
    len: number;
    specs: Array<CharSpecT>;
}

function safe(string: string) {
    if (!string.match(/[<>&]/)) {
        return string;
    }
    return string.replace(/&(?![^;]+;)/g, '&amp;')
        .replace(/>/g, '&gt;').replace(/</g, '&lt;');
}

function clean_data(data: string, text?: string) {
    if (data === '') {
        return text || '';
    } else {
        return data.replace(/&#93;/g, ']')
            .replace(/>/g, '&gt;')
            .replace(/</g, '&lt;')
            .replace(/"/g, '&quot;');
    }
}

function escape_html_attr(value: string) {
    return value.replace(/"/g, '&quot;');
}

function filter_attr_names(names: string[], allowed_tags: AllowedAttrArrayT): string[] {
    if (names.length && allowed_tags.length) {
        return names.filter(function(name) {
            if (name === 'data-text') {
                return false;
            }
            let allowed = false;
            const filters = allowed_tags;
            for (let i = 0; i < filters.length; ++i) {
                if (filters[i] instanceof RegExp) {
                    if ((filters[i] as RegExp).test(name)) {
                        allowed = true;
                        break;
                    }
                } else if (filters[i] === name) {
                    allowed = true;
                    break;
                }
            }
            return allowed;
        });
    }
    return [];
}

function attrs_to_string(style: string, attrs: StringObjectT, allowed_attrs: Array<AllowedAttrT>) {
    if (attrs) {
        const keys = filter_attr_names(Object.keys(attrs), allowed_attrs);
        if (keys.length) {
            return ' ' + keys.map(function(name: string) {
                let value = escape_html_attr(attrs[name]);
                if (name === 'style') {
                    // merge style attr and colors #617
                    value = value ? style + ';' + value : style;
                }
                if (!value) {
                    return name;
                }
                return name + '="' + value + '"';
            }).join(' ');
        }
    }
    if (!style) {
        return '';
    }
    return ' style="' + style + '"';
}

function is_path(url: string) {
    return url.match(/^\.{1,2}\//) ||
        url.match(/^\//) ||
        !(url.match(/\//) || url.match(/^[^:]+:/));
}

const strlen = (function() {
    if (typeof wcwidth === 'undefined') {
        return function(string: string) {
            // fix empty prompt that use 0 width space
            string = string.replace(/\u200B/g, '');
            return length(string);
        };
    } else {
        return wcwidth;
    }
})();

function style_to_string(styles: StringObjectT) {
    return Object.keys(styles).map(function(prop) {
        return prop + ':' + styles[prop];
    }).join(';');
}

function char_width_prop(len: number, options?: CharWidthOptionT) {
    return style_to_string(char_width_object(len, options));
}

function char_width_object(len: number, options?: CharWidthOptionT) {
    const result: StringObjectT = {};
    if (len === 0) {
        result['width'] = '1px';
    } else if (is_ch_unit_supported) {
        result['width'] = len + 'ch';
    } else if (!is_css_variables_supported) {
        if (options?.charWidth) {
            result['width'] = (options.charWidth * len) + 'px';
        }
    } else {
        result['--length'] = len.toString();
    }
    return result;
}

function extra_css(text: string, options: CharWidthOptionT) {
    if (typeof wcwidth !== 'undefined') {
        const bare = bare_text(text);
        const len = strlen(bare);
        if (len > 1 && len !== length(bare)) {
            return char_width_object(len, options);
        }
    }
}

function wide_characters(text: string, options: CharWidthOptionT) {
    if (typeof wcwidth !== 'undefined') {
        const bare = bare_text(text);
        const chars = split_characters(bare);
        if (chars.length === 1) {
            return text;
        }
        const specs = chars.map(function(chr: string) {
            return {
                len: strlen(chr),
                chr: chr
            };
        }).reduce(function(arr: Array<WideCharactersT>, spec: CharSpecT) {
            const last = arr[arr.length - 1];
            if (last) {
                if (last.len !== spec.len) {
                    return arr.concat([{
                        sum: spec.len,
                        len: spec.len,
                        specs: [spec]
                    }]);
                } else {
                    arr.pop();
                    return arr.concat([{
                        sum: last.sum + spec.len,
                        len: last.len,
                        specs: last.specs.concat(spec)
                    }]);
                }
            }
            return [{
                sum: spec.len,
                specs: [spec],
                len: spec.len
            }];
        }, []);
        return specs.map(function(spec: WideCharactersT) {
            if (spec.len === 1) {
                return make_string(spec);
            }
            const style = char_width_prop(spec.sum, options);
            if (spec.sum === chars.length || !style.length) {
                return '<span>' + make_string(spec) + '</span>';
            } else if (spec.specs.length > 1) {
                return wrap(style, spec.specs.map(function(spec) {
                    return wrap(char_width_prop(spec.len), spec.chr);
                }).join(''));
            } else {
                return wrap(style, make_string(spec));
            }
        }).join('');
    }
    function make_string(spec: WideCharactersT) {
        return spec.specs.map(function(spec: CharSpecT) {
            return spec.chr;
        }).join('');
    }
    function wrap(style: string, str: string) {
        return '<span style="' + style + '">' + str + '</span>';
    }
    return text;
}

export function format(str: string, options: FormatOptionT) {
    const settings = $.extend({}, {
        linksNoReferrer: false,
        linksNoFollow: false,
        allowedAttributes: [],
        charWidth: undefined,
        escape: true,
        anyLinks: false
    }, options || {});

    function rel_attr() {
        const rel = ['noopener'];
        if (settings.linksNoReferrer) {
            rel.unshift('noreferrer');
        }
        if (settings.linksNoFollow) {
            rel.unshift('nofollow');
        }
        return rel;
    }

    // -----------------------------------------------------------------
    function with_url_validation(fn: (arg: string) => boolean) {
        return function(url: string) {
            if (settings.anyLinks) {
                return true;
            }
            const test = fn(url);
            if (!test) {
                warn('Invalid URL ' + url + ' only http(s) ftp and Path ' +
                     'are allowed');
            }
            return test;
        };
    }
    // -----------------------------------------------------------------
    const valid_href = with_url_validation(function(url) {
        return !!(url.match(/^((https?|file|ftp):\/\/|\.{0,2}\/)/) || is_path(url));
    });
    // -----------------------------------------------------------------
    const valid_src = with_url_validation(function(url) {
        return !!(url.match(/^(https?:|file:|blob:|data:)/) || is_path(url));
    });
    // -----------------------------------------------------------------
    function format(s: string, style: string, color: string, background: string, _class: string, data_text: string, text: string) {
        function pre_process_link(data: string) {
            let result;
            if (data.match(email_re)) {
                result = '<a href="mailto:' + data + '"';
            } else {
                // only http and ftp links (prevent javascript)
                // unless user force it with anyLinks option
                if (!valid_href(data)) {
                    data = '';
                }
                result = '<a target="_blank"';
                if (data) {
                    result += ' href="' + data + '"';
                }
                result += ' rel="' + rel_attr().join(' ') + '"';
            }
            return result;
        }
        function pre_process_image(data: string) {
            let result = '<img';
            if (valid_src(data)) {
                result += ' src="' + data + '"';
                if (text) {
                    result += ' alt="' + text + '"';
                }
            }
            return result;
        }
        let attrs;
        if (data_text.match(/;/)) {
            try {
                const splitted = data_text.split(';');
                const str = splitted.slice(1).join(';')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>');
                if (str.match(/^\s*\{[^}]*\}\s*$/)) {
                    attrs = JSON.parse(str);
                    data_text = splitted[0];
                }
            } catch (e) {
                // ignore
            }
        }
        if (text === '' && !style.match(/@/)) {
            return ''; //'<span>&nbsp;</span>';
        }
        text = safe(text);
        text = text.replace(/\\\]/g, '&#93;');
        if (settings.escape) {
            // inside formatting we need to unescape escaped slashes
            // but this escape is not needed when echo - don't know why
            text = text.replace(/\\\\/g, '\\');
        }
        const styles: StringObjectT = {};
        if (style.indexOf('b') !== -1) {
            styles['font-weight'] = 'bold';
        }
        const text_decoration = [];
        if (style.indexOf('u') !== -1) {
            text_decoration.push('underline');
        }
        if (style.indexOf('s') !== -1) {
            text_decoration.push('line-through');
        }
        if (style.indexOf('o') !== -1) {
            text_decoration.push('overline');
        }
        if (text_decoration.length) {
            styles['text-decoration'] = text_decoration.join(' ');
        }
        if (style.indexOf('i') !== -1) {
            styles['font-style'] = 'italic';
        }
        if (valid_color(color)) {
            $.extend(styles, {
                'color': color,
                '--color': color,
                '--original-color': color
            });
            if (style.indexOf('!') !== -1) {
                styles['--link-color'] = color;
            }
            if (style.indexOf('g') !== -1) {
                styles['text-shadow'] = '0 0 5px ' + color;
            }
        }
        if (valid_color(background)) {
            $.extend(styles, {
                'background-color': background,
                '--background': background
            });
        }
        const data = clean_data(data_text, text);
        const extra = extra_css(text, settings);
        if (extra) {
            text = wide_characters(text, settings);
            $.extend(styles, extra);
        }
        let result;
        if (style.indexOf('!') !== -1) {
            result = pre_process_link(data);
        } else if (style.indexOf('@') !== -1) {
            result = pre_process_image(data);
        } else {
            result = '<span';
        }
        const style_str = style_to_string(styles);
        result += attrs_to_string(style_str, attrs, settings.allowedAttributes);
        if (_class !== '') {
            result += ' class="' + _class + '"';
        }
        // links and image need data-text attribute cmd click behavior
        // formatter can return links.
        if (style.indexOf('!') !== -1) {
            result += ' data-text>' + text + '</a>';
        } else if (style.indexOf('@') !== -1) {
            result += ' data-text/>';
        } else {
            result += ' data-text="' + data + '">' +
                '<span>' + text + '</span></span>';
        }
        return result;
    }
    if (typeof str === 'string') {
        // support for formating foo[[u;;]bar]baz[[b;#fff;]quux]zzz
        const splitted = format_split(str);
        str = splitted.map(function(text: string) {
            if (text === '') {
                return text;
            } else if (is_formatting(text)) {
                // fix &nbsp; inside formatting because encode is called
                // before format
                text = text.replace(/\[\[[^\]]+\]/, function(text) {
                    return text.replace(/&nbsp;/g, ' ');
                });
                return text.replace(format_parts_re, format);
            } else {
                text = safe(text);
                text = text.replace(/\\\]/, '&#93;');
                const data = clean_data(text);
                const extra = extra_css(text, settings);
                let prefix;
                if (extra) {
                    text = wide_characters(text, settings);
                    prefix = '<span style="' + style_to_string(extra) + '"';
                } else {
                    prefix = '<span';
                }
                return prefix + ' data-text="' + data + '">' + text + '</span>';
            }
        }).join('');
        return str.replace(/<span><br\s*\/?><\/span>/gi, '<br/>');
    } else {
        return '';
    }
}
