import {DocumentLanguage} from "../types";
import {Slug} from "../values/Slug.js";
import {SearchHits} from "../SearchHits";

/**
 * Repository interface for DevDocs data access
 */
export interface DevDocsRepository {
    /**
     * Fetch available languages from DevDocs API
     */
    fetchAvailableLanguages(): Promise<DocumentLanguage[]>;

    /**
     * Search documentation by slug
     */
    searchDocumentationBySlug(slug: Slug): Promise<SearchHits>;
}