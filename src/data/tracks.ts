export type BlockStatus = 'completed' | 'active' | 'locked';

export interface LBData {
  id: number;
  title: string;
  status: BlockStatus;
  score?: number;
  badge?: string;
}

export interface TrackSection {
  label: string;
  blocks: LBData[];
}

export interface TrackData {
  id: string;
  name: string;
  emoji: string;
  level: string;
  progressColor: string;
  iconBg: string;
  cardBorder: string;
  sections: TrackSection[];
}

export function getTrack(id: string): TrackData | undefined {
  return TRACKS.find((t) => t.id === id);
}

export function getTrackStats(track: TrackData) {
  const all       = track.sections.flatMap((s) => s.blocks);
  const completed = all.filter((b) => b.status === 'completed').length;
  const active    = all.filter((b) => b.status === 'active').length;
  const locked    = all.filter((b) => b.status === 'locked').length;
  const total     = all.length;
  return {
    total,
    completed,
    active,
    locked,
    mastery:     total > 0 ? Math.round((completed / total) * 100) : 0,
    lessonsDone: completed,
    progress:    total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export const TRACKS: TrackData[] = [
  // ── Guitar Mastery ────────────────────────────────────────────────────────
  {
    id: 'guitar',
    name: 'Guitar Mastery',
    emoji: '🎸',
    level: 'Beginner → Advanced',
    progressColor: '#FF6B6B',
    iconBg: '#2A1018',
    cardBorder: '#3A1A22',
    sections: [
      {
        label: 'FOUNDATION',
        blocks: [
          { id: 1,  title: 'Anatomy of a Guitar',        status: 'active'  },
          { id: 2,  title: 'Holding the Guitar',         status: 'locked'  },
          { id: 3,  title: 'Reading Chord Diagrams',     status: 'locked'  },
          { id: 4,  title: 'Your First Open Chord: Em',  status: 'locked'  },
          { id: 5,  title: 'Open Chord: Am',             status: 'locked'  },
          { id: 6,  title: 'Open Chord: D Major',        status: 'locked'  },
          { id: 7,  title: 'Basic Strumming Intro',      status: 'locked'  },
          { id: 8,  title: 'Playing Your First Song',    status: 'locked'  },
        ],
      },
      {
        label: 'INTERMEDIATE',
        blocks: [
          { id: 9,  title: 'Open Chord: G Major',        status: 'locked' },
          { id: 10, title: 'Chord Transitions',          status: 'locked' },
          { id: 11, title: 'Strumming Patterns',         status: 'locked' },
          { id: 12, title: 'Fingerpicking Basics',       status: 'locked' },
          { id: 13, title: 'Open Chord: C Major',        status: 'locked' },
          { id: 14, title: 'Open Chord: F Major',        status: 'locked' },
          { id: 15, title: 'Barre Chords Intro',         status: 'locked' },
          { id: 16, title: 'Minor Pentatonic Scale',     status: 'locked' },
          { id: 17, title: 'Power Chords',               status: 'locked' },
          { id: 18, title: '12-Bar Blues',               status: 'locked' },
          { id: 19, title: 'Rhythm Guitar',              status: 'locked' },
          { id: 20, title: 'Lead Guitar Basics',         status: 'locked' },
        ],
      },
      {
        label: 'ADVANCED',
        blocks: [
          { id: 21, title: 'Barre Chords Mastery',       status: 'locked' },
          { id: 22, title: 'Blues Scale',                status: 'locked' },
          { id: 23, title: 'Fingerstyle Technique',      status: 'locked' },
          { id: 24, title: 'Music Theory Basics',        status: 'locked' },
          { id: 25, title: 'Improvisation Intro',        status: 'locked' },
          { id: 26, title: 'Playing by Ear',             status: 'locked' },
          { id: 27, title: 'Recording Your First Track', status: 'locked' },
          { id: 28, title: 'Guitar Mastery Capstone',    status: 'locked' },
        ],
      },
    ],
  },

  // ── Personal Finance ──────────────────────────────────────────────────────
  {
    id: 'finance',
    name: 'Personal Finance',
    emoji: '💰',
    level: 'Beginner → Advanced',
    progressColor: '#3DD68C',
    iconBg: '#0C201A',
    cardBorder: '#143528',
    sections: [
      {
        label: 'FOUNDATION',
        blocks: [
          { id: 101, title: 'The Money Mindset',          status: 'active' },
          { id: 102, title: 'Income vs Expenses',         status: 'locked' },
          { id: 103, title: 'Your First Budget',          status: 'locked' },
          { id: 104, title: 'Understanding Debt',         status: 'locked' },
          { id: 105, title: 'Needs vs Wants',             status: 'locked' },
          { id: 106, title: 'Cash Flow Management',       status: 'locked' },
          { id: 107, title: 'Financial Goals Setting',    status: 'locked' },
          { id: 108, title: 'Net Worth Basics',           status: 'locked' },
        ],
      },
      {
        label: 'INTERMEDIATE',
        blocks: [
          { id: 109, title: 'Emergency Fund Basics',      status: 'locked' },
          { id: 110, title: 'Credit Score Explained',     status: 'locked' },
          { id: 111, title: 'Saving Strategies',          status: 'locked' },
          { id: 112, title: 'Investment 101',             status: 'locked' },
          { id: 113, title: 'Banking Smart',              status: 'locked' },
          { id: 114, title: 'Insurance Basics',           status: 'locked' },
          { id: 115, title: 'Compound Interest',          status: 'locked' },
          { id: 116, title: 'Debt Payoff Strategies',     status: 'locked' },
        ],
      },
      {
        label: 'ADVANCED',
        blocks: [
          { id: 117, title: 'Stock Market Fundamentals',  status: 'locked' },
          { id: 118, title: 'ETFs and Index Funds',       status: 'locked' },
          { id: 119, title: 'Retirement Planning',        status: 'locked' },
          { id: 120, title: 'Tax Basics',                 status: 'locked' },
          { id: 121, title: 'Real Estate Investing',      status: 'locked' },
          { id: 122, title: 'Portfolio Diversification',  status: 'locked' },
          { id: 123, title: 'Financial Independence',     status: 'locked' },
          { id: 124, title: 'Building Passive Income',    status: 'locked' },
        ],
      },
    ],
  },

  // ── Body Transformation ───────────────────────────────────────────────────
  {
    id: 'fitness',
    name: 'Body Transformation',
    emoji: '💪',
    level: 'All Levels',
    progressColor: '#FF9F43',
    iconBg: '#201508',
    cardBorder: '#2E1E08',
    sections: [
      {
        label: 'FOUNDATION',
        blocks: [
          { id: 201, title: 'Movement Fundamentals',        status: 'active' },
          { id: 202, title: 'Proper Warm Up',               status: 'locked' },
          { id: 203, title: 'Compound Movements',           status: 'locked' },
          { id: 204, title: 'Rest and Recovery',            status: 'locked' },
          { id: 205, title: 'Stretching and Flexibility',   status: 'locked' },
          { id: 206, title: 'Hydration Basics',             status: 'locked' },
          { id: 207, title: 'Cardio Foundations',           status: 'locked' },
          { id: 208, title: 'Core Strength Basics',         status: 'locked' },
          { id: 209, title: 'Upper Body Foundations',       status: 'locked' },
          { id: 210, title: 'Lower Body Foundations',       status: 'locked' },
        ],
      },
      {
        label: 'INTERMEDIATE',
        blocks: [
          { id: 211, title: 'Progressive Overload',         status: 'locked' },
          { id: 212, title: 'Nutrition Basics',             status: 'locked' },
          { id: 213, title: 'Protein and Macros',           status: 'locked' },
          { id: 214, title: 'Sleep for Performance',        status: 'locked' },
          { id: 215, title: 'Training Frequency',           status: 'locked' },
          { id: 216, title: 'Meal Prep Basics',             status: 'locked' },
          { id: 217, title: 'Caloric Balance',              status: 'locked' },
          { id: 218, title: 'Strength Training Splits',     status: 'locked' },
          { id: 219, title: 'Endurance Training',           status: 'locked' },
          { id: 220, title: 'Mobility Work',                status: 'locked' },
          { id: 221, title: 'Recovery Techniques',          status: 'locked' },
          { id: 222, title: 'Mind-Muscle Connection',       status: 'locked' },
        ],
      },
      {
        label: 'ADVANCED',
        blocks: [
          { id: 223, title: 'Advanced Programming',         status: 'locked' },
          { id: 224, title: 'Body Composition',             status: 'locked' },
          { id: 225, title: 'Plateau Breaking',             status: 'locked' },
          { id: 226, title: 'Lifestyle Integration',        status: 'locked' },
          { id: 227, title: 'Periodization Concepts',       status: 'locked' },
          { id: 228, title: 'Advanced Nutrition',           status: 'locked' },
          { id: 229, title: 'Injury Prevention',            status: 'locked' },
          { id: 230, title: 'Longevity Training',           status: 'locked' },
          { id: 231, title: 'Peak Performance',             status: 'locked' },
          { id: 232, title: 'Transformation Capstone',      status: 'locked' },
        ],
      },
    ],
  },

  // ── Graphic Design ────────────────────────────────────────────────────────
  {
    id: 'design',
    name: 'Graphic Design',
    emoji: '🎨',
    level: 'Beginner → Advanced',
    progressColor: '#F472B6',
    iconBg: '#200E20',
    cardBorder: '#3A1440',
    sections: [
      {
        label: 'FOUNDATION',
        blocks: [
          { id: 301, title: 'Design Principles',           status: 'active' },
          { id: 302, title: 'Colour Theory',               status: 'locked' },
          { id: 303, title: 'Typography Basics',           status: 'locked' },
          { id: 304, title: 'Layout and Composition',      status: 'locked' },
          { id: 305, title: 'Visual Hierarchy',            status: 'locked' },
          { id: 306, title: 'White Space and Balance',     status: 'locked' },
          { id: 307, title: 'Design Elements',             status: 'locked' },
          { id: 308, title: 'Contrast and Repetition',    status: 'locked' },
        ],
      },
      {
        label: 'INTERMEDIATE',
        blocks: [
          { id: 309, title: 'Working with Canva',          status: 'locked' },
          { id: 310, title: 'Logo Design Basics',          status: 'locked' },
          { id: 311, title: 'Social Media Graphics',       status: 'locked' },
          { id: 312, title: 'Brand Identity',              status: 'locked' },
          { id: 313, title: 'Digital Design Tools',        status: 'locked' },
          { id: 314, title: 'Photo Editing Basics',        status: 'locked' },
          { id: 315, title: 'Icon Design',                 status: 'locked' },
          { id: 316, title: 'Presentation Design',         status: 'locked' },
          { id: 317, title: 'Print vs Digital Design',     status: 'locked' },
          { id: 318, title: 'Design Feedback',             status: 'locked' },
        ],
      },
      {
        label: 'ADVANCED',
        blocks: [
          { id: 319, title: 'Adobe Illustrator Intro',     status: 'locked' },
          { id: 320, title: 'Advanced Typography',         status: 'locked' },
          { id: 321, title: 'Portfolio Building',          status: 'locked' },
          { id: 322, title: 'Client Work',                 status: 'locked' },
          { id: 323, title: 'UX/UI Basics',                status: 'locked' },
          { id: 324, title: 'Motion Graphics Intro',       status: 'locked' },
          { id: 325, title: 'Design System Basics',        status: 'locked' },
          { id: 326, title: 'Freelance Design',            status: 'locked' },
        ],
      },
    ],
  },

  // ── Speed Reading ─────────────────────────────────────────────────────────
  {
    id: 'reading',
    name: 'Speed Reading',
    emoji: '📖',
    level: 'Beginner → Advanced',
    progressColor: '#38BDF8',
    iconBg: '#061420',
    cardBorder: '#0A2030',
    sections: [
      {
        label: 'FOUNDATION',
        blocks: [
          { id: 401, title: 'How Reading Works',               status: 'active' },
          { id: 402, title: 'Eliminating Subvocalisation',     status: 'locked' },
          { id: 403, title: 'Eye Movement Training',           status: 'locked' },
          { id: 404, title: 'Focus Techniques',                status: 'locked' },
          { id: 405, title: 'Reading Posture and Environment', status: 'locked' },
          { id: 406, title: 'Baseline Speed Assessment',       status: 'locked' },
        ],
      },
      {
        label: 'INTERMEDIATE',
        blocks: [
          { id: 407, title: 'Chunking Method',                status: 'locked' },
          { id: 408, title: 'Comprehension Strategies',       status: 'locked' },
          { id: 409, title: 'Note Taking Systems',            status: 'locked' },
          { id: 410, title: 'Memory Techniques',              status: 'locked' },
          { id: 411, title: 'Skimming and Scanning',          status: 'locked' },
          { id: 412, title: 'Active Reading',                 status: 'locked' },
          { id: 413, title: 'Reading Fiction vs Non-Fiction', status: 'locked' },
          { id: 414, title: 'Reducing Regression',            status: 'locked' },
        ],
      },
      {
        label: 'ADVANCED',
        blocks: [
          { id: 415, title: 'Advanced Retention',             status: 'locked' },
          { id: 416, title: 'Reading Different Material Types',status: 'locked' },
          { id: 417, title: 'Speed and Comprehension Balance', status: 'locked' },
          { id: 418, title: 'Daily Reading Practice',         status: 'locked' },
          { id: 419, title: 'Speed Reading Drills',           status: 'locked' },
          { id: 420, title: 'SQ3R Method',                    status: 'locked' },
          { id: 421, title: 'Mind Mapping from Reading',      status: 'locked' },
          { id: 422, title: 'Building a Reading Habit',       status: 'locked' },
        ],
      },
    ],
  },
];
