const warnings: Array<string> = [];

export function warn(msg: string) {
    msg = '[jQuery Terminal] ' + msg;
    if (warnings.indexOf(msg) === -1) {
        warnings.push(msg);
        /* eslint-disable */
        if (console) {
            if (console.warn) {
                console.warn(msg);
            } else if (console.log) {
                console.log(msg);
            }
            /* eslint-enable */
        } else {
            // prevent catching in outer try..catch
            setTimeout(function() {
                throw new Error('WARN: ' + msg);
            }, 0);
        }
    }
}
