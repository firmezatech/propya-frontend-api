import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TEMPLATES_DIR = path.join(process.cwd(), 'src', 'features', 'admin-emails', 'templates');

const getValidTemplateIds = (): string[] => {
  try {
    return fs
      .readdirSync(TEMPLATES_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return [];
  }
};

const substituteVars = (html: string, vars: Record<string, string>): string =>
  Object.entries(vars).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    html,
  );

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

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
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const templatePath = path.join(TEMPLATES_DIR, id, 'template.html');
    const html = fs.readFileSync(templatePath, 'utf-8');
    const rendered = substituteVars(html, vars);
    return NextResponse.json({ html: rendered });
  } catch {
    return NextResponse.json({ error: 'Failed to render template' }, { status: 500 });
  }
}
