import version from './version';

const version_re = new RegExp(` {${version.length}}$`);

const copyrights = [
    'Copyright (c) 2023 Jakub T. Jankiewicz <https://jcu.bi>',
    '(c) 2023 Jakub T. Jankiewicz <https://jcu.bi>',
    '(c) 2023 Jakub T. Jankiewicz',
    '(c) 2023 jcubic'
].map(input => {
    const len = length(input);
    return [len, input];
});

const banners = [
    `
    _____                 ________                              __
   / _  /__  __ ___ _____/__  ___/__ ___ ______ __ __  __ ___  / /
  / // // / / // _// _  /  / // _  // _//     // //  \\/ // _ \\/ /
 / ___// /_/ // / / ___/  / // ___// / / / / // // /\\  // // / /__
/_/   /_____//_/ /____/  /_//____//_/ /_/ /_//_//_/ /_/ \\__\\_\\___/
                                                                 `,
    `
    _____                 ________
   / _  /__  __ ___ _____/__  ___/__ ___ ______
  / // // / / // _// _  /  / // _  // _//     /
 / ___// /_/ // / / ___/  / // ___// / / / / /
/_/   /_____//_/ /____/  /_//____//_/ /_/ /_/
                                            `,
    `
    _____
   / _  /__  __ ___ _____
  / // // / / // _// _  /
 / ___// /_/ // / / ___/
/_/   /_____//_/ /____/
 ________
/__  ___/__ ___ ______
  / // _  // _//     /
 / // ___// / / / / /
/_//____//_/ /_/ /_/
                   `,
    `
Pure Terminal
             `
].map(input => {
    const banner = compose(input);
    const len = length(banner);
    return [len, banner];
});

function compose(banner: string) {
    return banner.replace(/^\n/, '').replace(version_re, version);
}

function length(str: string) {
    const lines = str.split('\n');
    return Math.max(...lines.map((line: string) => line.length));
}

export const banner = (cols: number) => {
    const banner = banners.find(([len]) => {
        if (len <= cols) {
            return true;
        }
    });
    if (banner) {
        let [len, output] = banner;
        const copy = copyrights.find(([copy_len]) => {
            if (copy_len <= len) {
                return true;
            }
        });
        if (copy) {
            return [output, copy[1]].join('\n');
        }
        return output;
    }
    return '';
};
