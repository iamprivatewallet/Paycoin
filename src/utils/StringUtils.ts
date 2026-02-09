export function templateReplace(
    template: string,
    variables: Record<string, string | number>
): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
        return key in variables ? String(variables[key]) : `{${key}}`;
    });
}

export function isValidString(str: string | null | undefined): str is string {
    return str !== null && str !== undefined && str !== '';
}

export function cutNumberStr(numStr: string, digits=2): string {
    if (!numStr.includes('.')) return numStr

    const [intPart, decimalPart] = numStr.split('.')
    return decimalPart.length > digits
        ? `${intPart}.${decimalPart.slice(0, digits)}`
        : numStr
}