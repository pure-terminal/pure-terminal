import { mobile_re, tablet_re } from './const';

const agent = (self.navigator || window.navigator).userAgent;
const is_IE = /MSIE|Trident/.test(agent) || /rv:11.0/i.test(agent);
const is_IEMobile = /IEMobile/.test(agent);

export const is_ch_unit_supported = (function() {
    if (is_IE && !is_IEMobile) {
        return false;
    }
    if (typeof document === 'undefined') {
        return true; // run without browser context
    }
    const div = document.createElement('div');
    div.style.width = '1ch';
    return div.style.width === '1ch';
})();

export const is_css_variables_supported = self.CSS && self.CSS.supports &&
    self.CSS.supports('--fake-var', '0');

export const is_android = navigator.userAgent.toLowerCase().indexOf('android') !== -1;


export const is_key_native = (function is_key_native() {
    if (!('KeyboardEvent' in self && 'key' in self.KeyboardEvent.prototype)) {
        return false;
    }
    const proto = self.KeyboardEvent.prototype;
    const get = Object.getOwnPropertyDescriptor(proto, 'key')?.get;
    return !!get?.toString().match(/\[native code\]/);
})();

export const is_browser = globalThis.window === globalThis;

export const is_mobile = (function(a) {
    let check = false;
    if (mobile_re.test(a) || tablet_re.test(a.substr(0, 4))) {
        check = true;
    }
    // detect iPad 13
    // ref: https://stackoverflow.com/a/57924983/387194s
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
        return true;
    }
    return check;
})(navigator.userAgent || navigator.vendor || (self as any).opera);
