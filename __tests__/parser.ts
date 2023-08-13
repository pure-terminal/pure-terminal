import { split_arguments, parse_arguments } from '../src/parser/arguments';
import { parse_command, split_command } from '../src/parser/command';

describe('parsers', () => {
    const args = '"foo bar" baz /^asd [x]/ true false `foo bar` str\\ str 10 1e10 "" foo"bar" \'foo\'';
    const command = `test ${args}`;
    const split_args = [
        'foo bar',
        'baz',
        '/^asd [x]/',
        'true',
        'false',
        'foo bar',
        'str str',
        '10',
        '1e10',
        '',
        'foobar',
        'foo'
    ];
    const parse_args = [
        'foo bar',
        'baz',
        /^asd [x]/,
        true,
        false,
        'foo bar',
        'str str',
        10,
        1e10,
        '',
        'foobar',
        'foo'
    ];
    describe('split_arguments', function() {
        it('should return empty array', () => {
            expect(split_arguments('')).toEqual([]);
        });
        it('should create array of arguments', function() {
            expect(split_arguments(args)).toEqual(split_args);
        });
        it('should parser unclosed string', () => {
            expect(split_arguments('foo"bar"baz')).toEqual(['foobarbaz']);
        });
    });
    describe('parse_arguments', function() {
        it('should return empty array', () => {
            expect(parse_arguments('')).toEqual([]);
        });
        it('should create array of arguments and convert types', function() {
            expect(parse_arguments(args)).toEqual(parse_args);
        });
    });
    describe('split_command', () => {
        it('should split empty command', () => {
            expect(split_command('')).toEqual({
                command: '',
                name: '',
                args: [],
                args_quotes: [],
                rest: ''
            });
        });
        it('should split base command', () => {
            expect(split_command(command)).toEqual({
                command,
                name: 'test',
                args: split_args,
                rest: args,
                args_quotes: [
                    '"', '',  '', '', '',
                    '`', '',  '', '', '"',
                    '',  '\''
                ]
            });
        });
    });
    describe('parse_command', () => {
        it('should parse base command', () => {
            expect(parse_command(command)).toEqual({
                command,
                name: 'test',
                args: parse_args,
                rest: args,
                args_quotes: [
                    '"', '',  '', '', '',
                    '`', '',  '', '', '"',
                    '',  '\''
                ]
            });
        });
        it('should parse empty command', () => {
            expect(parse_command('')).toEqual({
                command: '',
                name: '',
                args: [],
                args_quotes: [],
                rest: ''
            });
        });
    });
});
