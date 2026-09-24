import { getCollection } from 'astro:content';
import GithubSlugger from 'github-slugger';
import { toString } from 'mdast-util-to-string';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { projects } from '../data/projects';

export interface SiteSection {
  title: string;
  url: string;
  text: string;
}

export interface SiteEntry {
  id: string;
  kind: 'note' | 'shelf' | 'project';
  title: string;
  description: string;
  url: string;
  tags: string[];
  sections: SiteSection[];
}

function sectionsFromMarkdown(body: string, url: string, title: string): SiteSection[] {
  const tree = unified().use(remarkParse).parse(body);
  const slugger = new GithubSlugger();
  const sections: SiteSection[] = [];
  let heading = title;
  let href = url;
  let text = '';

  function flush() {
    const content = text.trim();
    if (!content) return;
    for (let start = 0; start < content.length; start += 1200) {
      sections.push({ title: heading, url: href, text: content.slice(start, start + 1200) });
    }
    text = '';
  }

  for (const node of tree.children) {
    if (node.type === 'heading') {
      flush();
      heading = toString(node);
      const slug = slugger.slug(heading);
      href = node.depth <= 3 ? `${url}#${slug}` : url;
    } else if (node.type !== 'html' && node.type !== 'code') {
      const value = toString(node).trim();
      if (value) text += `${value}\n`;
    }
  }
  flush();
  return sections;
}

export async function buildSiteIndex(): Promise<SiteEntry[]> {
  const [notes, shelf] = await Promise.all([
    getCollection('notes', ({ data }) => !data.draft),
    getCollection('shelf'),
  ]);

  return [
    ...notes.map((note) => {
      const url = `/notes/${note.id}/`;
      return {
        id: note.id,
        kind: 'note' as const,
        title: note.data.title,
        description: note.data.description,
        url,
        tags: note.data.tags,
        sections: sectionsFromMarkdown(note.body, url, note.data.title),
      };
    }),
    ...shelf.map((entry) => {
      const url = `/shelf/${entry.id}/`;
      return {
        id: entry.id,
        kind: 'shelf' as const,
        title: entry.data.title,
        description: `${entry.data.kind} · ${entry.data.status}${entry.data.rating ? ` · ${entry.data.rating}/10` : ''}`,
        url,
        tags: [entry.data.kind, entry.data.status, entry.data.alt].filter(Boolean),
        sections: [
          ...sectionsFromMarkdown(entry.body, url, entry.data.title),
          ...(entry.data.quotes.length > 0
            ? [{ title: '金句摘抄', url, text: entry.data.quotes.join('\n') }]
            : []),
        ],
      };
    }),
    ...projects.map((project) => ({
      id: project.slug,
      kind: 'project' as const,
      title: project.name,
      description: project.description,
      url: `/projects/${project.slug}/`,
      tags: [project.language, ...project.topics],
      sections: [{ title: project.name, url: `/projects/${project.slug}/`, text: `${project.description} ${project.overview}` }],
    })),
  ];
}
