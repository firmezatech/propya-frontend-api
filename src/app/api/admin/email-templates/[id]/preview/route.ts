import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TEMPLATES_DIR = path.join(process.cwd(), 'src', 'features', 'admin-emails', 'templates');
const PARTIALS_DIR = path.join(process.cwd(), 'src', 'features', 'admin-emails', 'partials');

const getValidTemplateIds = (): string[] => {
  try {
    return fs
      .readdirSync(TEMPLATES_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch (error) {
    console.error('[email-templates] Failed to read templates directory:', error);
    return [];
  }
};

const substituteVars = (html: string, vars: Record<string, string>): string =>
  Object.entries(vars).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    html,
  );

const PARTIAL_TAG_PATTERN = /\{\{partial:([a-z-]+)(?::([^}]*))?\}\}/g;

const resolvePartials = (html: string): string =>
  html.replace(PARTIAL_TAG_PATTERN, (_match, name: string, label?: string) => {
    const partialPath = path.join(PARTIALS_DIR, `${name}.html`);
    const partialHtml = fs.readFileSync(partialPath, 'utf-8');
    return label === undefined ? partialHtml : partialHtml.replaceAll('{{label}}', label);
  });

const loadTemplateHtml = (id: string): string => {
  const templatePath = path.join(TEMPLATES_DIR, id, 'template.html');
  const raw = fs.readFileSync(templatePath, 'utf-8');
  return resolvePartials(raw);
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const validIds = getValidTemplateIds();
  if (!validIds.includes(id)) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  let vars: Record<string, string>;
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 });
    }
    vars = body as Record<string, string>;
  } catch (error) {
    console.error('[email-templates] Failed to parse request body:', error);
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const html = loadTemplateHtml(id);
    const rendered = substituteVars(html, vars);
    return NextResponse.json({ html: rendered });
  } catch (error) {
    console.error('[email-templates] Failed to render template:', { id, error });
    return NextResponse.json({ error: 'Failed to render template' }, { status: 500 });
  }
}
