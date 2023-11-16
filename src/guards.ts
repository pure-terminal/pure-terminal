export function is_string(arg: unknown): arg is string {
    return typeof arg === 'string';
}

export function is_array(arg: unknown): arg is Array<unknown> {
    return Array.isArray(arg);
}

export function is_integer(arg: unknown): arg is number {
    return Number.isInteger(arg);
}

export type Hash_Command = [number, number, string];

export function is_hash_command(arg: unknown): arg is Hash_Command {
    if (!is_array(arg)) {
        return false;
    }
    if (arg.length !== 3) {
        return false;
    }
    if (!(is_integer(arg[0]) && is_integer(arg[1]))) {
        return false;
    }
    return is_string(arg[2]);
}
