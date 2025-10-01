export class Version {
    constructor(public readonly value: string) {
        if (!value || value.trim() === '') {
            throw new Error('Version value cannot be empty');
        }
    }

    toString(): string {
        return this.value;
    }

    equals(other: Version): boolean {
        return this.value === other.value;
    }

    includes(substring: string): boolean {
        return this.value.includes(substring);
    }
}