import nested_formatter from '../src/formatters/nested_formatter';


describe('nested_formatter', () => {
    const specs = [
        [
            '[[;red;]foo[[;blue;]bar]baz]',
            '[[;red;]foo][[;blue;]bar][[;red;]baz]',
            true
        ] as const,
        [
            '[[;#fff;] lorem [[b;;]ipsum [[s;;]dolor] sit] amet]',
            '[[;#fff;] lorem ][[b;;]ipsum ][[s;;]dolor][[b;;] sit][[;#fff;] amet]',
            false
        ] as const,
        [
            '[[;#fff;] lorem [[b;;]ipsum [[s;;]dolor] sit] amet]',
            '[[;#fff;] lorem ][[b;#fff;]ipsum ][[sb;#fff;]dolor][[b;#fff;] sit][[;#fff;] amet]',
            true
        ]  as const,
        [
            '[[b;#fff;]hello [[u-b;;] world] from js]',
            '[[b;#fff;]hello ][[u;#fff;] world][[b;#fff;] from js]',
            true
        ]  as const
    ];
    afterEach(function() {
        nested_formatter.__inherit__ = false;
    });
    it('should create list of formatting', function() {
        specs.forEach(function(spec) {
            nested_formatter.__inherit__ = spec[2];
            expect(nested_formatter(spec[0])).toEqual(spec[1]);
        });
    });
});
