import nested_formatter from '../src/formatters/nested_formatter';
import xml_formatter from '../src/formatters/xml_formatter';
import { length } from '../src/formatters/utils';
import { type FormatterFunction } from '../src/formatters/utils';
import { warn } from '../src/debug';

jest.mock('../src/debug', () => ({
    warn: jest.fn()
}));

function is_boolean(value?: boolean): value is boolean {
    return typeof value === 'boolean';
}

function make_test_specs(fn: FormatterFunction) {
    return function(specs: Array<[string, string, boolean?]>) {
        specs.forEach(function(spec) {
            if (is_boolean(spec[2])) {
                fn.__inherit__ = spec[2];
            }
            expect(fn(spec[0])).toEqual(spec[1]);
        });
    };
}

describe('nested_formatter', () => {
    const test_specs = make_test_specs(nested_formatter);
    afterEach(function() {
        nested_formatter.__inherit__ = false;
    });
    it('should return same string', () => {
        const input = [
            'lorem ispum',
            'dolor sit amet'
        ];
        input.forEach(str => {
            expect(nested_formatter(str)).toEqual(str);
        });
    });
    it('should self close the formatting', () => {
        test_specs([
            ['[[b;;]foo [[;red;]bar] baz', '[[b;;]foo ][[;red;]bar][[b;;] baz]']
        ]);
    });
    it('should create list of formatting', function() {
        test_specs([
            [
                '[[;red;]foo[[;blue;]bar]baz]',
                '[[;red;]foo][[;blue;]bar][[;red;]baz]',
                true
            ],
            [
                '[[;#fff;] lorem [[b;;]ipsum [[s;;]dolor] sit] amet]',
                '[[;#fff;] lorem ][[b;;]ipsum ][[s;;]dolor][[b;;] sit][[;#fff;] amet]',
                false
            ],
            [
                '[[;#fff;] lorem [[b;;]ipsum [[s;;]dolor] sit] amet]',
                '[[;#fff;] lorem ][[b;#fff;]ipsum ][[sb;#fff;]dolor][[b;#fff;] sit][[;#fff;] amet]',
                true
            ],
            [
                '[[b;#fff;]hello [[u-b;;] world] from js]',
                '[[b;#fff;]hello ][[u;#fff;] world][[b;#fff;] from js]',
                true
            ]
        ]);
    });
    it('should inherit classes', () => {
        test_specs([
            [
                '[[;;;foo]this [[;;;foo bar]is] text]',
                '[[;;;foo]this ][[;;;foo bar]is][[;;;foo] text]',
                true
            ]
        ]);
    });
    it('should inherit attributes', () => {
        test_specs([
            [
                '[[;;;;;{"id": "hello"}]foo [[;red;]bar] baz]',
                '[[;;;;;{"id":"hello"}]foo ][[;red;;;;{"id":"hello"}]bar][[;;;;;{"id":"hello"}] baz]',
                true
            ]
        ]);
    });
    it('should inherit styles', () => {
        test_specs([
            [
                '[[b;;;;;{"style": "color: blue"}]foo [[;red;]bar] baz]',
                '[[b;;;;;{"style":"color:blue"}]foo ][[b;red;;;;{"style":"color:blue"}]bar][[b;;;;;{"style":"color:blue"}] baz]',
                true
            ],
            [
                '[[b;;;;;{"style": "background: red"}]foo [[;red;;;;{"style": "color: green"}]bar] baz]',
                '[[b;;;;;{"style":"background:red"}]foo ][[b;red;;;;{"style":"color:green;background:red"}]bar][[b;;;;;{"style":"background:red"}] baz]',
                true
            ]
        ]);
    });
    it('should warn about invalid JSON (top level)', () => {
        test_specs([
            [
                '[[b;;;;;{"style": background: red"}]foo [[;red;;;;{"style": "color: green"}]bar] baz]',
                '[[b;;;;;{}]foo ][[b;red;;;;{"style":"color:green"}]bar][[b;;;;;{}] baz]',
                true
            ]
        ]);
        expect(warn).toBeCalled();
    });
    it('should warn about invalid JSON (nested)', () => {
        test_specs([
            [
                '[[b;;;;;{"style": "background: red"}]foo [[;red;;;;{"style": color: green"}]bar] baz]',
                '[[b;;;;;{"style":"background:red"}]foo ][[b;red;;;;{"style":"background:red"}]bar][[b;;;;;{"style":"background:red"}] baz]',
                true
            ]
        ]);
        expect(warn).toBeCalled();
    });
});


