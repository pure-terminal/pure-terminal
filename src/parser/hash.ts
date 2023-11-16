import { is_array, is_hash_command, type Hash_Command} from '../guards';

export function parse_hash(hash: string): Array<Hash_Command> | never {
    let input;
    try {
        input = JSON.parse(hash);
    } catch (e) {
        throw new Error(`invalid hash ${hash}`);
    }
    if (!is_array(input)) {
        throw new Error(`invalid hash ${hash}`);
    }
    const valid = input.every(is_hash_command);
    if (!valid) {
        throw new Error(`invalid hash ${hash}`);
    }
    return input as Array<Hash_Command>;
}
