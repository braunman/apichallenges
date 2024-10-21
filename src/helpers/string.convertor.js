export const convertToBase64 = (inputString) => {
    if (typeof inputString !== 'string') {
        throw new Error('Input must be a string');
    }
    return Buffer.from(inputString).toString('base64');
}