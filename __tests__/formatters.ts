import nested_formatter from '../src/formatters/nested_formatter';
import { warn } from '../src/debug';

jest.mock('../src/debug', () => ({
    warn: jest.fn()
}));

function test_specs(specs: Array<[string, string, boolean]>) {
    specs.forEach(function(spec) {
        nested_formatter.__inherit__ = spec[2];
        expect(nested_formatter(spec[0])).toEqual(spec[1]);
    });
}

describe('nested_formatter', () => {
    afterEach(function() {
        nested_formatter.__inherit__ = false;
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
    it('should inherit attributes', () => {
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
        ])
    });
});
