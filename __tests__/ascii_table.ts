import { strlen, ascii_table } from '../src/ascii_table';

describe('strlen', () => {
    it('should get length of the normal string', () => {
        const specs = [
            'lorem',
            'ipsum',
            'dolor',
            'sit amet'
        ];
        specs.forEach(str => {
            expect(strlen(str)).toEqual(str.length);
        });
    });
    it('should return len of text with japanese characters', () => {
        const specs = [
            'ハッカー',
            '端末',
            'プログラミング'
        ];
        specs.forEach(str => {
            expect(strlen(str)).toEqual(str.length * 2);
        });
    });
    it('should skip formatting', () => {
        const specs = [
            ['[[;red;]lorem]', 5],
            ['[[;;background;]ipsum]', 5]
        ] as const;
        specs.forEach(([str, count]) => {
            expect(strlen(str)).toEqual(count);
        });
    });
});

describe('ascii_table', () => {
    it('should return empty string for empty array', () => {
        expect(ascii_table([])).toEqual('');
    });
    it('should format basic table', () => {
        const output = ascii_table([
            ['hello', 'World', 'This', 'Is Sparta'],
            ['helloworld', 'this is sparta', 'this', 'world']
        ]);
        expect(output).toMatchSnapshot();
    });
    it('should render different data types', () => {
        const output = ascii_table([
            [10000000000, 200000000, 'hello'],
            [true, false, /foo bar/],
            ['this', 'is', 'it']
        ]);
        expect(output).toMatchSnapshot();
    });
    it('should format mixed content', () => {
        const output = ascii_table([
            ['hello', 'This', 'Is', 'プログラミング'],
            ['lorem ipsum', 'dolor', 'sit\n\namet', 'hello'],
            ['hello\tworld', 'this is sparta', 'this', 'world']
        ]);
        expect(output).toMatchSnapshot();
    });
    it('should render header', () => {
        const output = ascii_table([
            ['hello', 'This', 'Is', 'プログラミング'],
            ['lorem ipsum', 'dolor', 'sit\n\namet', 'hello'],
            ['hello\tworld', 'this is sparta', 'this', 'world']
        ], true);
        expect(output).toMatchSnapshot();
    });
    it('should render empty cells', () => {
        const output = ascii_table([
            ['hello', 'This', 'Is', 'プログラミング'],
            ['lorem ipsum', '', 'sit\n\namet', 'hello'],
            ['hello\tworld', 'this is sparta', '', '']
        ], true);
        expect(output).toMatchSnapshot();
    });
});
