import wcwidth from 'wcwidth';
import { strip } from './formatters/utils';

type Field = string | number | boolean | RegExp;
type Table = Array<Array<Field>>;
type StringTable = Array<Array<string>>;

export function strlen(str: string) {
    return wcwidth(strip(str));
}

function format_argument(arg: Field): string {
    return expand_tabs(arg.toString().replace(/\r/g, ''));
}

function adjust_table(array: Table): StringTable {
    array = [...array];
    // adjustment for newlines based on cviejo
    // ref: https://stackoverflow.com/a/35115703/387194
    for (let i = array.length - 1; i >= 0; i--) {
        const row = array[i];
        const stacks: StringTable = [];
        for (let j = 0; j < row.length; j++) {
            const new_lines = format_argument(row[j]).split('\n');
            // new_line have at least one element that is always a string
            row[j] = new_lines.shift() as string;
            stacks.push(new_lines);
        }
        const stack_lengths = stacks.map(function(column) {
            return column.length;
        });
        const new_rows_count = Math.max.apply(Math, stack_lengths);
        for (let k = new_rows_count - 1; k >= 0; k--) {
            array.splice(i + 1, 0, stacks.map(column => column[k] ?? ''));
        }
    }
    return array as StringTable;
}

function calculate_lengths(array: StringTable) {
    return array[0].map(function(_, i) {
        var col = array.map(function(row) {
            return strlen(row[i]);
        });
        return Math.max.apply(Math, col);
    });
}

function column_padding(lengths: Array<number>, row: Array<string>) {
    return row.map(function(item, i) {
        const size = strlen(item);
        if (size < lengths[i]) {
            item += ' '.repeat(lengths[i] - size);
        }
        return item;
    });
}

function expand_tabs(str: string) {
    return str.replace(/\t/g, ' '.repeat(4));
}

function escape(str: string) {
    return str.replace(/&(?![^;]+;)/g, '&amp;');
}

export function ascii_table(array: Table, header: boolean = false) {
    if (!array.length) {
        return '';
    }
    const adjusted_array = adjust_table(array);
    const lengths = calculate_lengths(adjusted_array);
    const lines = adjusted_array.map(function(row) {
        const line = column_padding(lengths, row).join(' | ');
        return '| ' + escape(line) + ' |';
    });
    var sep = '+' + lengths.map(len => '-'.repeat(len + 2)).join('+') + '+';
    if (header) {
        return sep + '\n' + lines[0] + '\n' + sep + '\n' +
            lines.slice(1).join('\n') + '\n' + sep;
    } else {
        return sep + '\n' + lines.join('\n') + '\n' + sep;
    }
}
