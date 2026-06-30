import fs from 'node:fs';
import path from 'node:path';

const TEMPLATES_DIR = path.join(process.cwd(), 'src', 'features', 'admin-emails', 'templates');
const PARTIALS_DIR  = path.join(process.cwd(), 'src', 'features', 'admin-emails', 'partials');

const PARTIAL_TAG_PATTERN = /\{\{partial:([a-z-]+)(?::([^}]*))?\}\}/g;

export const getValidTemplateIds = (): string[] => {
  try {
    return fs
      .readdirSync(TEMPLATES_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch (error) {
    console.error('[renderTemplate] Failed to read templates directory:', error);
    return [];
  }
};

const resolvePartials = (html: string): string =>
  html.replace(PARTIAL_TAG_PATTERN, (_match, name: string, label?: string) => {
    const partialPath = path.join(PARTIALS_DIR, `${name}.html`);
    const partialHtml = fs.readFileSync(partialPath, 'utf-8');
    return label === undefined ? partialHtml : partialHtml.replaceAll('{{label}}', label);
  });

export const substituteVars = (html: string, vars: Record<string, string>): string =>
  Object.entries(vars).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    html,
  );

export const loadAndRender = (id: string, vars: Record<string, string>): string => {
  const templatePath = path.join(TEMPLATES_DIR, id, 'template.html');
  const raw = fs.readFileSync(templatePath, 'utf-8');
  return substituteVars(resolvePartials(raw), vars);
};
