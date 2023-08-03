export const escape_regex = (str: string) => {
    const special = /([-\\^$[\]()+{}?*.|])/g;
    return str.replace(special, '\\$1');
};
