import {DocumentLanguage, SearchHit} from "../types";
import {SearchSpecificDocsInput} from "../../mcp/types";

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
    searchDocumentationBySlug(input: SearchSpecificDocsInput): Promise<SearchHit[]>;
}