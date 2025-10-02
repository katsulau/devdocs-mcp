import Fuse from "fuse.js";
import {DocumentLanguage} from "./types";
import {Language} from "./values/Language";

export interface FuzzySearchStrategy {
    search(languages: DocumentLanguage[], searchTerm: Language): DocumentLanguage[];
}

export class FuzeFuzzySearchStrategy implements FuzzySearchStrategy {
    search(languages: DocumentLanguage[], searchTerm: Language): DocumentLanguage[] {
        const fuse = new Fuse([...languages], {
            keys: [
                { name: 'name', weight: 0.4 },
                { name: 'type', weight: 0.3 },
                { name: 'alias', weight: 0.2 },
                { name: 'displayName', weight: 0.1 }
            ],
            threshold: 0.6, // Lower = more strict matching
            includeScore: true
        });

        const fuseResults = fuse.search(searchTerm.toString());
        return fuseResults.map(lang => lang.item);
    }

}
