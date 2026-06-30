import { NextRequest, NextResponse } from 'next/server';
import {
  getValidTemplateIds,
  loadAndRender,
} from '../../../../../../features/admin-emails/lib/renderTemplate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const INTERNAL_KEY = process.env.INTERNAL_TEMPLATE_KEY;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!INTERNAL_KEY || req.headers.get('x-internal-key') !== INTERNAL_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
    console.error('[internal/email-templates] Failed to parse request body:', error);
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const html = loadAndRender(id, vars);
    return NextResponse.json({ html });
  } catch (error) {
    console.error('[internal/email-templates] Failed to render template:', { id, error });
    return NextResponse.json({ error: 'Failed to render template' }, { status: 500 });
  }
}
