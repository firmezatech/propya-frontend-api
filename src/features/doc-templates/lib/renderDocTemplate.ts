import fs from 'node:fs';
import path from 'node:path';

const TEMPLATES_DIR = path.join(process.cwd(), 'src', 'features', 'doc-templates', 'templates');

export const getValidTemplateIds = (): string[] => {
  try {
    return fs
      .readdirSync(TEMPLATES_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch (error) {
    console.error('[renderDocTemplate] Failed to read templates directory:', error);
    return [];
  }
};

export const loadAndRender = (id: string, vars: Record<string, string>): string => {
  const templatePath = path.join(TEMPLATES_DIR, id, 'template.html');
  const raw = fs.readFileSync(templatePath, 'utf-8');
  return Object.entries(vars).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    raw,
  );
};
