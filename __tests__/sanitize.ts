import { safe, bare_text, text } from '../src/sanitize';


describe('sanitize', () => {
    describe('bare_text', () => {
        it('should return same string', () => {
            const input = [
                'hello world',
                'lorem ipsum'
            ];
            input.forEach(input => {
                expect(bare_text(input)).toEqual(input);
            });
        });
        it('should convert html entities', () => {
            const specs = [
                ['hello &amp; world', 'hello & world'],
                ['&#60;body&#62;', '<body>']
            ];
            specs.forEach(([input, output]) => {
                expect(bare_text(input)).toEqual(output);
            });
        });
    });
    describe('safe', () => {
        it('should return same string', () => {
            const input = [
                'hello world',
                'lorem ipsum'
            ];
            input.forEach(input => {
                expect(safe(input)).toEqual(input);
            });
        });
        it('should escape special html characters', () => {
            const input = [
                ['<body>', '&lt;body&gt;'],
                ['this & that', 'this &amp; that']
            ];
            input.forEach(([input, output]) => {
                expect(safe(input)).toEqual(output);
            });
        });
    });
    describe('text', () => {
        it('should return same string', () => {
            const input = [
                'hello world',
                'lorem ipsum'
            ];
            input.forEach(input => {
                expect(text(input)).toEqual(input);
            });
        });
        it('should remove terminal formatting', () => {
            const input = [
                ['this [[;;]hello]', 'this hello'],
                ['foo [[b;red;]bar]', 'foo bar']
            ];
            input.forEach(([input, output]) => {
                expect(text(input)).toEqual(output);
            });
        });
        it('should convert HTML entites', () => {
            const specs = [
                ['hello &amp; [[;;]world]', 'hello & world'],
                ['&#60;body&#62;[[;red;]spray]', '<body>spray']
            ];
            specs.forEach(([input, output]) => {
                expect(text(input)).toEqual(output);
            });
        });
        it('should keep escape brackets', () => {
            const specs = [
                ['hello &amp; [[;;]this \\] is]', 'hello & this ] is'],
                ['&#60;body&#62;[[;red;]spray \\[ ]', '<body>spray [ ']
            ];
            specs.forEach(([input, output]) => {
                expect(text(input)).toEqual(output);
            });
        });
    });
});
