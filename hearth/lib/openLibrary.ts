export interface OpenLibraryBook {
    key: string;
    title: string;
    author_name?: string[];
    cover_i?: number;
    isbn?: string[];
    number_of_pages_median?: number;
    first_publish_year?: number;
}

const BASE_URL = 'https://openlibrary.org';

export const searchBooks = async (query: string): Promise<OpenLibraryBook[]> => {
    if (!query) return [];
    try {
        // Search specific fields to be more accurate
        const response = await fetch(`${BASE_URL}/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,cover_i,isbn,number_of_pages_median,first_publish_year`);
        const data = await response.json();
        return data.docs || [];
    } catch (error) {
        console.error("OpenLibrary Search Error:", error);
        return [];
    }
};

export const getCoverUrl = (coverId?: number, size: 'S' | 'M' | 'L' = 'M') => {
    if (!coverId) return null; // Or a placeholder URL
    return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
};
