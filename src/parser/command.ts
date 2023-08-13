import { command_re } from '../const';
import { parse_argument, type argument_parser } from './arguments';

function process_command(original: string, fn: argument_parser) {
    const string = original.trim();
    const array = string.match(command_re) ?? [];
    if (array.length) {
        // if array.length is non zero shift will always return a string
        const name = array.shift() as string;
        const args = array.map((arg: string) => {
            if (arg.match(/^["'`]/)) {
                arg = arg.replace(/\n/g, '\\u0000\\u0000\\u0000\\u0000');
                // if there is quote it will alawys be string
                const obj = fn(arg) as string;
                // eslint-disable-next-line no-control-regex
                return obj.replace(/\x00\x00\x00\x00/g, '\n');
            }
            return fn(arg);
        });
        const quotes = array.map((arg: string) => {
            const m = arg.match(/^(['"`]).*\1$/);
            return (m && m[1]) ?? '';
        });
        const rest = string.slice(name.length).trim();
        return {
            command: original,
            name: name,
            args: args,
            args_quotes: quotes,
            rest: rest
        } as const;
    } else {
        return {
            command: original,
            name: '',
            args: [],
            args_quotes: [],
            rest: ''
        } as const;
    }
}

export function parse_command(string: string) {
    return process_command(string, parse_argument);
}

export function split_command(string: string) {
    return process_command(string, function(arg) {
        return parse_argument(arg, false);
    });
}
