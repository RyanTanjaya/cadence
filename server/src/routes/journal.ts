import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { dateKeySchema, journalEntrySchema, reflectSchema } from '../utils/validation';

const router = Router();
router.use(requireAuth);

// GET /api/journal  → all of the user's entries, newest first
router.get('/', async (req, res, next) => {
  try {
    const entries = await prisma.journalEntry.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' },
      select: { date: true, text: true, prompt: true, reflection: true, savedAt: true },
    });
    res.json(
      entries.map((e) => ({
        date: e.date,
        text: e.text,
        prompt: e.prompt,
        reflection: e.reflection ?? '',
        savedAt: e.savedAt.toISOString(),
      })),
    );
  } catch (err) {
    next(err);
  }
});

// PUT /api/journal/:date  → upsert one day's entry
router.put('/:date', async (req, res, next) => {
  try {
    const date = dateKeySchema.safeParse(req.params.date);
    if (!date.success) {
      res.status(400).json({ error: 'date must be YYYY-MM-DD' });
      return;
    }
    const body = journalEntrySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.issues[0]?.message ?? 'Invalid input' });
      return;
    }
    // Autosave (no reflection) must not wipe a previously saved reflection,
    // so only touch the reflection column when it's explicitly provided.
    const update: { text: string; prompt: string; reflection?: string } = {
      text: body.data.text,
      prompt: body.data.prompt,
    };
    if (body.data.reflection !== undefined) update.reflection = body.data.reflection;

    const entry = await prisma.journalEntry.upsert({
      where: { userId_date: { userId: req.userId!, date: date.data } },
      create: {
        userId: req.userId!,
        date: date.data,
        text: body.data.text,
        prompt: body.data.prompt,
        reflection: body.data.reflection ?? null,
      },
      update,
    });
    res.json({
      date: entry.date,
      text: entry.text,
      prompt: entry.prompt,
      reflection: entry.reflection ?? '',
      savedAt: entry.savedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

const REFLECT_SYSTEM = `You are a thoughtful journaling companion. The user has written a journal entry.
Your job is to offer ONE brief, genuine reflection — something that helps them go a layer deeper, notice a pattern, or reframe something.
Keep it to 2–3 sentences. Don't be generic. Don't give advice unless asked. Speak warmly but plainly. No bullet points.`;

// POST /api/journal/reflect  → proxy a single reflection from Claude
router.post('/reflect', async (req, res, next) => {
  try {
    const body = reflectSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: 'Write something first.' });
      return;
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: 'Reflections are not configured on this server yet.' });
      return;
    }

    const anthropic = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: REFLECT_SYSTEM,
        messages: [
          {
            role: 'user',
            content: `Today's prompt: "${body.data.prompt}"\n\nMy entry:\n${body.data.text}`,
          },
        ],
      }),
    });

    if (!anthropic.ok) {
      res.status(502).json({ error: 'Could not reach Claude right now.' });
      return;
    }
    const data = (await anthropic.json()) as { content?: { type: string; text?: string }[] };
    const reflection = data.content?.find((b) => b.type === 'text')?.text ?? '';
    res.json({ reflection });
  } catch (err) {
    next(err);
  }
});

export default router;
