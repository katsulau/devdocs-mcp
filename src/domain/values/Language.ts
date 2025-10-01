export class Language {
    constructor(public readonly value: string) {
        if (!value || value.trim() === '') {
            throw new Error('Language value cannot be empty');
        }
    }

    toString(): string {
        return this.value;
    }

    equals(other: Language): boolean {
        return this.value === other.value;
    }

    toLowerCase(): string {
        return this.value.toLowerCase();
    }
}