describe('xml_formatter', () => {
    const test_specs = make_test_specs(xml_formatter);
    it('should transform bascic tags', () => {
        test_specs([
            ['<strike>lorem</strike>', '[[s;;]lorem]'],
            ['<bold>ipsum</bold>', '[[b;rgba(255,255,255,0.9);]ipsum]'],
            ['<overline>dolor</overline>', '[[o;;]dolor]'],
            ['<underline>sit</underline>', '[[u;;]sit]'],
            ['<glow>amet</glow>', '[[g;;]amet]'],
            ['<italic>consectetur</italic>', '[[i;;]consectetur]']
        ]);
    });
    it('should process nested tags', () => {
        test_specs([
            ['<strike>this<glow>is</glow>text</strike>', '[[s;;]this[[g;;]is]text]'],
            ['<strike>this<glow>is<italic>italic</italic></glow>text</strike>', '[[s;;]this[[g;;]is[[i;;]italic]]text]'],
            ['<strike>this <glow>is <italic>italic</italic></glow> text</strike>', '[[s;;]this [[g;;]is [[i;;]italic]] text]']
        ]);
    });
    it('should process tags with attributes', () => {
        test_specs([
            ['<font size="10">foo</font>', '[[;;;;;{"style": "--size:10"}]foo]'],
            ['<font size="10" spacing="2">baz</font>', '[[;;;;;{"style": "--size:10;letter-spacing:2"}]baz]'],
            ['<font size="10" color="red">baz</font>', '[[;red;;;;{"style": "--size:10"}]baz]'],
            ['<font size="10" color="red" background="blue">baz</font>', '[[;red;blue;;;{"style": "--size:10"}]baz]'],
            ['<span class="foo">quux</span>', '[[;;;foo]quux]']
        ]);
    });
    it('should process links', () => {
        test_specs([
            ['<link href="https://example.com">foo</link>', '[[!;;;;https://example.com;]foo]'],
            ['<link class="foo">foo</link>', '[[!;;;foo;;]foo]'],
            ['<link class="foo" href="https://example.com">foo</link>', '[[!;;;foo;https://example.com;]foo]']
        ]);
    });
    it('should process self closing tags', () => {
        test_specs([
            ['<img src="foo.png"/>', '[[@;;;;foo.png]]'],
            ['<img src="foo.png" alt="foo"/>', '[[@;;;;foo.png]foo]'],
            ['<img src="foo.png" class="foo-bar"/>', '[[@;;;foo-bar;foo.png]]'],
            ['<img src="foo.png" class="foo-bar" alt="foo"/>', '[[@;;;foo-bar;foo.png]foo]']
        ]);
    });
    it('should process colors', () => {
        test_specs([
            ['<red>foo</red>', '[[;red;]foo]'],
            ['<green>bar</green>', '[[;green;]bar]'],
            ['<green>this <red>is</red> text</green>', '[[;green;]this [[;red;]is] text]'],
        ]);
    });
    it('should process new tags', () => {
        xml_formatter.tags['bold-red'] = () => '[[b;red;]';
        xml_formatter.tags.color = (attrs) => `[[;${attrs.value ?? ''};]`;
        test_specs([
            ['<bold-red>foo</bold-red>', '[[b;red;]foo]'],
            ['<color>bar</color>', '[[;;]bar]'],
            ['<color value="red">bar</color>', '[[;red;]bar]']
        ]);
    });
});

describe('utils', () => {
    describe('length', () => {
        it('should return 0 for empty string', () => {
            expect(length('')).toEqual(0);
        });
        it('should count formatting as text', () => {
            expect(length('[[;;]foo]', true)).toEqual(9);
        });
        it('should ignore formatting', () => {
            expect(length('[[;;]foo]')).toEqual(3);
        });
        it('should count emoji', () => {
            const specs = [
                ['8️⃣8️⃣', 2],
                ['☺️☺️☺️', 3],
                ['💩💩💩', 3],
                ['🎮🎮🎮', 3],
                ['𝓗𝓗𝓗', 3]
            ] as const;
            specs.forEach(([str, count]) => {
                expect(length(str)).toEqual(count);
            });
        });
    });
});
