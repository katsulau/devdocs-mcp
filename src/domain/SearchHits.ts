import {Slug} from "./values/Slug.js";
import {Query} from "./values/Query.js";
import {Limit} from "./values/Limit.js";

export class SearchHits {
    readonly searchHits: SearchHit[];

    private constructor(searchHits: SearchHit[]) {
        this.searchHits = searchHits;
    }

    static create(searchHits: SearchHit[]): SearchHits {
        return new SearchHits(searchHits);
    }

    extract(query: Query, limit: Limit): SearchHits {
        const extracted =  this.searchHits.filter(searchHit => {
            const searchText = `${searchHit.title || ''} ${searchHit.path || ''}`.toLowerCase();
            return searchText.includes(query.toString().toLowerCase());
        }).slice(0, limit.toNumber())
        return new SearchHits(extracted);
    }
}

export interface SearchHit {
    title: string;
    url: string;
    path: string;
    type: string;
    slug: Slug;
}

