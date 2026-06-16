import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TEMPLATES_DIR = path.join(process.cwd(), 'src', 'features', 'admin-emails', 'templates');

type TemplateField = {
  id: string;
  label: string;
  type: 'text' | 'url' | 'date' | 'property';
  placeholder: string;
  required: boolean;
};

type TemplateMeta = {
  id: string;
  name: string;
  category: string;
  badge: string;
  subject: string;
  fields: TemplateField[];
};

const readTemplateMeta = (dirName: string): TemplateMeta | null => {
  try {
    const metaPath = path.join(TEMPLATES_DIR, dirName, 'meta.json');
    const raw = fs.readFileSync(metaPath, 'utf-8');
    return JSON.parse(raw) as TemplateMeta;
  } catch {
    return null;
  }
};

export async function GET() {
  try {
    const entries = fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true });
    const templates = entries
      .filter((e) => e.isDirectory())
      .map((e) => readTemplateMeta(e.name))
      .filter((meta): meta is TemplateMeta => meta !== null);

    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 });
  }
}
