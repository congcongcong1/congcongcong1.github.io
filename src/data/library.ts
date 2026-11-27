import payload from './library-files.json';

export type LibraryKind = 'paper' | 'note' | 'slides' | 'code' | 'image' | 'data' | 'other';

export interface LibraryCollection {
  slug: string;
  title: string;
  english: string;
  description: string;
  count: number;
}

export interface LibraryDocument {
  id: string;
  collection: string;
  collectionTitle: string;
  title: string;
  fileName: string;
  extension: string;
  kind: LibraryKind;
  format: string;
  description: string;
  tags: string[];
  bytes: number;
  size: string;
  url: string;
  readerUrl?: string;
  action: string;
}

const data = payload as unknown as {
  generatedAt: string;
  collections: LibraryCollection[];
  documents: LibraryDocument[];
};

export const libraryGeneratedAt = data.generatedAt;
export const libraryCollections = data.collections;
export const libraryDocuments = data.documents;
export const getLibraryDocument = (id: string) => libraryDocuments.find((document) => document.id === id);
