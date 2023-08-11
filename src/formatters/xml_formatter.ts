import { type FormatterFunction } from './utils';

// this formatter allow to echo xml where tags are colors like:
// <red>hello <navy>blue</navy> world</red>
// it allso support special tags e.g. link, img or bold
type Attrs = {
    [key: string]: string;
};
type Tags = {[key: string]: (attrs: Attrs) => string};

const tags: Tags = {
    font(attrs) {
        const styles = [];
        if ('size' in attrs) {
            styles.push('--size:' + attrs.size);
        }
        if ('spacing' in attrs) {
            styles.push('letter-spacing:' + attrs.spacing);
        }
        const background = attrs.background ?? '';
        const color = attrs.color ?? '';
        const style = styles.length ? '{"style": "' + styles.join(';') + '"}' : '';
        return '[[;' + color + ';' + background + ';;;' + style + ']';
    },
    img(attrs) {
        const alt = attrs.alt ?? '';
        const cls = attrs.class ?? '';
        return '[[@;;;' + cls + ';' + attrs.src + ']' + alt + ']';
    },
    bold() {
        return '[[b;rgba(255,255,255,0.9);]';
    },
    overline() {
        return '[[o;;]';
    },
    strike() {
        return '[[s;;]';
    },
    underline() {
        return '[[u;;]';
    },
    glow() {
        return '[[g;;]';
    },
    italic() {
        return '[[i;;]';
    },
    span(attrs) {
        const cls = attrs.class ?? '';
        return '[[;;;' + cls + ']';
    },
    link(attrs) {
        const cls = attrs.class ?? '';
        const href = attrs.href ?? '';
        return '[[!;;;' + cls + ';' + href + ';]';
    }
};
// short aliases
tags.b = tags.bold;
tags.a = tags.link;
tags.i = tags.italic;

const tag_re = /(<\/?\s*[a-zA-Z-]+(?: [^>]+)?>)/;
const attr_re = /([a-zA-Z-]+)\s*=\s*"([^"]+)"/g;
const full_tags_re = /^([a-zA-Z-]+)(?:\s*(.+))?/;

interface XMLFormatter extends FormatterFunction {
    tags: Tags;
}

const xml_formatter = <XMLFormatter>function(string) {
    return string.split(tag_re).map(function(string) {
        if (string.match(tag_re)) {
            if (string[1] === '/') {
                return ']';
            }
            string = string.replace(/^<|>$/g, '');
            const m = string.match(full_tags_re);
            if (m) {
                const name = m[1].toLowerCase();
                const attrs: Attrs = {};
                if (m[2]) {
                    const string_attrs = m[2];
                    [...string_attrs.matchAll(attr_re)].forEach(match => {
                        const attr_name = match[1];
                        const value = match[2];
                        attrs[attr_name] = value;
                    });
                }
                if (tags[name]) {
                    return tags[name](attrs);
                } else {
                    return '[[;' + name + ';]';
                }
            }
        }
        return string.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    }).join('');
};

xml_formatter.__no_warn__ = true;
xml_formatter.tags = tags;

export default xml_formatter;
