import { split_arguments, parse_arguments } from '../src/parser/arguments';
import { parse_command, split_command } from '../src/parser/command';
import { parse_hash } from '../src/parser/hash';

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
    describe('hash', () => {
        it('should parse single command', () => {
            expect(parse_hash('[[0, 1, "ls"]]')).toEqual([[0, 1, "ls"]]);
        });
        it('should array of commands', () => {
            expect(parse_hash('[[0,1,"ls"],[0,2,"cat"],[0,3,"ls"]]')).toEqual([
                [0, 1, "ls"],
                [0, 2, "cat"],
                [0, 3, "ls"]
            ]);
        });
        it('should throw when calling with invalid JSON', () => {
            expect(() => parse_hash('["foo')).toThrow();
        });
        it('should throw an error when not an array', () => {
            expect(() => parse_hash('"foo"')).toThrow();
        });
        it('should throw an error when have invalid command', () => {
            const spec = [
                '[[0,1,"ls"],[0,2,2],[0,3,"ls"]]',
                '[[0,1,"ls"],[0,2],[0,3,"ls"]]',
                '[[0,1,"ls"],[0,2,"cat"],[0,3,"ls", "ls"]]',
                '[["x",1,"ls"],[0,2,"cat"],[0,3,"ls", "ls"]]',
                '["x",[0,2,"cat"],[0,3,"ls", "ls"]]'
            ];
            spec.forEach(input => {
                expect(() => parse_hash(input)).toThrow();
            });
        });
    });
});
