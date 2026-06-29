import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { api, apiError } from '../lib/api';

const PROMPTS = [
  "What's sitting heaviest on your mind right now?",
  'What went better than expected today?',
  "What's one thing you're avoiding — and why?",
  'What would tomorrow look like if it went really well?',
  "What are you grateful for, even if it's small?",
  "What's something you want to stop doing? Start doing?",
  'Describe your energy today in three words. What shaped it?',
  'What did you learn today — about work, people, or yourself?',
  "What's a decision you've been putting off?",
  'Who made an impression on you recently, and why?',
  'What would you tell yourself from a week ago?',
  "What does 'a good day' look like for you right now?",
  "What's one fear you're carrying quietly?",
  "What's something you did that you're proud of?",
  'What do you need more of? Less of?',
];

function getDayPrompt() {
  const dayIndex = Math.floor(Date.now() / 86400000) % PROMPTS.length;
  return PROMPTS[dayIndex];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

type JournalEntryData = { text: string; prompt: string; reflection?: string; savedAt: string };
type Entries = Record<string, JournalEntryData>;
type JournalApiEntry = { date: string; text: string; prompt: string; reflection?: string; savedAt: string };

async function loadEntries(): Promise<Entries> {
  try {
    const { data } = await api.get<JournalApiEntry[]>('/api/journal');
    const map: Entries = {};
    for (const e of data) {
      map[e.date] = { text: e.text, prompt: e.prompt, reflection: e.reflection || undefined, savedAt: e.savedAt };
    }
    return map;
  } catch {
    return {};
  }
}

async function saveEntry(date: string, entry: { text: string; prompt: string; reflection?: string }) {
  try {
    await api.put(`/api/journal/${date}`, entry);
  } catch (e) {
    console.error('Save failed', e);
  }
}

export default function Journal() {
  const [view, setView] = useState<'write' | 'history'>('write');
  const [entries, setEntries] = useState<Entries>({});
  const [todayText, setTodayText] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiThought, setAiThought] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [reflectionReady, setReflectionReady] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const today = getTodayKey();
  const prompt = getDayPrompt();

  useEffect(() => {
    loadEntries().then((data) => {
      setEntries(data);
      if (data[today]) setTodayText(data[today].text || '');
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The journal renders its own full dark background, so suppress the app's
  // light bottom scrim while this page is mounted.
  useEffect(() => {
    document.body.classList.add('journal-page');
    return () => document.body.classList.remove('journal-page');
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTodayText(val);
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const updated = {
        ...entries,
        [today]: { text: val, prompt, savedAt: new Date().toISOString() },
      };
      setEntries(updated);
      await saveEntry(today, { text: val, prompt });
      setSaved(true);
    }, 800);
  };

  const askClaude = async () => {
    if (!todayText.trim() || aiLoading) return;
    setAiLoading(true);
    setAiThought('');
    setReflectionReady(false);
    try {
      const { data } = await api.post<{ reflection: string }>('/api/journal/reflect', {
        prompt,
        text: todayText,
      });
      if (data.reflection) {
        setAiThought(data.reflection);
        setReflectionReady(true);
      } else {
        setAiThought("Couldn't reach Claude right now. Try again in a moment.");
      }
    } catch (err) {
      setAiThought(apiError(err, "Couldn't reach Claude right now. Try again in a moment."));
    }
    setAiLoading(false);
  };

  // Save today's entry (with its reflection) into Past entries.
  const submitEntry = async () => {
    const reflection = reflectionReady ? aiThought : undefined;
    const updated: Entries = {
      ...entries,
      [today]: { text: todayText, prompt, reflection, savedAt: new Date().toISOString() },
    };
    setEntries(updated);
    await saveEntry(today, { text: todayText, prompt, ...(reflection ? { reflection } : {}) });
    setSelectedEntry(today);
    setView('history');
  };

  const entryDates = Object.keys(entries).sort((a, b) => b.localeCompare(a));
  const wordCount = todayText.trim() ? todayText.trim().split(/\s+/).length : 0;

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingDot} />
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoMark}>✦</span>
            <span style={styles.logoText}>daily journal</span>
          </div>
          <nav style={styles.nav}>
            <button
              style={{ ...styles.navBtn, ...(view === 'write' ? styles.navActive : {}) }}
              onClick={() => {
                setView('write');
                setSelectedEntry(null);
              }}
            >
              Write
            </button>
            <button
              style={{ ...styles.navBtn, ...(view === 'history' ? styles.navActive : {}) }}
              onClick={() => setView('history')}
            >
              Past entries {entryDates.length > 0 && <span style={styles.badge}>{entryDates.length}</span>}
            </button>
          </nav>
        </div>
      </header>

      <main style={styles.main}>
        {view === 'write' && (
          <div style={styles.writeView}>
            {/* Date + prompt */}
            <div style={styles.dateRow}>
              <span style={styles.dateLabel}>{formatDate(today)}</span>
              {saved && todayText && <span style={styles.savedBadge}>saved</span>}
            </div>

            <div style={styles.promptBox}>
              <span style={styles.promptEyebrow}>today's prompt</span>
              <p style={styles.promptText}>{prompt}</p>
            </div>

            {/* Textarea */}
            <textarea
              style={styles.textarea}
              placeholder="Start writing... there's no wrong way."
              value={todayText}
              onChange={handleChange}
              autoFocus
            />

            <div style={styles.textareaFooter}>
              <span style={styles.wordCount}>
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </span>
              <button
                style={{ ...styles.reflectBtn, ...(aiLoading ? styles.reflectBtnDisabled : {}) }}
                onClick={askClaude}
                disabled={!todayText.trim() || aiLoading}
              >
                {aiLoading ? 'Reflecting…' : '✦ Get a reflection'}
              </button>
            </div>

            {/* AI reflection */}
            {aiThought && (
              <div style={styles.aiBox}>
                <span style={styles.aiEyebrow}>reflection</span>
                <p style={styles.aiText}>{aiThought}</p>
                {reflectionReady && (
                  <div style={styles.aiBoxFooter}>
                    <button style={styles.submitBtn} onClick={submitEntry}>
                      Save to entries →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {view === 'history' && !selectedEntry && (
          <div style={styles.historyView}>
            <h2 style={styles.historyTitle}>Your entries</h2>
            {entryDates.length === 0 ? (
              <p style={styles.emptyState}>No past entries yet. Write your first one today.</p>
            ) : (
              <div style={styles.entryList}>
                {entryDates.map((date) => {
                  const entry = entries[date];
                  const preview = entry.text?.trim().slice(0, 100) || '';
                  const wc = entry.text?.trim().split(/\s+/).filter(Boolean).length || 0;
                  const isToday = date === today;
                  return (
                    <button key={date} style={styles.entryCard} onClick={() => setSelectedEntry(date)}>
                      <div style={styles.entryCardTop}>
                        <span style={styles.entryDate}>{formatDate(date)}</span>
                        {isToday && <span style={styles.todayTag}>today</span>}
                      </div>
                      <p style={styles.entryPreview}>
                        {preview}
                        {preview.length >= 100 ? '…' : ''}
                      </p>
                      <span style={styles.entryMeta}>{wc} words</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === 'history' && selectedEntry && (
          <div style={styles.writeView}>
            <button style={styles.backBtn} onClick={() => setSelectedEntry(null)}>
              ← Back
            </button>
            <div style={styles.dateRow}>
              <span style={styles.dateLabel}>{formatDate(selectedEntry)}</span>
            </div>
            {entries[selectedEntry]?.prompt && (
              <div style={styles.promptBox}>
                <span style={styles.promptEyebrow}>prompt</span>
                <p style={styles.promptText}>{entries[selectedEntry].prompt}</p>
              </div>
            )}
            <div style={styles.readonlyEntry}>{entries[selectedEntry]?.text || ''}</div>
            {entries[selectedEntry]?.reflection && (
              <div style={styles.aiBox}>
                <span style={styles.aiEyebrow}>reflection</span>
                <p style={styles.aiText}>{entries[selectedEntry].reflection}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: '#0f0f0f',
    color: '#e8e4dc',
    fontFamily: "'Georgia', serif",
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    minHeight: '100vh',
    background: '#0f0f0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#c9a96e',
    animation: 'pulse 1s infinite',
  },
  header: {
    borderBottom: '1px solid #222',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    background: '#0f0f0f',
    zIndex: 10,
  },
  headerInner: {
    maxWidth: 680,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoMark: {
    color: '#c9a96e',
    fontSize: 16,
  },
  logoText: {
    fontSize: 14,
    letterSpacing: '0.12em',
    color: '#888',
    fontFamily: "'Georgia', serif",
    fontStyle: 'italic',
  },
  nav: {
    display: 'flex',
    gap: 4,
  },
  navBtn: {
    background: 'none',
    border: 'none',
    color: '#555',
    fontSize: 13,
    padding: '6px 14px',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
    letterSpacing: '0.02em',
    transition: 'color 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  navActive: {
    color: '#e8e4dc',
    background: '#1a1a1a',
  },
  badge: {
    background: '#c9a96e22',
    color: '#c9a96e',
    fontSize: 11,
    padding: '1px 6px',
    borderRadius: 10,
    fontFamily: 'system-ui, sans-serif',
  },
  main: {
    flex: 1,
    padding: '40px 24px 80px',
  },
  writeView: {
    maxWidth: 660,
    margin: '0 auto',
  },
  dateRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dateLabel: {
    fontSize: 13,
    color: '#555',
    fontFamily: 'system-ui, sans-serif',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  savedBadge: {
    fontSize: 11,
    color: '#c9a96e',
    fontFamily: 'system-ui, sans-serif',
    letterSpacing: '0.06em',
  },
  promptBox: {
    borderLeft: '2px solid #c9a96e',
    paddingLeft: 16,
    marginBottom: 32,
  },
  promptEyebrow: {
    display: 'block',
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#c9a96e',
    fontFamily: 'system-ui, sans-serif',
    marginBottom: 6,
  },
  promptText: {
    margin: 0,
    fontSize: 18,
    lineHeight: 1.55,
    color: '#ccc',
    fontStyle: 'italic',
  },
  textarea: {
    width: '100%',
    minHeight: 280,
    background: '#141414',
    border: '1px solid #222',
    borderRadius: 8,
    color: '#e8e4dc',
    fontSize: 16,
    lineHeight: 1.75,
    padding: '20px',
    fontFamily: "'Georgia', serif",
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  textareaFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  wordCount: {
    fontSize: 12,
    color: '#444',
    fontFamily: 'system-ui, sans-serif',
  },
  reflectBtn: {
    background: 'none',
    border: '1px solid #c9a96e55',
    color: '#c9a96e',
    fontSize: 13,
    padding: '8px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
    letterSpacing: '0.02em',
    transition: 'all 0.15s',
  },
  reflectBtnDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  aiBox: {
    marginTop: 28,
    background: '#141414',
    border: '1px solid #222',
    borderRadius: 8,
    padding: '20px 24px',
  },
  aiEyebrow: {
    display: 'block',
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#555',
    fontFamily: 'system-ui, sans-serif',
    marginBottom: 10,
  },
  aiText: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.7,
    color: '#bbb',
    fontStyle: 'italic',
  },
  aiBoxFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  submitBtn: {
    background: '#c9a96e',
    border: '1px solid #c9a96e',
    color: '#0f0f0f',
    fontSize: 13,
    padding: '8px 18px',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
    letterSpacing: '0.02em',
    fontWeight: 600,
  },
  historyView: {
    maxWidth: 660,
    margin: '0 auto',
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: 400,
    marginBottom: 28,
    color: '#e8e4dc',
  },
  emptyState: {
    color: '#444',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 14,
    fontStyle: 'italic',
  },
  entryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  entryCard: {
    background: '#141414',
    border: '1px solid #222',
    borderRadius: 8,
    padding: '18px 20px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
    width: '100%',
  },
  entryCardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'system-ui, sans-serif',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  todayTag: {
    fontSize: 10,
    color: '#c9a96e',
    background: '#c9a96e18',
    padding: '2px 7px',
    borderRadius: 10,
    fontFamily: 'system-ui, sans-serif',
    letterSpacing: '0.06em',
  },
  entryPreview: {
    margin: '0 0 10px',
    fontSize: 14,
    lineHeight: 1.6,
    color: '#999',
    fontStyle: 'italic',
  },
  entryMeta: {
    fontSize: 11,
    color: '#444',
    fontFamily: 'system-ui, sans-serif',
  },
  readonlyEntry: {
    fontSize: 16,
    lineHeight: 1.8,
    color: '#ccc',
    whiteSpace: 'pre-wrap',
    background: '#141414',
    border: '1px solid #222',
    borderRadius: 8,
    padding: '24px',
    minHeight: 200,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#555',
    fontSize: 13,
    padding: '0 0 20px',
    cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
    display: 'block',
    transition: 'color 0.15s',
  },
};
