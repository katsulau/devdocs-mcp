export class ValidatedLanguageVersionInput {
    private constructor(
        public readonly language: string,
        public readonly version?: string
    ) {
    }

    static create(
        language: string,  version?: string
    ): ValidatedLanguageVersionInput {
        const cleanLanguage = (language || '').trim().toLowerCase();

        if (version?.trim()) {
            return new ValidatedLanguageVersionInput(cleanLanguage,version.trim());
        }
        const patterns = [
            /\b(\d+(?:\.\d+)*)\b/,           // "Java 17", "Python 3.9"
            /~(\d+(?:\.\d+)*)/,              // "openjdk~21"
            /v(\d+(?:\.\d+)*)/i              // "Vue v3"
        ];

        for (const pattern of patterns) {
            const match = cleanLanguage.match(pattern);
            if (match) {
                const cleanLanguageWithoutVersion = cleanLanguage.replace(pattern, '').trim();
                return new ValidatedLanguageVersionInput(
                    cleanLanguageWithoutVersion,
                    match[1]
                );
            }
        }

        return new ValidatedLanguageVersionInput(cleanLanguage, undefined);
    }
}
