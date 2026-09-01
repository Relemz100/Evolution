import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Flame, Plus, X, Check, Edit2, Trash2, Sun, Moon, Home, ListChecks,
  BarChart3, Gift, Clock, ChevronDown, ChevronUp, Wand2, Sparkles,
  Layers, Trophy, Target, Loader2, ArrowUp, ArrowDown, RotateCcw, Settings, AlertTriangle,
  Search, Star, Circle, CheckCircle2, BookOpen, Bookmark, Brain, GraduationCap,
  Briefcase, Laptop, Terminal, Code2, Activity, Dumbbell, Heart, Droplets,
  Palette, PenTool, Music, Bed, Coffee, UtensilsCrossed, Leaf, Cloud,
  Swords, Shield, Gem, Package, Crown, Hexagon, Gamepad2, Film, ShoppingBag,
  Headphones, Zap, Download, Upload, ChevronLeft, Info, Bell, Sliders, Coins, CloudSun, Sunset,
} from "lucide-react";

/* =====================================================================
   ICON TOKEN SYSTEM
   Every Stack / Habit / Reward / Category icon comes from this single
   registry (id -> lucide component), never a raw emoji. This is what makes
   the app read as "personal RPG dashboard" rather than "to-do list + emoji".
   ===================================================================== */

const ICON_GROUPS = [
  { key: "general", label: "General", icons: [
    { id: "target", label: "Target", Comp: Target },
    { id: "star", label: "Star", Comp: Star },
    { id: "circle", label: "Circle", Comp: Circle },
    { id: "sparkles", label: "Spark", Comp: Sparkles },
    { id: "check-circle", label: "Check", Comp: CheckCircle2 },
  ]},
  { key: "study", label: "Study", icons: [
    { id: "book-open", label: "Book", Comp: BookOpen },
    { id: "bookmark", label: "Bookmark", Comp: Bookmark },
    { id: "brain", label: "Brain", Comp: Brain },
    { id: "graduation-cap", label: "Graduation", Comp: GraduationCap },
  ]},
  { key: "work", label: "Work", icons: [
    { id: "briefcase", label: "Briefcase", Comp: Briefcase },
    { id: "laptop", label: "Laptop", Comp: Laptop },
    { id: "terminal", label: "Terminal", Comp: Terminal },
    { id: "code", label: "Code", Comp: Code2 },
  ]},
  { key: "health", label: "Health", icons: [
    { id: "activity", label: "Activity", Comp: Activity },
    { id: "dumbbell", label: "Dumbbell", Comp: Dumbbell },
    { id: "heart", label: "Heart", Comp: Heart },
    { id: "droplets", label: "Droplets", Comp: Droplets },
  ]},
  { key: "creative", label: "Creative", icons: [
    { id: "palette", label: "Palette", Comp: Palette },
    { id: "pen-tool", label: "Pen", Comp: PenTool },
    { id: "wand", label: "Wand", Comp: Wand2 },
    { id: "music", label: "Music", Comp: Music },
  ]},
  { key: "home", label: "Home", icons: [
    { id: "home", label: "House", Comp: Home },
    { id: "bed", label: "Bed", Comp: Bed },
    { id: "coffee", label: "Coffee", Comp: Coffee },
    { id: "utensils", label: "Utensils", Comp: UtensilsCrossed },
  ]},
  { key: "nature", label: "Nature", icons: [
    { id: "sun", label: "Sun", Comp: Sun },
    { id: "moon", label: "Moon", Comp: Moon },
    { id: "leaf", label: "Leaf", Comp: Leaf },
    { id: "cloud", label: "Cloud", Comp: Cloud },
    { id: "cloud-sun", label: "Cloud Sun", Comp: CloudSun },
    { id: "sunset", label: "Sunset", Comp: Sunset },
  ]},
  { key: "rpg", label: "RPG", icons: [
    { id: "swords", label: "Sword", Comp: Swords },
    { id: "shield", label: "Shield", Comp: Shield },
    { id: "gem", label: "Gem", Comp: Gem },
    { id: "package", label: "Chest", Comp: Package },
    { id: "crown", label: "Crown", Comp: Crown },
    { id: "hexagon", label: "Rune", Comp: Hexagon },
    { id: "flame", label: "Flame", Comp: Flame },
    { id: "layers", label: "Layers", Comp: Layers },
  ]},
  { key: "fun", label: "Fun", icons: [
    { id: "gamepad", label: "Gamepad", Comp: Gamepad2 },
    { id: "film", label: "Film", Comp: Film },
    { id: "shopping-bag", label: "Shopping", Comp: ShoppingBag },
    { id: "headphones", label: "Headphones", Comp: Headphones },
  ]},
];

const ICON_MAP = ICON_GROUPS.reduce((map, group) => {
  group.icons.forEach((ic) => { map[ic.id] = ic; });
  return map;
}, {});

const DEFAULT_ICON_ID = "sparkles";

// Old save files stored raw emoji for stack/habit/reward icons — map the common
// ones onto the new icon-id system so existing personalization isn't lost.
const EMOJI_TO_ICON_ID = {
  "🌅": "sun", "🌤️": "cloud-sun", "🌇": "sunset", "🌙": "moon", "☀️": "sun",
  "📚": "book-open", "💧": "droplets", "🏃": "activity", "💪": "dumbbell",
  "💻": "laptop", "🧘": "circle", "🛏️": "bed", "🎯": "target", "🧹": "sparkles",
  "✍️": "pen-tool", "🎨": "palette", "🏠": "home", "🎮": "gamepad", "🎬": "film",
  "🎁": "package", "🍕": "utensils", "☕": "coffee", "🛍️": "shopping-bag",
  "🎧": "headphones", "🌴": "leaf", "✨": "sparkles",
};

function resolveIconId(raw) {
  if (!raw) return DEFAULT_ICON_ID;
  if (ICON_MAP[raw]) return raw;
  if (EMOJI_TO_ICON_ID[raw]) return EMOJI_TO_ICON_ID[raw];
  return DEFAULT_ICON_ID;
}

function IconGlyph({ id, size = 16, className }) {
  const def = ICON_MAP[resolveIconId(id)] || ICON_MAP[DEFAULT_ICON_ID];
  const Comp = def.Comp;
  return <Comp size={size} className={className} strokeWidth={2} />;
}

// Compact, searchable, grouped icon picker. Recent + Favorite icons (persisted
// in settings) surface above the category groups so personal picks are one tap away.
function IconPicker({ theme, value, onChange, recentIds = [], favoriteIds = [], onUseIcon, onToggleFavorite }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const recentDefs = recentIds.map((id) => ICON_MAP[id]).filter(Boolean).slice(0, 8);
  const favoriteDefs = favoriteIds.map((id) => ICON_MAP[id]).filter(Boolean);

  const groups = q
    ? [{ key: "results", label: "نتایج", icons: ICON_GROUPS.flatMap((g) => g.icons).filter((ic) => ic.label.toLowerCase().includes(q) || ic.id.includes(q)) }]
    : ICON_GROUPS;

  const IconButton = ({ ic }) => {
    const active = value === ic.id;
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => { onChange(ic.id); onUseIcon?.(ic.id); }}
          className={cn(
            "w-11 h-11 rounded-xl border flex items-center justify-center transition-colors",
            active ? "border-current bg-current/10" : theme.border,
            active ? theme.text : theme.textMuted
          )}
          title={ic.label}
        >
          <IconGlyph id={ic.id} size={18} />
        </button>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(ic.id); }}
            className="absolute -top-1.5 -left-1.5 p-0.5 rounded-full bg-black/40"
          >
            <Star size={9} className={favoriteIds.includes(ic.id) ? "fill-amber-400 text-amber-400" : "text-white/70"} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2 border", theme.inputBg, theme.border)}>
        <Search size={14} className={theme.textMuted} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی آیکون..."
          className={cn("flex-1 text-sm bg-transparent outline-none", theme.text)}
        />
      </div>

      <div className="max-h-64 overflow-y-auto flex flex-col gap-3.5 pr-0.5">
        {!q && favoriteDefs.length > 0 && (
          <div>
            <h4 className={cn("text-[10px] font-bold tracking-wide mb-1.5", theme.textMuted)}>FAVORITES</h4>
            <div className="flex flex-wrap gap-2">{favoriteDefs.map((ic) => <IconButton key={ic.id} ic={ic} />)}</div>
          </div>
        )}
        {!q && recentDefs.length > 0 && (
          <div>
            <h4 className={cn("text-[10px] font-bold tracking-wide mb-1.5", theme.textMuted)}>RECENT</h4>
            <div className="flex flex-wrap gap-2">{recentDefs.map((ic) => <IconButton key={ic.id} ic={ic} />)}</div>
          </div>
        )}
        {groups.map((g) => (
          <div key={g.key}>
            <h4 className={cn("text-[10px] font-bold tracking-wide mb-1.5", theme.textMuted)}>{g.label.toUpperCase()}</h4>
            {g.icons.length === 0 ? (
              <p className={cn("text-[11px]", theme.textMuted)}>چیزی پیدا نشد.</p>
            ) : (
              <div className="flex flex-wrap gap-2">{g.icons.map((ic) => <IconButton key={ic.id} ic={ic} />)}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =====================================================================
   CONFIG / CONSTANTS
   ===================================================================== */

const STORAGE_KEY = "rpg-daily-quest-data-v1";

const DIFFICULTY_OPTIONS = [
  { key: "noXp", label: "خیلی کوچک (بدون XP)", xp: 0 },
  { key: "veryEasy", label: "خیلی ساده", xp: 5 },
  { key: "normal", label: "معمولی", xp: 10 },
  { key: "medium", label: "متوسط", xp: 20 },
  { key: "hard", label: "سخت", xp: 35 },
  { key: "veryHard", label: "خیلی سخت", xp: 50 },
];

// How much each Task "counts" toward Task Completion Score, independent of its
// XP value — a hard task shouldn't be worth the same fairness-weight as a trivial
// checklist item. Deliberately simple (not tied 1:1 to XP) per the "fairness, not
// complexity" principle.
const TASK_WEIGHTS = { noXp: 1, veryEasy: 1, normal: 1, medium: 1.5, hard: 2, veryHard: 3 };
function taskWeight(difficulty) {
  return TASK_WEIGHTS[difficulty] ?? 1;
}

/* =====================================================================
   DAILY SCORE — independent from XP.
   XP = permanent long-term growth (drives Level).
   Daily Score = how well today specifically went, 0-100, reset every day.
   Weights: Task Completion 55% (this absorbs what would've been a separate
   "Priority" weight — Priority was intentionally removed from the Task model
   in an earlier iteration, so importance is expressed via difficulty weight
   instead, not a revived priority field) / Stack Completion 25% / Habit
   Consistency 20%. A component with literally nothing applicable that day
   (e.g. no Habits exist yet) is excluded and the remaining weights are
   renormalized — never counted as a fabricated 0% or a free 100%.
   ===================================================================== */
const DAILY_SCORE_WEIGHTS = { task: 0.55, stack: 0.25, habit: 0.20 };

function computeDailyScore({ taskWeightStats, stackCompletions, habitStats }) {
  const components = [];
  if (taskWeightStats && taskWeightStats.totalWeight > 0) {
    components.push({ pct: (taskWeightStats.completedWeight / taskWeightStats.totalWeight) * 100, w: DAILY_SCORE_WEIGHTS.task });
  }
  if (stackCompletions && stackCompletions.length > 0) {
    const avg = stackCompletions.reduce((s, v) => s + v, 0) / stackCompletions.length;
    components.push({ pct: avg, w: DAILY_SCORE_WEIGHTS.stack });
  }
  if (habitStats && habitStats.total > 0) {
    components.push({ pct: (habitStats.completed / habitStats.total) * 100, w: DAILY_SCORE_WEIGHTS.habit });
  }
  if (components.length === 0) return null; // a genuinely empty day — nothing to score
  const totalW = components.reduce((s, c) => s + c.w, 0);
  const score = components.reduce((s, c) => s + c.pct * (c.w / totalW), 0);
  return Math.max(0, Math.min(100, Math.round(score)));
}

const TIME_SLOTS = [
  { key: "morning", label: "صبح", icon: "sun" },
  { key: "afternoon", label: "ظهر", icon: "cloud-sun" },
  { key: "evening", label: "عصر", icon: "sunset" },
  { key: "night", label: "شب", icon: "moon" },
];

const STACK_BONUS_XP = 15;

const MIN_XP_FOR_STREAK = 15; // minimum XP earned in a day (if no task/habit completed) to keep the streak alive
const SHIELD_EARN_INTERVAL = 7; // days of unbroken streak needed to earn a new Streak Shield
const DEFAULT_MAX_SHIELDS = 2;
const MIN_WEEKLY_XP_GOAL = 50;
const MAX_WEEKLY_XP_GOAL = 10000;
const DEFAULT_WEEKLY_XP_GOAL = 500; // starting point only — stored in settings.weeklyXpGoal and user-editable from the Stats page
const CATEGORY_COLORS = ["amber", "violet", "emerald", "sky", "rose", "orange"];
const COIN_RATIO = 5; // 5 XP earned = 1 Coin. Coins are spent on Rewards; XP itself is never spent.
const SCHEMA_VERSION = 11;

function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysStr(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return todayStr(d);
}

function last7Dates(fromDateStr) {
  const arr = [];
  for (let i = 6; i >= 0; i--) arr.push(addDaysStr(fromDateStr, -i));
  return arr;
}

const WEEKDAY_FA = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
function weekdayFa(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return WEEKDAY_FA[d.getDay()];
}

/* =====================================================================
   XP / LEVEL LOGIC  (kept isolated so it can evolve independently)
   ===================================================================== */

function xpForLevel(level) {
  return Math.round(80 * Math.pow(level, 1.3)) + 20;
}

function levelInfo(totalXp) {
  let level = 1;
  let remaining = totalXp;
  let needed = xpForLevel(1);
  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = xpForLevel(level);
  }
  return {
    level,
    xpIntoLevel: remaining,
    xpNeeded: needed,
    percent: Math.max(0, Math.min(100, Math.round((remaining / needed) * 100))),
  };
}

/* Streak milestones — gives the Streak Ring a real "next target" instead of an
   arbitrary /30 scale. Beyond the last defined milestone, targets keep
   stepping up by 100 days so long streaks still have somewhere to climb to. */
const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 100, 150, 200, 300, 400, 500];
function getStreakMilestone(streak) {
  const next = STREAK_MILESTONES.find((m) => m > streak);
  if (next !== undefined) {
    const idx = STREAK_MILESTONES.indexOf(next);
    const prev = idx > 0 ? STREAK_MILESTONES[idx - 1] : 0;
    return { prev, next };
  }
  const base = STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
  const stepsBeyond = Math.floor((streak - base) / 100) + 1;
  return { prev: base + (stepsBeyond - 1) * 100, next: base + stepsBeyond * 100 };
}

/* =====================================================================
   XP → COIN ECONOMY
   XP is only ever earned, never spent — it drives Level/Progress/Statistics
   (totalXp is clamped at 0 so Level never looks negative).

   Coins are tracked as an explicit ledger:
     coinBalance     — whole Coins currently held (can go negative — "Coin debt")
     coinRemainder   — leftover XP toward the next Coin, always kept in [0, COIN_RATIO)

   Every XP change (earn OR undo) goes through applyXpToProfile, which folds the
   delta into coinRemainder and carries any overflow/underflow into coinBalance
   using proper floored division (Math.floor — NOT truncation, NOT ceil). This
   floor-based math is what makes the ledger reversible: the invariant
   "coinBalance * COIN_RATIO + coinRemainder === netXpEverApplied" always holds,
   for both positive and negative deltas, with the exact same formula — so
   Complete → Undo → Complete always nets back to the same balance and can
   never mint a free Coin. coinRemainder never loses XP; it's just the part
   that hasn't reached a whole Coin yet. Redeeming a Reward only ever
   decrements coinBalance directly — it never touches remainder or totalXp.
   ===================================================================== */

function applyXpToProfile(profile, deltaXp) {
  if (!deltaXp) return profile;
  const totalXp = Math.max(0, (profile.totalXp || 0) + deltaXp);
  const rawRemainder = (profile.coinRemainder || 0) + deltaXp;
  const balanceChange = Math.floor(rawRemainder / COIN_RATIO);
  const coinRemainder = rawRemainder - balanceChange * COIN_RATIO; // always in [0, COIN_RATIO)
  const coinBalance = (profile.coinBalance || 0) + balanceChange;
  return { ...profile, totalXp, coinBalance, coinRemainder };
}

function getCoinBalance(profile) {
  return profile?.coinBalance ?? 0;
}

/* =====================================================================
   DEFAULT DATA
   ===================================================================== */

function defaultCategories() {
  return [
    { id: uid("cat"), name: "Study", iconId: "book-open", color: "violet" },
    { id: uid("cat"), name: "Work", iconId: "briefcase", color: "sky" },
    { id: uid("cat"), name: "Exercise", iconId: "dumbbell", color: "emerald" },
    { id: uid("cat"), name: "Creative", iconId: "palette", color: "rose" },
    { id: uid("cat"), name: "Personal", iconId: "home", color: "amber" },
    { id: uid("cat"), name: "Home", iconId: "bed", color: "violet" },
  ];
}

function defaultStacks(categories, dateStr) {
  const catId = (name) => categories.find((c) => c.name === name)?.id || null;
  const stacks = [
    {
      id: uid("stack"),
      name: "روتین صبحگاهی",
      icon: "sun",
      color: "amber",
      defaultCategoryId: catId("Personal"),
      taskTemplates: [
        { id: uid("tpl"), title: "نوشیدن آب", difficulty: "veryEasy", xp: 5 },
        { id: uid("tpl"), title: "مرتب کردن تخت", difficulty: "veryEasy", xp: 5 },
        { id: uid("tpl"), title: "برنامه‌ریزی کارهای امروز", difficulty: "normal", xp: 10 },
      ],
    },
    {
      id: uid("stack"),
      name: "مطالعه",
      icon: "book-open",
      color: "violet",
      defaultCategoryId: catId("Study"),
      taskTemplates: [
        { id: uid("tpl"), title: "مطالعه ۲۰ دقیقه‌ای", difficulty: "medium", xp: 20 },
      ],
    },
    {
      id: uid("stack"),
      name: "ورزش",
      icon: "dumbbell",
      color: "emerald",
      defaultCategoryId: catId("Exercise"),
      taskTemplates: [
        { id: uid("tpl"), title: "۱۵ دقیقه تمرین بدنی", difficulty: "normal", xp: 10 },
      ],
    },
    {
      id: uid("stack"),
      name: "کار",
      icon: "laptop",
      color: "sky",
      defaultCategoryId: catId("Work"),
      taskTemplates: [],
    },
    {
      id: uid("stack"),
      name: "شب",
      icon: "moon",
      color: "violet",
      defaultCategoryId: catId("Personal"),
      taskTemplates: [
        { id: uid("tpl"), title: "مرور کارهای امروز", difficulty: "veryEasy", xp: 5 },
      ],
    },
  ];
  // Every Stack tracks the date it was created and whether it's archived — this is
  // what lets the Stack Progress chart know exactly when a line should start, and
  // lets an archived Stack's history keep existing after it stops generating new Tasks.
  return stacks.map((s) => ({ ...s, createdDate: dateStr, archived: false }));
}

function defaultHabits() {
  return [
    { id: uid("habit"), name: "نوشیدن آب کافی", icon: "droplets", color: "sky", xp: 5, streak: 0, bestStreak: 0, history: [], linkedTaskIds: [], linkedStackId: null, doneToday: false, xpSourceToday: null },
    { id: uid("habit"), name: "مطالعه روزانه", icon: "book-open", color: "violet", xp: 10, streak: 0, bestStreak: 0, history: [], linkedTaskIds: [], linkedStackId: null, doneToday: false, xpSourceToday: null },
    { id: uid("habit"), name: "ورزش", icon: "activity", color: "emerald", xp: 15, streak: 0, bestStreak: 0, history: [], linkedTaskIds: [], linkedStackId: null, doneToday: false, xpSourceToday: null },
  ];
}

function tasksFromStacks(stacks, dateStr) {
  const out = [];
  let order = 0;
  stacks.forEach((stack) => {
    if (stack.archived) return; // archived Stacks stop generating new daily Tasks, but keep their history
    stack.taskTemplates.forEach((tpl) => {
      out.push({
        id: uid("task"),
        templateId: tpl.id,
        title: tpl.title,
        desc: "",
        categoryId: tpl.categoryId || stack.defaultCategoryId || null,
        difficulty: tpl.difficulty,
        xp: tpl.xp,
        estMinutes: tpl.estMinutes || 15,
        timeOfDay: stack.defaultTimeOfDay || "morning",
        stackId: stack.id,
        completed: false,
        subtasks: [],
        order: order++,
        createdDate: dateStr,
        // Explicit day-scope marker: this is THE day this Task belongs to, distinct
        // from any "created at" timestamp semantics. getTasksForDate() checks this
        // as a defensive guard, even though today's live `data.tasks` array is by
        // construction always fully replaced on rollover (never mixes across days).
        date: dateStr,
      });
    });
  });
  return out;
}

function defaultRewards() {
  return [
    { id: uid("reward"), name: "۳۰ دقیقه بازی", cost: 20, icon: "gamepad", color: "violet" },
    { id: uid("reward"), name: "تماشای یک فیلم", cost: 100, icon: "film", color: "sky" },
    { id: uid("reward"), name: "خرید یک چیز کوچک برای خودم", cost: 200, icon: "package", color: "amber" },
  ];
}

function makeDefaultData() {
  const today = todayStr();
  const categories = defaultCategories();
  const stacks = defaultStacks(categories, today);
  const tasks = tasksFromStacks(stacks, today);
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: {
      totalXp: 0, coinBalance: 0, coinRemainder: 0, streak: 0, bestStreak: 0, lastActiveDate: today,
      streakShields: 0, maxStreakShields: DEFAULT_MAX_SHIELDS,
    },
    todayDate: today,
    today: { xpEarned: 0, tasksCompleted: 0, tasksTotal: tasks.length, stackBonusGiven: [] },
    stacks,
    habits: defaultHabits(),
    tasks,
    categories,
    archive: {},
    rewards: defaultRewards(),
    redeemedLog: [],
    achievements: defaultAchievementState(),
    settings: {
      theme: "dark",
      homeLayout: ["level", "progress", "achievements", "stacks", "tasks"],
      homeVisible: { level: true, progress: true, achievements: true, stacks: true, tasks: true },
      weeklyXpGoal: DEFAULT_WEEKLY_XP_GOAL,
      accentColor: "amber",
      glowIntensity: "medium",
      animationEnabled: true,
      animationIntensity: "normal",
      soundEnabled: false,
      soundVolume: 60,
      minDailyXpForStreak: MIN_XP_FOR_STREAK,
      showCategoryStats: true,
      showWeeklyChart: true,
      notifications: { dailyReminder: false, streakReminder: false, levelUp: false, reward: false },
      recentIconIds: [],
      favoriteIconIds: [],
    },
    pendingStreakEvent: null,
  };
}

// Ensures data loaded from storage (possibly saved by an older version of the app)
// always has every field the current UI expects, so old saves never crash the app.
function migrateData(raw) {
  const d = raw || {};
  const defaults = makeDefaultData();
  const version = d.schemaVersion || 0;

  // Reconstruct an equivalent "net coin-eligible XP" figure from whatever shape the
  // old save used, then derive today's (coinBalance, coinRemainder) from it with the
  // exact same floored-division math applyXpToProfile uses — so the user's *current*
  // balance carries over exactly, however many schema versions they've skipped.
  let netCoinXp = 0;
  let coinsSpentLegacy = 0;
  if (version >= 4 && typeof d.profile?.coinBalance === "number") {
    netCoinXp = d.profile.coinBalance * COIN_RATIO + (d.profile.coinRemainder ?? 0);
  } else if (version === 3 && typeof d.profile?.netCoinXp === "number") {
    netCoinXp = d.profile.netCoinXp;
    coinsSpentLegacy = d.profile?.coinsSpent ?? 0;
  } else if (typeof d.profile?.coins === "number") {
    // v2 save: coins + coinRemainder
    netCoinXp = d.profile.coins * COIN_RATIO + (d.profile.coinRemainder ?? 0);
  } else if (typeof d.profile?.availableXp === "number") {
    // v1 save: raw spendable XP
    netCoinXp = d.profile.availableXp;
  }
  const coinBalance = Math.floor(netCoinXp / COIN_RATIO) - coinsSpentLegacy;
  const coinRemainder = ((netCoinXp % COIN_RATIO) + COIN_RATIO) % COIN_RATIO;

  const rewards = (d.rewards || defaults.rewards).map((r) => {
    let reward = r;
    if (version < 2) {
      // Oldest reward costs were denominated in XP — convert to Coins using the same ratio.
      reward = { ...reward, cost: Math.max(1, Math.round(reward.cost / COIN_RATIO)) };
    }
    if (version < 5) {
      // Old saves stored a raw emoji for the icon — map it onto the new icon-id system.
      reward = { ...reward, icon: resolveIconId(reward.icon), color: reward.color || "amber" };
    }
    return reward;
  });

  const habits = (d.habits || defaults.habits).map((h) => {
    const historyFixed = h.history || [];
    return {
      ...h,
      linkedTaskIds: h.linkedTaskIds ?? [],
      linkedStackId: h.linkedStackId ?? null,
      xpSourceToday: h.xpSourceToday ?? (h.autoLinked ? "auto" : null),
      icon: version < 5 ? resolveIconId(h.icon) : h.icon,
      color: h.color || "emerald",
      history: historyFixed,
      // Self-heal any streak drift from older versions' incremental +1/-1 logic —
      // history is the source of truth, so recompute against it unconditionally.
      streak: computeHabitStreak(historyFixed, d.todayDate || defaults.todayDate),
    };
  });

  // Strip a leading emoji off old-style "📚 Study" category names so the clean
  // name can be looked up against the new icon-based Category registry.
  const stripEmojiPrefix = (name) => (name || "").replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "").trim() || name;

  // Best-effort "existed since" date for Stacks saved before createdDate existed:
  // the earliest day we have any archived record for, falling back to today.
  // We can't know the true creation date, so we deliberately don't claim history
  // further back than we actually have data for.
  const archiveDates = Object.keys(d.archive || {});
  const earliestKnownDate = archiveDates.length ? archiveDates.sort()[0] : (d.todayDate || defaults.todayDate);

  const rawStacks = (d.stacks || defaults.stacks).map((s) => ({
    ...s,
    icon: version < 5 ? resolveIconId(s.icon) : s.icon,
    color: s.color || "sky",
    createdDate: s.createdDate || earliestKnownDate,
    archived: s.archived ?? false,
    // v6+ name field, kept only transiently here to resolve into an id below.
    _legacyDefaultCategoryName: version < 6 ? stripEmojiPrefix(s.defaultCategory || s.name) : null,
  }));
  const rawTasks = (d.tasks || []).map((t) => ({
    ...t,
    _legacyCategoryName: version < 6 ? stripEmojiPrefix(t.category) : null,
  }));

  // Build the Category registry: start from any saved one (v6+, id-based already),
  // then make sure every legacy category NAME still referenced by an old Stack or
  // Task gets a real registry entry — old saves (< v6) stored categories as free
  // text with no registry at all.
  let categories = d.categories && d.categories.length ? d.categories.map((c) => ({ ...c })) : defaultCategories();
  const findByName = (name) => categories.find((c) => c.name.toLowerCase() === (name || "").toLowerCase());
  const fallbackPalette = ["violet", "sky", "emerald", "rose", "amber"];
  let paletteIdx = categories.length;
  const nameToId = (name) => {
    if (!name) return null;
    let existing = findByName(name);
    if (!existing) {
      existing = { id: uid("cat"), name, iconId: DEFAULT_ICON_ID, color: fallbackPalette[paletteIdx % fallbackPalette.length] };
      categories.push(existing);
      paletteIdx++;
    }
    return existing.id;
  };

  const stacks = rawStacks.map((s) => {
    const { _legacyDefaultCategoryName, ...rest } = s;
    return {
      ...rest,
      defaultCategoryId: version < 6 ? nameToId(_legacyDefaultCategoryName) : (s.defaultCategoryId ?? null),
    };
  });
  const tasks = rawTasks.map((t) => {
    const { _legacyCategoryName, ...rest } = t;
    return {
      ...rest,
      categoryId: version < 6 ? nameToId(_legacyCategoryName) : (t.categoryId ?? null),
      // Backfill the explicit day-scope marker for tasks saved before it existed —
      // the only date we can honestly attribute them to is the day the save itself
      // was "today", since that's what the live tasks array always represented.
      date: t.date || d.todayDate || defaults.todayDate,
    };
  });

  // Guard against duplicate ids ever ending up in the registry (defensive only —
  // normal creation always uses uid(), which is already collision-safe).
  const seenIds = new Set();
  categories = categories.filter((c) => {
    if (seenIds.has(c.id)) return false;
    seenIds.add(c.id);
    return true;
  });

  return {
    ...defaults,
    ...d,
    schemaVersion: SCHEMA_VERSION,
    profile: {
      ...defaults.profile,
      ...(d.profile || {}),
      coinBalance,
      coinRemainder,
      streakShields: d.profile?.streakShields ?? 0,
      maxStreakShields: d.profile?.maxStreakShields ?? DEFAULT_MAX_SHIELDS,
    },
    today: {
      ...defaults.today,
      ...(d.today || {}),
      // v11 changes Stack Bonus from a reversible "current state" calculation
      // into a once-per-day event. For older saves, preserve the bonus as already
      // paid if the old live state shows the Stack was complete, so migration cannot
      // accidentally award that historical bonus a second time.
      stackBonusGiven: Array.isArray(d.today?.stackBonusGiven)
        ? d.today.stackBonusGiven
        : (version < 11 ? computeStackBonusSet(tasks, stacks) : []),
    },
    settings: {
      ...defaults.settings,
      ...(d.settings || {}),
      homeLayout: (() => {
        const allowed = ["level", "progress", "achievements", "stacks", "tasks"];
        const saved = Array.isArray(d.settings?.homeLayout) ? d.settings.homeLayout : [];
        const clean = saved.filter((id, i) => allowed.includes(id) && saved.indexOf(id) === i);
        return [...clean, ...allowed.filter((id) => !clean.includes(id))];
      })(),
      homeVisible: {
        level: d.settings?.homeVisible?.level ?? true,
        progress: d.settings?.homeVisible?.progress ?? true,
        achievements: d.settings?.homeVisible?.achievements ?? true,
        stacks: d.settings?.homeVisible?.stacks ?? true,
        tasks: d.settings?.homeVisible?.tasks ?? true,
      },
      weeklyXpGoal: Math.min(MAX_WEEKLY_XP_GOAL, Math.max(MIN_WEEKLY_XP_GOAL, d.settings?.weeklyXpGoal || DEFAULT_WEEKLY_XP_GOAL)),
      minDailyXpForStreak: d.settings?.minDailyXpForStreak ?? MIN_XP_FOR_STREAK,
      notifications: { ...defaults.settings.notifications, ...(d.settings?.notifications || {}) },
    },
    stacks,
    habits,
    tasks,
    categories,
    rewards,
    // Backfill any Achievement definitions that don't exist yet in an older save
    // (including "no achievements at all" for pre-v10 saves) with a locked/unseen
    // default, while leaving every already-unlocked entry completely untouched —
    // an old save's earned unlocks are permanent facts, never reset by migration.
    achievements: (() => {
      const existing = d.achievements || {};
      const merged = {};
      ACHIEVEMENT_DEFINITIONS.forEach((def) => {
        merged[def.id] = existing[def.id] || { unlocked: false, unlockedAt: null, seen: true };
      });
      return merged;
    })(),
    pendingStreakEvent: d.pendingStreakEvent ?? null,
  };
}

/* =====================================================================
   DAILY ROLLOVER — archives yesterday, regenerates today

   This IS "finalizeDay()" — each iteration of the loop below performs the
   exact 6-step sequence Data Integrity requires, in this order, for one
   finished day at a time:
     1. Finalize the day that just ended  (compute categoryStats/stackStats/
        taskWeightStats/habitStats/dailyScore from THAT day's cursor.tasks)
     2. Freeze it into an immutable archive entry (archive[finishedDate] = ...)
     3. Update streak/shields from that day's activity
     4. Generate the next day's fresh Tasks (tasksFromStacks)
     5. Reset today's live counters to zero
     6. Advance cursor.todayDate to the new day
   Steps 1-2 always happen against the OLD `cursor.tasks`, strictly before
   step 4 replaces it — so a finished day's snapshot can never see next-day
   Tasks, and next-day Tasks can never retroactively touch a frozen entry.
   ===================================================================== */

function rollDataForward(data) {
  const now = todayStr();
  if (data.todayDate === now) return data;

  let cursor = { ...data };
  // walk day by day in case app wasn't opened for a while, so streak logic stays correct
  while (cursor.todayDate !== now) {
    const finishedDate = cursor.todayDate;
    const categoryStats = {};
    cursor.tasks.forEach((t) => {
      const cat = t.categoryId || "__none__";
      if (!categoryStats[cat]) categoryStats[cat] = { total: 0, completed: 0, plannedXp: 0, completedXp: 0 };
      categoryStats[cat].total += 1;
      categoryStats[cat].plannedXp += t.xp;
      if (t.completed) {
        categoryStats[cat].completed += 1;
        categoryStats[cat].completedXp += t.xp;
      }
    });

    // Per-Stack completion snapshot for this finished day — frozen into `archive`
    // right here, alongside categoryStats, and never recomputed afterward. This is
    // what the Stack Progress chart reads for every day except "today" (which is
    // computed live instead). Only Stacks that actually had a Task that day get an
    // entry, so "Stack existed but had 0 tasks" and "Stack didn't exist yet" both
    // correctly read as missing/null rather than a fabricated 0%.
    const stackStats = {};
    cursor.tasks.forEach((t) => {
      if (!t.stackId) return;
      if (!stackStats[t.stackId]) stackStats[t.stackId] = { total: 0, completed: 0 };
      stackStats[t.stackId].total += 1;
      if (t.completed) stackStats[t.stackId].completed += 1;
    });

    // Daily Activity = at least one completed task, OR at least one completed habit,
    // OR earning at least settings.minDailyXpForStreak XP that day (user-configurable).
    const minXpForStreak = cursor.settings?.minDailyXpForStreak ?? MIN_XP_FOR_STREAK;
    const hadTaskActivity = cursor.today.tasksCompleted > 0;
    const hadHabitActivity = cursor.habits.some((h) => h.history.includes(finishedDate));
    const xpThresholdMet = cursor.today.xpEarned >= minXpForStreak;
    const hadActivity = hadTaskActivity || hadHabitActivity || xpThresholdMet;

    const maxShields = cursor.profile.maxStreakShields ?? DEFAULT_MAX_SHIELDS;
    let newStreak = cursor.profile.streak;
    let newShields = cursor.profile.streakShields ?? 0;
    let streakEvent = null;

    if (hadActivity) {
      newStreak = cursor.profile.streak + 1;
      if (newStreak % SHIELD_EARN_INTERVAL === 0 && newShields < maxShields) {
        newShields += 1;
      }
    } else if (newShields > 0) {
      // No activity, but a Streak Shield absorbs the miss — streak survives.
      newShields -= 1;
      streakEvent = { type: "saved", date: finishedDate };
    } else {
      if (cursor.profile.streak > 0) streakEvent = { type: "broken", date: finishedDate };
      newStreak = 0;
    }

    // Task Completion Score input — weighted by difficulty (see TASK_WEIGHTS),
    // so a hard Task pulls more fairness-weight than a trivial one.
    const taskWeightStats = { totalWeight: 0, completedWeight: 0 };
    cursor.tasks.forEach((t) => {
      const w = taskWeight(t.difficulty);
      taskWeightStats.totalWeight += w;
      if (t.completed) taskWeightStats.completedWeight += w;
    });

    // Stack Completion Score input — only Stacks that actually had a Task that
    // day contribute a percentage; a Stack with 0 tasks that day is simply
    // absent from the average rather than dragging it down as a fake 0%.
    const stackCompletionsToday = Object.values(stackStats)
      .filter((s) => s.total > 0)
      .map((s) => (s.completed / s.total) * 100);

    // Habit Consistency Score input — how many of today's Habits (as they existed
    // right now, at freeze time) were completed, manually or via auto-link.
    const habitStats = {
      total: cursor.habits.length,
      completed: cursor.habits.filter((h) => h.doneToday).length,
    };

    // Daily Score is computed ONCE, right here, from these frozen inputs, and
    // stored directly on the archive entry — it is never recalculated later even
    // if the scoring formula changes in a future version, so a day's score is a
    // permanent historical fact, not a live-recomputed value.
    const dailyScore = computeDailyScore({ taskWeightStats, stackCompletions: stackCompletionsToday, habitStats });

    const archiveEntry = {
      xpEarned: cursor.today.xpEarned,
      tasksCompleted: cursor.today.tasksCompleted,
      tasksTotal: cursor.today.tasksTotal,
      categoryStats,
      stackStats,
      taskWeightStats,
      habitStats,
      dailyScore,
      // Explicit, permanent record of which Stacks actually claimed their +XP
      // completion Bonus THIS day (stackId + date is the real key, since this
      // array lives inside this one day's frozen entry) — this is the "Bonus is
      // an EVENT" record: it's captured directly from the live `stackBonusGiven`
      // tracker at the moment the day closes, not re-derived later from
      // stackStats (which would just be an inference, not a stored fact).
      stackBonusStackIds: cursor.today.stackBonusGiven,
      // Snapshot of lifetime XP as of the end of this day — this is what makes the
      // XP Growth chart genuinely cumulative without recomputing sums across the
      // whole archive every render.
      cumulativeXp: cursor.profile.totalXp,
    };
    const nextDate = addDaysStr(finishedDate, 1);
    const newTasks = tasksFromStacks(cursor.stacks, nextDate);

    cursor = {
      ...cursor,
      todayDate: nextDate,
      archive: { ...cursor.archive, [finishedDate]: archiveEntry },
      profile: {
        ...cursor.profile,
        streak: newStreak,
        bestStreak: Math.max(cursor.profile.bestStreak, newStreak),
        lastActiveDate: nextDate,
        streakShields: newShields,
        maxStreakShields: maxShields,
      },
      today: { xpEarned: 0, tasksCompleted: 0, tasksTotal: newTasks.length, stackBonusGiven: [] },
      tasks: newTasks,
      habits: cursor.habits.map((h) => ({
        ...h,
        doneToday: false,
        xpSourceToday: null,
        // Recomputed fresh against the new day: if a day was skipped entirely with
        // no completion, the streak correctly falls back to 0 here rather than
        // silently staying at its old value until the next manual interaction.
        streak: computeHabitStreak(h.history, nextDate),
      })),
      pendingStreakEvent: streakEvent || cursor.pendingStreakEvent || null,
    };
  }
  return cursor;
}

/* =====================================================================
   SMALL UI ATOMS
   ===================================================================== */

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

// Small reusable color-swatch row used anywhere a Category/Stack/Habit/Reward
// picks its accent color (independent from the app-wide theme accent).
function ColorSwatchPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {CATEGORY_COLORS.filter((c) => c !== "orange").map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            `bg-${c}-400`,
            "w-7 h-7 rounded-full border-2 transition-transform",
            value === c ? "border-white scale-110" : "border-transparent"
          )}
          aria-label={c}
        />
      ))}
    </div>
  );
}

function ProgressBar({ percent, colorClass = "bg-amber-400", trackClass, heightClass = "h-2.5" }) {
  return (
    <div className={cn("w-full rounded-full overflow-hidden", heightClass, trackClass)}>
      <div
        className={cn("h-full rounded-full transition-all duration-700 ease-out", colorClass)}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  );
}

function CircularProgress({ percent, size = 96, stroke = 9, trackColor, barColor, label, sub, celebrate }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(percent), 60);
    return () => clearTimeout(t);
  }, [percent]);
  const offset = c - (Math.max(0, Math.min(100, animated)) / 100) * c;
  return (
    <div className={cn("relative", celebrate && "cp-celebrate")} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" stroke="currentColor" className={trackColor} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={cn(barColor, "transition-all duration-700 ease-out")}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold">{label}</span>
        {sub && <span className="text-[10px] opacity-70">{sub}</span>}
      </div>
      <style>{`
        @keyframes cpCelebrate { 0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(52,211,153,0)); } 35% { transform: scale(1.08); filter: drop-shadow(0 0 10px rgba(52,211,153,0.65)); } 100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(52,211,153,0)); } }
        .cp-celebrate { animation: cpCelebrate 0.7s ease-out; }
      `}</style>
    </div>
  );
}

function HexBadge({ level, size = 60, theme, pulse = false }) {
  const clip = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
  const innerInset = Math.max(3, Math.round(size * 0.09));
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (pulse) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 550);
      return () => clearTimeout(t);
    }
  }, [pulse]);
  return (
    <div className={cn("relative shrink-0", pulse && "hex-pulse")} style={{ width: size, height: size }}>
      {/* outer hex — bright edge / border */}
      <div className="absolute inset-0" style={{ clipPath: clip, background: theme.hexOuterGradient, boxShadow: theme.hexGlow }} />
      {/* inner hex — main fill */}
      <div className="absolute" style={{ inset: innerInset, clipPath: clip, background: theme.hexGradient }} />
      {/* inner highlight for depth */}
      <div
        className="absolute pointer-events-none"
        style={{ inset: innerInset, clipPath: clip, background: "linear-gradient(155deg, rgba(255,255,255,0.5), transparent 55%)", opacity: 0.8 }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-extrabold text-white"
          style={{ fontSize: Math.max(14, Math.round(size * 0.36)), textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
        >
          {level}
        </span>
      </div>
      {flash && (
        <div className="absolute pointer-events-none hex-flash" style={{ inset: innerInset, clipPath: clip, background: "white" }} />
      )}
      <style>{`
        @keyframes hexPulse { 0% { transform: scale(1); filter: brightness(1); } 40% { transform: scale(1.25); filter: brightness(1.45); } 100% { transform: scale(1); filter: brightness(1); } }
        .hex-pulse { animation: hexPulse 0.9s ease-out; }
        @keyframes hexFlash { 0% { opacity: 0.85; } 100% { opacity: 0; } }
        .hex-flash { animation: hexFlash 0.55s ease-out forwards; }
      `}</style>
    </div>
  );
}

function Modal({ title, onClose, children, theme }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={cn(
          "w-full sm:max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 border",
          theme.surface,
          theme.border
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn("text-base font-bold", theme.text)}>{title}</h3>
          <button onClick={onClose} className={cn("p-1.5 rounded-full", theme.subtleBg)}>
            <X size={18} className={theme.textMuted} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ icon, children, theme, right }) {
  return (
    <div className="flex items-center justify-between mb-2.5 px-0.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <h2 className={cn("text-sm font-bold tracking-tight", theme.text)}>{children}</h2>
      </div>
      {right}
    </div>
  );
}

/* =====================================================================
   LEVEL / XP HEADER
   ===================================================================== */

function LevelHeader({ profile, theme, isDark, onToggleTheme, celebrate, coins, onOpenSettings }) {
  const info = levelInfo(profile.totalXp);
  const shields = profile.streakShields ?? 0;
  const maxShields = profile.maxStreakShields ?? DEFAULT_MAX_SHIELDS;
  const isDebt = coins < 0;
  return (
    <div className={cn("rounded-3xl p-4 border relative overflow-hidden", theme.cardPrimary, theme.border)}>
      <div
        className="absolute inset-0 opacity-[0.12] pointer-events-none"
        style={{ background: theme.headerGlow }}
      />
      <div className="relative flex items-center justify-end gap-1.5 mb-2">
        <button
          onClick={onToggleTheme}
          className={cn("p-1.5 rounded-full", theme.subtleBg)}
          aria-label="toggle theme"
        >
          {isDark ? <Sun size={13} className="text-amber-300" /> : <Moon size={13} className="text-indigo-500" />}
        </button>
        <button
          onClick={onOpenSettings}
          className={cn("p-1.5 rounded-full", theme.subtleBg)}
          aria-label="settings"
        >
          <Settings size={13} className={theme.textMuted} />
        </button>
      </div>

      <div className="relative flex items-center gap-2.5 justify-between">
        <div className="flex items-center gap-2.5">
          <HexBadge level={info.level} size={54} theme={theme} pulse={celebrate} />
          <span className={cn("text-base font-extrabold tracking-tight", theme.text)}>LEVEL {info.level}</span>
        </div>
        <span key={coins} className={cn("flex items-center gap-1 text-xs font-extrabold xp-bump", isDebt ? "text-rose-400" : theme.accentText)}>
          <Coins size={13} />{coins}
        </span>
      </div>

      <div className="relative mt-3">
        <div className="flex items-baseline justify-between gap-2">
          <span key={info.xpIntoLevel} className={cn("text-sm font-extrabold xp-bump", theme.text)}>
            {info.xpIntoLevel} / {info.xpNeeded} XP
          </span>
          <span className={cn("text-[10px] font-semibold shrink-0", theme.textMuted)}>{info.percent}%</span>
        </div>
        <div className="mt-1.5">
          <ProgressBar percent={info.percent} colorClass={theme.xpBarColor} trackClass={theme.trackBg} heightClass="h-2" />
        </div>
        <div className="text-center mt-1.5">
          <span className={cn("text-[8.5px] font-bold tracking-[0.25em]", theme.textMuted)}>NEXT LEVEL</span>
        </div>
      </div>

      <div className={cn("relative flex items-center justify-between mt-3 pt-2.5 border-t", theme.border)}>
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-orange-400">
          <Flame size={12} className="fill-orange-400" /> {profile.streak} DAY STREAK
        </span>
        {maxShields > 0 && (
          <span key={shields} className={cn("flex items-center gap-1 text-[11px] font-bold shield-pulse", theme.textMuted)}>
            <Shield size={12} />{shields}/{maxShields}
          </span>
        )}
      </div>
    </div>
  );
}

function LevelUpOverlay({ level, onClose, theme }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="flex flex-col items-center gap-3 animate-[pop_0.4s_ease-out]">
        <div className="relative">
          <Sparkles size={40} className="text-amber-300 absolute -top-6 -left-8 animate-pulse" />
          <Sparkles size={28} className="text-violet-300 absolute -top-2 -right-8 animate-pulse" />
          <HexBadge level={level} size={110} pulse theme={theme} />
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Level Up!</h2>
        <p className="text-white/70 text-sm">به سطح {level} رسیدی</p>
        <button className="mt-2 px-5 py-2 rounded-full bg-white/10 text-white text-sm font-semibold border border-white/20">
          ادامه
        </button>
      </div>
      <style>{`@keyframes pop{0%{transform:scale(0.6);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}`}</style>
    </div>
  );
}

function ToggleSwitch({ on, onChange, theme, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cn(
        "w-10 h-6 rounded-full relative transition-colors shrink-0",
        disabled ? theme.subtleBg : on ? theme.accentBg : theme.subtleBg,
        disabled && "opacity-40"
      )}
    >
      <span
        className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all", on ? "right-0.5" : "right-4.5")}
        style={{ right: on ? 2 : 18 }}
      />
    </button>
  );
}

function SegmentedControl({ options, value, onChange, theme }) {
  return (
    <div className={cn("flex items-center rounded-xl p-1 gap-1", theme.subtleBg)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-colors",
            value === opt.value ? cn(theme.accentBg, "text-slate-900") : theme.textMuted
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SettingsRow({ icon, label, sub, onClick, theme, right }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn("w-full flex items-center gap-3 p-3.5 rounded-2xl border text-right", theme.cardSecondary, theme.border, !onClick && "cursor-default")}
    >
      <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", theme.subtleBg)}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className={cn("text-sm font-bold", theme.text)}>{label}</div>
        {sub && <div className={cn("text-[10.5px] mt-0.5", theme.textMuted)}>{sub}</div>}
      </div>
      {right || (onClick && <ChevronLeft size={16} className={theme.textMuted} />)}
    </button>
  );
}

function SettingsSectionHeader({ title, onBack, theme }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <button onClick={onBack} className={cn("p-1.5 rounded-full", theme.subtleBg)}>
        <ChevronLeft size={15} className={theme.textMuted} style={{ transform: "rotate(180deg)" }} />
      </button>
      <h3 className={cn("text-sm font-extrabold", theme.text)}>{title}</h3>
    </div>
  );
}

// Shared destructive-action confirmation. Used for Delete Stack, Delete a
// completed Task, and Delete Reward — anywhere a tap could silently destroy
// progress the user cares about.
function ConfirmModal({ theme, title, body, confirmLabel = "حذف", onCancel, onConfirm }) {
  return (
    <Modal title={title} onClose={onCancel} theme={theme}>
      <div className="flex flex-col gap-3">
        <div className={cn("rounded-xl p-3 border flex items-start gap-2", "border-rose-400/30 bg-rose-400/5")}>
          <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
          <p className={cn("text-xs leading-relaxed", theme.text)}>{body}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className={cn("flex-1 py-2.5 rounded-xl text-sm font-bold", theme.subtleBg, theme.text)}>لغو</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-extrabold bg-rose-500 text-white">{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}

function SettingsModal({ theme, data, onClose, onReset, onUpdateSettings, onExport, onImportFile }) {
  const [section, setSection] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const settings = data.settings;
  const fileInputRef = useRef(null);

  const menu = [
    { key: "home", icon: <Sliders size={16} className={theme.accentText} />, label: "صفحه اصلی", sub: "نمایش و ترتیب بخش‌های خانه" },
    { key: "appearance", icon: <Palette size={16} className={theme.accentText} />, label: "ظاهر", sub: "تم، رنگ اصلی، درخشش، انیمیشن" },
    { key: "notifications", icon: <Bell size={16} className="text-sky-400" />, label: "اعلان‌ها", sub: "یادآورها (به‌زودی فعال می‌شوند)" },
    { key: "experience", icon: <Sliders size={16} className="text-violet-400" />, label: "تجربه", sub: "صدا (به‌زودی)" },
    { key: "stats", icon: <BarChart3 size={16} className="text-emerald-400" />, label: "آمار", sub: "هدف هفتگی، نمایش بخش‌ها" },
    { key: "streak", icon: <Flame size={16} className="text-orange-400" />, label: "Streak", sub: "حداقل XP روزانه" },
    { key: "data", icon: <Package size={16} className="text-rose-400" />, label: "داده‌ها", sub: "خروجی، ورودی، بازنشانی" },
    { key: "about", icon: <Info size={16} className={theme.textMuted} />, label: "درباره برنامه" },
  ];

  if (confirming) {
    return (
      <Modal title="بازنشانی همه پیشرفت‌ها" onClose={() => setConfirming(false)} theme={theme}>
        <div className="flex flex-col gap-3">
          <div className={cn("rounded-xl p-3 border flex items-start gap-2", "border-rose-400/30 bg-rose-400/5")}>
            <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <p className={cn("text-xs leading-relaxed", theme.text)}>
              Level، XP، Coins، Taskها، Habitها، آمار و Rewardها — همه برای همیشه حذف خواهند شد. این کار قابل بازگشت نیست.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setConfirming(false)} className={cn("flex-1 py-2.5 rounded-xl text-sm font-bold", theme.subtleBg, theme.text)}>
              لغو
            </button>
            <button onClick={onReset} className="flex-1 py-2.5 rounded-xl text-sm font-extrabold bg-rose-500 text-white">
              بازنشانی
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  if (section === "home") {
    const labels = { level: "Level / Profile", progress: "پیشرفت امروز", achievements: "Achievements", stacks: "Daily Stacks", tasks: "کارهای امروز" };
    const icons = { level: <Crown size={15} className={theme.accentText} />, progress: <Target size={15} className="text-emerald-400" />, achievements: <Trophy size={15} className="text-amber-400" />, stacks: <Layers size={15} className="text-violet-400" />, tasks: <ListChecks size={15} className="text-sky-400" /> };
    const layout = data.settings?.homeLayout || ["level", "progress", "achievements", "stacks", "tasks"];
    const visible = data.settings?.homeVisible || {};
    const move = (id, dir) => {
      const idx = layout.indexOf(id);
      const nextIdx = idx + dir;
      if (idx < 0 || nextIdx < 0 || nextIdx >= layout.length) return;
      const next = [...layout];
      [next[idx], next[nextIdx]] = [next[nextIdx], next[idx]];
      onUpdateSettings({ homeLayout: next });
    };
    const toggle = (id) => onUpdateSettings({ homeVisible: { ...visible, [id]: !(visible[id] ?? true) } });
    return (
      <Modal title="تنظیمات" onClose={onClose} theme={theme}>
        <SettingsSectionHeader title="صفحه اصلی" onBack={() => setSection(null)} theme={theme} />
        <p className={cn("text-[10.5px] leading-relaxed mt-1 mb-3", theme.textMuted)}>بخش‌های خانه را مخفی/نمایش بده و ترتیبشان را تغییر بده. این فقط یک تنظیم ظاهری است و روی Taskها، XP یا تاریخچه اثری ندارد.</p>
        <div className="flex flex-col gap-2">
          {layout.map((id, idx) => (
            <div key={id} className={cn("flex items-center gap-2 p-2.5 rounded-xl border", theme.border, theme.subtleBg)}>
              <span className="shrink-0">{icons[id]}</span>
              <span className={cn("flex-1 text-xs font-semibold", theme.text)}>{labels[id]}</span>
              <button type="button" onClick={() => move(id, -1)} disabled={idx === 0} className={cn("p-1.5 rounded-lg", theme.subtleBg, idx === 0 ? "opacity-25" : theme.textMuted)} aria-label="بالاتر"><ArrowUp size={13} /></button>
              <button type="button" onClick={() => move(id, 1)} disabled={idx === layout.length - 1} className={cn("p-1.5 rounded-lg", theme.subtleBg, idx === layout.length - 1 ? "opacity-25" : theme.textMuted)} aria-label="پایین‌تر"><ArrowDown size={13} /></button>
              <ToggleSwitch on={visible[id] ?? true} onChange={() => toggle(id)} theme={theme} />
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onUpdateSettings({ homeLayout: ["level", "progress", "achievements", "stacks", "tasks"], homeVisible: { level: true, progress: true, achievements: true, stacks: true, tasks: true } })} className={cn("w-full mt-3 py-2.5 rounded-xl text-xs font-bold", theme.subtleBg, theme.text)}>بازگردانی چیدمان پیش‌فرض</button>
      </Modal>
    );
  }

  if (section === "appearance") {
    return (
      <Modal title="تنظیمات" onClose={onClose} theme={theme}>
        <SettingsSectionHeader title="ظاهر" onBack={() => setSection(null)} theme={theme} />
        <div className="flex flex-col gap-4 mt-2">
          <Field label="Theme" theme={theme}>
            <SegmentedControl
              theme={theme}
              value={settings.theme}
              onChange={(v) => onUpdateSettings({ theme: v })}
              options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }]}
            />
          </Field>
          <Field label="Accent Color" theme={theme}>
            <ColorSwatchPicker value={settings.accentColor} onChange={(c) => onUpdateSettings({ accentColor: c })} />
          </Field>
          <Field label="Glow Intensity" theme={theme}>
            <SegmentedControl
              theme={theme}
              value={settings.glowIntensity}
              onChange={(v) => onUpdateSettings({ glowIntensity: v })}
              options={[{ value: "off", label: "Off" }, { value: "low", label: "Low" }, { value: "medium", label: "Med" }, { value: "high", label: "High" }]}
            />
          </Field>
          <Field label="Animation" theme={theme}>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className={cn("text-xs", theme.textMuted)}>فعال</span>
                <ToggleSwitch on={settings.animationEnabled} onChange={(v) => onUpdateSettings({ animationEnabled: v })} theme={theme} />
              </div>
              <SegmentedControl
                theme={theme}
                value={settings.animationIntensity}
                onChange={(v) => onUpdateSettings({ animationIntensity: v })}
                options={[{ value: "subtle", label: "Subtle" }, { value: "normal", label: "Normal" }, { value: "expressive", label: "Expressive" }]}
              />
            </div>
          </Field>
        </div>
      </Modal>
    );
  }

  if (section === "notifications") {
    const notifs = settings.notifications || {};
    const rows = [
      { key: "dailyReminder", label: "یادآوری روزانه" },
      { key: "streakReminder", label: "یادآوری Streak" },
      { key: "levelUp", label: "Level Up" },
      { key: "reward", label: "Reward" },
    ];
    return (
      <Modal title="تنظیمات" onClose={onClose} theme={theme}>
        <SettingsSectionHeader title="اعلان‌ها" onBack={() => setSection(null)} theme={theme} />
        <p className={cn("text-[10.5px] leading-relaxed mt-1 mb-3", theme.textMuted)}>
          این محیط هنوز امکان ارسال Notification واقعی ندارد. ترجیح تو ذخیره می‌شود و به‌محض اضافه‌شدن این قابلیت، فعال می‌شود.
        </p>
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <div key={r.key} className={cn("flex items-center justify-between p-3 rounded-xl border", theme.border, theme.subtleBg)}>
              <span className={cn("text-xs font-semibold", theme.text)}>{r.label}</span>
              <ToggleSwitch on={!!notifs[r.key]} onChange={(v) => onUpdateSettings({ notifications: { ...notifs, [r.key]: v } })} theme={theme} />
            </div>
          ))}
        </div>
      </Modal>
    );
  }

  if (section === "experience") {
    return (
      <Modal title="تنظیمات" onClose={onClose} theme={theme}>
        <SettingsSectionHeader title="تجربه" onBack={() => setSection(null)} theme={theme} />
        <div className="flex flex-col gap-3 mt-2">
          <div className={cn("flex items-center justify-between p-3 rounded-xl border", theme.border, theme.subtleBg)}>
            <div>
              <div className={cn("text-xs font-semibold", theme.text)}>Sound Effects</div>
              <div className={cn("text-[10px] mt-0.5", theme.textMuted)}>به‌زودی — این محیط هنوز پخش صدا ندارد</div>
            </div>
            <ToggleSwitch on={false} disabled theme={theme} onChange={() => {}} />
          </div>
          <Field label="Volume" theme={theme}>
            <input type="range" min={0} max={100} value={settings.soundVolume} disabled className="w-full opacity-40" />
          </Field>
        </div>
      </Modal>
    );
  }

  if (section === "stats") {
    return (
      <Modal title="تنظیمات" onClose={onClose} theme={theme}>
        <SettingsSectionHeader title="آمار" onBack={() => setSection(null)} theme={theme} />
        <div className="flex flex-col gap-3 mt-2">
          <Field label="Weekly XP Goal" theme={theme}>
            <input
              type="number"
              min={MIN_WEEKLY_XP_GOAL}
              max={MAX_WEEKLY_XP_GOAL}
              defaultValue={settings.weeklyXpGoal}
              onBlur={(e) => onUpdateSettings({ weeklyXpGoal: Number(e.target.value) })}
              className={cn("w-full text-sm rounded-xl px-3 py-2 border outline-none", theme.inputBg, theme.border, theme.text)}
            />
          </Field>
          <div className={cn("flex items-center justify-between p-3 rounded-xl border", theme.border, theme.subtleBg)}>
            <span className={cn("text-xs font-semibold", theme.text)}>Show Category Statistics</span>
            <ToggleSwitch on={settings.showCategoryStats} onChange={(v) => onUpdateSettings({ showCategoryStats: v })} theme={theme} />
          </div>
          <div className={cn("flex items-center justify-between p-3 rounded-xl border", theme.border, theme.subtleBg)}>
            <span className={cn("text-xs font-semibold", theme.text)}>Show Weekly Chart</span>
            <ToggleSwitch on={settings.showWeeklyChart} onChange={(v) => onUpdateSettings({ showWeeklyChart: v })} theme={theme} />
          </div>
        </div>
      </Modal>
    );
  }

  if (section === "streak") {
    return (
      <Modal title="تنظیمات" onClose={onClose} theme={theme}>
        <SettingsSectionHeader title="Streak" onBack={() => setSection(null)} theme={theme} />
        <div className="flex flex-col gap-3 mt-2">
          <Field label="Minimum Daily XP" theme={theme}>
            <input
              type="number"
              min={0}
              defaultValue={settings.minDailyXpForStreak}
              onBlur={(e) => onUpdateSettings({ minDailyXpForStreak: Math.max(0, Number(e.target.value) || 0) })}
              className={cn("w-full text-sm rounded-xl px-3 py-2 border outline-none", theme.inputBg, theme.border, theme.text)}
            />
          </Field>
          <p className={cn("text-[10.5px] leading-relaxed", theme.textMuted)}>
            حداقل XP لازم برای حفظ Streak در روزهایی که Task/Habit تکمیل نشده است.
          </p>
        </div>
      </Modal>
    );
  }

  if (section === "data") {
    return (
      <Modal title="تنظیمات" onClose={onClose} theme={theme}>
        <SettingsSectionHeader title="داده‌ها" onBack={() => setSection(null)} theme={theme} />
        <div className="flex flex-col gap-2.5 mt-2">
          <button onClick={onExport} className={cn("flex items-center gap-2 p-3 rounded-xl border text-sm font-bold", theme.border, theme.subtleBg, theme.text)}>
            <Download size={15} className={theme.accentText} /> Export Data
          </button>
          <button onClick={() => fileInputRef.current?.click()} className={cn("flex items-center gap-2 p-3 rounded-xl border text-sm font-bold", theme.border, theme.subtleBg, theme.text)}>
            <Upload size={15} className="text-sky-400" /> Import Data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const result = onImportFile(reader.result);
                setImportMsg(result.ok ? "داده با موفقیت وارد شد." : result.error || "فایل معتبر نیست.");
              };
              reader.readAsText(file);
              e.target.value = "";
            }}
          />
          {importMsg && <p className={cn("text-[11px]", theme.textMuted)}>{importMsg}</p>}
          <button onClick={() => setConfirming(true)} className="flex items-center gap-2 p-3 rounded-xl border border-rose-400/40 text-sm font-bold text-rose-400">
            <RotateCcw size={15} /> Reset All Data
          </button>
        </div>
      </Modal>
    );
  }

  if (section === "about") {
    return (
      <Modal title="تنظیمات" onClose={onClose} theme={theme}>
        <SettingsSectionHeader title="درباره برنامه" onBack={() => setSection(null)} theme={theme} />
        <div className="flex flex-col items-center text-center gap-2 mt-4 pb-2">
          <HexBadge level={0} size={56} theme={theme} />
          <h4 className={cn("text-base font-extrabold mt-1", theme.text)}>Daily Quest</h4>
          <span className={cn("text-[11px] font-bold tracking-wide", theme.accentText)}>Personal Productivity RPG</span>
          <span className={cn("text-[10.5px]", theme.textMuted)}>Version 1.0</span>
          <p className={cn("text-xs leading-relaxed mt-3 max-w-xs", theme.textMuted)}>
            کارهای روزانه‌ات را به Questهای کوچک تبدیل کن و هر روز کمی جلوتر برو.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="تنظیمات" onClose={onClose} theme={theme}>
      <div className="flex flex-col gap-2">
        {menu.map((m) => (
          <SettingsRow key={m.key} icon={m.icon} label={m.label} sub={m.sub} onClick={() => setSection(m.key)} theme={theme} />
        ))}
      </div>
    </Modal>
  );
}

function TopToast({ toast, onDone, theme }) {
  const [phase, setPhase] = useState("in");
  useEffect(() => {
    if (!toast) return;
    setPhase("in");
    const t1 = setTimeout(() => setPhase("out"), 2200);
    const t2 = setTimeout(() => onDone(), 2200 + 320);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [toast]);

  if (!toast) return null;
  return (
    <div className="fixed top-3 inset-x-0 z-[70] flex justify-center px-4 pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto max-w-sm w-full rounded-2xl border p-3.5 flex items-center gap-3 backdrop-blur-md",
          theme.surfaceStrong,
          theme.border,
          phase === "in" ? "toast-in" : "toast-out"
        )}
        style={{ boxShadow: "0 10px 34px rgba(0,0,0,0.28)" }}
      >
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", theme.accentSoftBg)}>
          <IconGlyph id={toast.icon} size={19} className={theme.accentText} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn("text-[10.5px] font-extrabold tracking-wide", theme.accentText)}>{toast.title}</div>
          <div className={cn("text-sm font-bold truncate", theme.text)}>{toast.subtitle}</div>
          {toast.meta && <div className={cn("text-[11px] font-semibold", theme.textMuted)}>{toast.meta}</div>}
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   TODAY PROGRESS
   ===================================================================== */

function TodayProgress({ data, theme }) {
  // Daily Score is now the headline number here (0-100, independent from XP) —
  // Tasks/Stacks/Streak/XP are all shown as supporting detail underneath, never
  // folded into the ring itself. A Task that auto-completes a linked Habit is one
  // activity, not two, so Habits don't get double-counted into any of these numbers.
  const today = data.today;
  const snapshot = getDailySnapshot(data, data.todayDate);
  const score = snapshot?.dailyScore ?? null;
  const isComplete = score != null && score >= 100;

  const stackStatsToday = snapshot?.stackStats || {};
  const activeStackCount = Object.keys(stackStatsToday).length;
  const completedStackCount = Object.values(stackStatsToday).filter((s) => s.total > 0 && s.completed === s.total).length;

  return (
    <div className={cn("rounded-3xl p-5 border flex flex-col items-center gap-3", theme.cardPrimary, theme.border)}>
      <span className={cn("text-[11px] font-bold tracking-[0.2em]", theme.textMuted)}>TODAY'S PROGRESS</span>
      <CircularProgress
        percent={score ?? 0}
        size={128}
        stroke={10}
        label={score != null ? `${score}` : "—"}
        sub={score != null ? "/ 100" : undefined}
        trackColor={theme.ringTrack}
        barColor={theme.ringBar}
        celebrate={isComplete}
      />
      <div className="flex flex-col items-center gap-1">
        <span className={cn("text-[10px] font-bold tracking-wide", theme.textMuted)}>DAILY SCORE</span>
        <div className="flex items-center gap-3 mt-1">
          <span className={cn("text-sm font-bold", theme.text)}>{today.tasksCompleted} / {today.tasksTotal} Tasks</span>
          <span className={cn("text-sm font-bold", theme.text)}>{completedStackCount} / {activeStackCount} Stacks</span>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-bold text-orange-400 mt-0.5">
          <Flame size={12} className="fill-orange-400" /> {data.profile.streak} Day Streak
        </span>
        <span key={today.xpEarned} className={cn("text-sm font-bold mt-1 xp-bump", theme.accentText)}>+{today.xpEarned} XP Today</span>
      </div>
    </div>
  );
}

/* =====================================================================
   ACHIEVEMENTS — compact Home card + full list modal (UI layer only;
   all logic lives in the Achievement Service above)
   ===================================================================== */

function AchievementsCard({ data, theme, onOpen }) {
  const achievements = data.achievements || {};
  const unlockedCount = ACHIEVEMENT_DEFINITIONS.filter((def) => achievements[def.id]?.unlocked).length;
  const unseenCount = ACHIEVEMENT_DEFINITIONS.filter((def) => achievements[def.id]?.unlocked && !achievements[def.id]?.seen).length;
  const previewDefs = ACHIEVEMENT_DEFINITIONS.slice(0, 6);

  return (
    <button
      onClick={onOpen}
      className={cn("rounded-2xl p-3.5 border w-full text-right flex items-center gap-3", theme.cardSecondary, theme.border)}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative", theme.accentSoftBg)}>
        <IconGlyph id="crown" size={18} className={theme.accentText} />
        {unseenCount > 0 && (
          <span className="absolute -top-1 -left-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center">
            {unseenCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("text-sm font-bold", theme.text)}>Achievements</div>
        <div className={cn("text-[10.5px]", theme.textMuted)}>{unlockedCount} / {ACHIEVEMENT_DEFINITIONS.length} Unlocked</div>
      </div>
      <div className="flex items-center -space-x-1.5 rtl:space-x-reverse shrink-0">
        {previewDefs.map((def) => {
          const unlocked = !!achievements[def.id]?.unlocked;
          return (
            <span
              key={def.id}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center border-2",
                theme.cardSecondary,
                unlocked ? theme.accentBorder : theme.border
              )}
            >
              <IconGlyph id={def.icon} size={11} className={unlocked ? theme.accentText : theme.textMuted} />
            </span>
          );
        })}
      </div>
      <ChevronLeft size={15} className={cn(theme.textMuted, "shrink-0")} style={{ transform: "rotate(180deg)" }} />
    </button>
  );
}

function AchievementRow({ def, state, theme, metrics }) {
  const unlocked = !!state?.unlocked;
  const progress = Math.min(getAchievementProgress(def, metrics), def.requirement);
  const percent = def.requirement > 0 ? Math.round((progress / def.requirement) * 100) : 0;

  return (
    <div className={cn("rounded-2xl p-3 border flex items-center gap-3", theme.cardSmall, theme.border, !unlocked && "opacity-70")}>
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", unlocked ? theme.accentSoftBg : theme.subtleBg)}>
        <IconGlyph id={def.icon} size={19} className={unlocked ? theme.accentText : theme.textMuted} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-sm font-bold truncate", theme.text)}>{def.title}</span>
          {unlocked ? (
            <span className="flex items-center gap-1 text-[10.5px] font-extrabold text-emerald-400 shrink-0">
              <Check size={11} /> Completed
            </span>
          ) : (
            <span className={cn("text-[10.5px] font-semibold shrink-0", theme.textMuted)}>{progress} / {def.requirement}</span>
          )}
        </div>
        <p className={cn("text-[11px] mt-0.5", theme.textMuted)}>{def.description}</p>
        {unlocked ? (
          state?.unlockedAt && (
            <p className={cn("text-[10px] mt-1", theme.textMuted)}>
              {new Date(state.unlockedAt + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )
        ) : (
          <div className="mt-1.5">
            <ProgressBar percent={percent} colorClass={theme.accentBg} trackClass={theme.trackBg} heightClass="h-1.5" />
          </div>
        )}
      </div>
    </div>
  );
}

function AchievementsModal({ data, theme, onClose }) {
  const [category, setCategory] = useState("all");
  const achievements = data.achievements || {};
  const metrics = useMemo(() => computeAchievementMetrics(data), [data]);

  const defs = category === "all" ? ACHIEVEMENT_DEFINITIONS : ACHIEVEMENT_DEFINITIONS.filter((d) => d.category === category);
  const unlockedDefs = defs.filter((d) => achievements[d.id]?.unlocked);
  const lockedDefs = defs.filter((d) => !achievements[d.id]?.unlocked);
  const unlockedCount = ACHIEVEMENT_DEFINITIONS.filter((d) => achievements[d.id]?.unlocked).length;

  return (
    <Modal title="Achievements" onClose={onClose} theme={theme}>
      <div className="flex flex-col gap-3">
        <div className={cn("text-center text-xs font-bold", theme.textMuted)}>
          {unlockedCount} / {ACHIEVEMENT_DEFINITIONS.length} Unlocked
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {ACHIEVEMENT_CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={cn(
                "text-[11px] font-semibold px-2.5 py-1.5 rounded-full whitespace-nowrap shrink-0",
                category === c.key ? cn(theme.accentBg, "text-slate-900") : cn(theme.subtleBg, theme.textMuted)
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-4 pr-0.5">
          {unlockedDefs.length > 0 && (
            <div>
              <h4 className={cn("text-[10px] font-bold tracking-wide mb-2", theme.textMuted)}>UNLOCKED</h4>
              <div className="flex flex-col gap-2">
                {unlockedDefs.map((def) => (
                  <AchievementRow key={def.id} def={def} state={achievements[def.id]} theme={theme} metrics={metrics} />
                ))}
              </div>
            </div>
          )}
          {lockedDefs.length > 0 && (
            <div>
              <h4 className={cn("text-[10px] font-bold tracking-wide mb-2", theme.textMuted)}>LOCKED</h4>
              <div className="flex flex-col gap-2">
                {lockedDefs.map((def) => (
                  <AchievementRow key={def.id} def={def} state={achievements[def.id]} theme={theme} metrics={metrics} />
                ))}
              </div>
            </div>
          )}
          {defs.length === 0 && <p className={cn("text-xs text-center py-6", theme.textMuted)}>چیزی در این دسته نیست.</p>}
        </div>
      </div>
    </Modal>
  );
}

/* =====================================================================
   DAILY STACKS
   ===================================================================== */

function DailyStacks({ stacks, tasks, theme, categories, onAddStackTask, onArchiveStack, onAddStack, onCreateCategory, recentIconIds, favoriteIconIds, onUseIcon, onToggleFavoriteIcon }) {
  const [openId, setOpenId] = useState(null);
  const [addingFor, setAddingFor] = useState(null);
  const [newStackOpen, setNewStackOpen] = useState(false);
  const [archivingStack, setArchivingStack] = useState(null);

  return (
    <div>
      <SectionTitle icon={<Layers size={15} className={theme.accentText} />} theme={theme}
        right={
          <button onClick={() => setNewStackOpen(true)} className={cn("text-[11px] font-semibold px-2 py-1 rounded-full", theme.subtleBg, theme.textMuted)}>
            + استک جدید
          </button>
        }
      >
        DAILY QUESTS
      </SectionTitle>

      <div className="flex flex-col gap-2">
        {stacks.filter((s) => !s.archived).map((stack) => {
          const stackTasks = tasks.filter((t) => t.stackId === stack.id);
          const done = stackTasks.filter((t) => t.completed).length;
          const total = stackTasks.length;
          const percent = total === 0 ? 0 : Math.round((done / total) * 100);
          const xpAvailable = stackTasks.reduce((s, t) => s + (t.completed ? 0 : t.xp), 0);
          const isOpen = openId === stack.id;
          const isComplete = total > 0 && done === total;
          const stackColor = stack.color || "violet";
          return (
            <div
              key={stack.id}
              className={cn(
                "rounded-2xl border overflow-hidden transition-shadow",
                theme.cardSecondary,
                isComplete ? "border-emerald-400/40" : theme.border,
                isComplete && "stack-complete-glow"
              )}
            >
              <button
                className="w-full flex items-center gap-3 p-3"
                onClick={() => setOpenId(isOpen ? null : stack.id)}
              >
                <span className={cn(`bg-${stackColor}-400/15`, "w-9 h-9 rounded-xl flex items-center justify-center shrink-0")}>
                  <IconGlyph id={stack.icon} size={17} className={`text-${stackColor}-400`} />
                </span>
                <div className="flex-1 text-right min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-bold truncate", theme.text)}>{stack.name}</span>
                    {isComplete && (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-400">
                        <Check size={12} /> COMPLETE
                      </span>
                    )}
                  </div>
                  <span className={cn("text-[11px] font-semibold", theme.textMuted)}>{done}/{total} تکمیل</span>
                </div>
                <CircularProgress percent={percent} size={38} stroke={4} label="" trackColor={theme.ringTrack} barColor={isComplete ? "text-emerald-400" : `text-${stackColor}-400`} />
                {isOpen ? <ChevronUp size={16} className={theme.textMuted} /> : <ChevronDown size={16} className={theme.textMuted} />}
              </button>

              {isOpen && (
                <div className={cn("px-3 pb-3 border-t", theme.border)}>
                  {total === 0 && (
                    <p className={cn("text-xs py-2", theme.textMuted)}>هنوز کاری در این استک نیست.</p>
                  )}
                  <ul className="flex flex-col gap-1.5 mt-2">
                    {stackTasks.map((t) => (
                      <li key={t.id} className={cn("text-xs flex items-center gap-2", t.completed ? "line-through opacity-50" : "")}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", t.completed ? "bg-emerald-400" : `bg-${stackColor}-400`)} />
                        <span className={theme.text}>{t.title}</span>
                        <span className={cn("mr-auto", theme.textMuted)}>{t.xp} XP</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className={cn("text-[11px]", theme.textMuted)}>باقی‌مانده: {xpAvailable} XP</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAddingFor(stack.id)}
                        className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", theme.subtleBg, theme.textMuted)}
                      >
                        + کار
                      </button>
                      <button
                        onClick={() => setArchivingStack(stack)}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400"
                      >
                        آرشیو استک
                      </button>
                    </div>
                  </div>
                  {addingFor === stack.id && (
                    <AddStackTaskInline
                      theme={theme}
                      defaultCategoryId={stack.defaultCategoryId}
                      categories={categories}
                      onCreateCategory={onCreateCategory}
                      recentIconIds={recentIconIds}
                      favoriteIconIds={favoriteIconIds}
                      onUseIcon={onUseIcon}
                      onToggleFavoriteIcon={onToggleFavoriteIcon}
                      onCancel={() => setAddingFor(null)}
                      onSave={(payload) => {
                        onAddStackTask(stack.id, payload);
                        setAddingFor(null);
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {newStackOpen && (
        <NewStackModal theme={theme} categories={categories} onCreateCategory={onCreateCategory} recentIconIds={recentIconIds} favoriteIconIds={favoriteIconIds} onUseIcon={onUseIcon} onToggleFavoriteIcon={onToggleFavoriteIcon} onClose={() => setNewStackOpen(false)} onSave={(s) => { onAddStack(s); setNewStackOpen(false); }} />
      )}
      {archivingStack && (
        <ConfirmModal
          theme={theme}
          title="آرشیو استک؟"
          body="این استک از لیست کارهای روزانه برداشته می‌شود و دیگر Task جدیدی از آن ساخته نمی‌شود. Taskهای فعلی‌اش باقی می‌مانند (فقط دیگر به هیچ استکی وصل نیستند) و تاریخچه پیشرفتش در آمار همچنان قابل مشاهده است."
          confirmLabel="آرشیو استک"
          onCancel={() => setArchivingStack(null)}
          onConfirm={() => { onArchiveStack(archivingStack.id); setArchivingStack(null); }}
        />
      )}
    </div>
  );
}

function AddStackTaskInline({ theme, onSave, onCancel, defaultCategoryId, categories, onCreateCategory, recentIconIds, favoriteIconIds, onUseIcon, onToggleFavoriteIcon }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(defaultCategoryId || "");
  const [difficulty, setDifficulty] = useState("normal");
  const diffObj = DIFFICULTY_OPTIONS.find((d) => d.key === difficulty);
  return (
    <div className="mt-2.5 flex flex-col gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="عنوان کار..."
        className={cn("text-xs rounded-xl px-3 py-2 border outline-none", theme.inputBg, theme.border, theme.text)}
      />
      <CategoryPickerField
        theme={theme}
        categories={categories}
        value={category}
        onChange={setCategory}
        onCreateCategory={onCreateCategory}
        recentIconIds={recentIconIds}
        favoriteIconIds={favoriteIconIds}
        onUseIcon={onUseIcon}
        onToggleFavoriteIcon={onToggleFavoriteIcon}
      />
      <div className="flex items-center gap-2">
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className={cn("text-xs rounded-xl px-2 py-1.5 border outline-none flex-1", theme.inputBg, theme.border, theme.text)}
        >
          {DIFFICULTY_OPTIONS.map((d) => (
            <option key={d.key} value={d.key}>{d.label} ({d.xp} XP)</option>
          ))}
        </select>
        <button
          disabled={!title.trim()}
          onClick={() => onSave({ title: title.trim(), categoryId: category || defaultCategoryId || null, difficulty, xp: diffObj.xp })}
          className={cn("text-xs font-semibold px-3 py-1.5 rounded-xl text-white", `bg-violet-500`)}
        >
          افزودن
        </button>
        <button onClick={onCancel} className={cn("text-xs px-2 py-1.5 rounded-xl", theme.subtleBg, theme.textMuted)}>لغو</button>
      </div>
    </div>
  );
}

function NewStackModal({ theme, onClose, onSave, categories, onCreateCategory, recentIconIds, favoriteIconIds, onUseIcon, onToggleFavoriteIcon }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(DEFAULT_ICON_ID);
  const [color, setColor] = useState("violet");
  const [defaultCategory, setDefaultCategory] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);
  return (
    <Modal title="استک جدید" onClose={onClose} theme={theme}>
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowIconPicker(true)}
            className={cn("w-14 h-14 shrink-0 rounded-xl border flex items-center justify-center", theme.border, theme.inputBg)}
          >
            <IconGlyph id={icon} size={22} className={`text-${color}-400`} />
          </button>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام استک (مثلاً: مطالعه صبح)"
            className={cn("flex-1 text-sm rounded-xl px-3 py-2 border outline-none", theme.inputBg, theme.border, theme.text)}
          />
        </div>
        <ColorSwatchPicker value={color} onChange={setColor} />
        <Field label="دسته‌بندی پیش‌فرض Taskهای این استک" theme={theme}>
          <CategoryPickerField
            theme={theme}
            categories={categories}
            value={defaultCategory}
            onChange={setDefaultCategory}
            onCreateCategory={onCreateCategory}
          />
        </Field>
        <button
          disabled={!name.trim()}
          onClick={() => onSave({ id: uid("stack"), name: name.trim(), icon, color, defaultCategoryId: defaultCategory || null, taskTemplates: [] })}
          className={cn("mt-1 w-full py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40", "bg-violet-500")}
        >
          ساخت استک
        </button>
        {showIconPicker && (
          <Modal title="انتخاب آیکون" onClose={() => setShowIconPicker(false)} theme={theme}>
            <IconPicker
              theme={theme}
              value={icon}
              onChange={setIcon}
              recentIds={recentIconIds}
              favoriteIds={favoriteIconIds}
              onUseIcon={onUseIcon}
              onToggleFavorite={onToggleFavoriteIcon}
            />
            <button onClick={() => setShowIconPicker(false)} className={cn("w-full mt-3 py-2 rounded-xl text-sm font-bold text-slate-900", theme.accentBg)}>تأیید</button>
          </Modal>
        )}
      </div>
    </Modal>
  );
}

/* =====================================================================
   TASKS
   ===================================================================== */

function TaskItem({ task, theme, onToggle, onEdit, onDelete, onToggleSubtask, onMove, reorderDisabled, categories }) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const subDone = task.subtasks?.filter((s) => s.done).length || 0;
  const subTotal = task.subtasks?.length || 0;
  const catDef = categories?.find((c) => c.id === task.categoryId);

  return (
    <div className={cn("rounded-2xl border p-3", theme.cardSmall, theme.border, task.completed && "opacity-55")}>
      <div className="flex items-start gap-2.5">
        <button
          onClick={() => onToggle(task.id)}
          className={cn(
            "mt-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors",
            task.completed ? "bg-emerald-400 border-emerald-400" : cn("border-current", theme.textMuted)
          )}
        >
          {task.completed && <Check key={task.id + "-check"} size={14} className="text-white task-pop" />}
        </button>

        <div className="flex-1 min-w-0" onClick={() => setOpen(!open)}>
          <span className={cn("text-sm font-semibold truncate block", theme.text, task.completed && "line-through")}>
            {task.title}
          </span>
          <div className={cn("flex items-center gap-2 mt-1 text-[10.5px] flex-wrap", theme.textMuted)}>
            <span key={`${task.id}-${task.completed}`} className={cn("px-1.5 py-0.5 rounded-full font-semibold xp-bump", theme.accentSoftBg, theme.accentText)}>
              {task.completed ? "+" : ""}{task.xp} XP
            </span>
            {catDef ? (
              <span className="flex items-center gap-1">
                <IconGlyph id={catDef.iconId} size={11} className={`text-${catDef.color}-400`} />
                {catDef.name}
              </span>
            ) : (
              <span className={theme.textMuted}>بدون دسته‌بندی</span>
            )}
            {task.estMinutes ? <span className="flex items-center gap-0.5"><Clock size={10} />{task.estMinutes} دقیقه</span> : null}
            {task.timeOfDay && <IconGlyph id={TIME_SLOTS.find((s) => s.key === task.timeOfDay)?.icon} size={11} className={theme.textMuted} />}
            {subTotal > 0 && <span>زیروظیفه {subDone}/{subTotal}</span>}
          </div>
        </div>

        <div className="flex flex-col gap-1 items-center">
          <button disabled={reorderDisabled} onClick={() => onMove(task.id, -1)} className={cn(theme.textMuted, reorderDisabled && "opacity-25")}><ArrowUp size={13} /></button>
          <button disabled={reorderDisabled} onClick={() => onMove(task.id, 1)} className={cn(theme.textMuted, reorderDisabled && "opacity-25")}><ArrowDown size={13} /></button>
        </div>
      </div>

      {open && (
        <div className="mt-2.5 pt-2.5 border-t border-dashed flex flex-col gap-2" style={{ borderColor: "currentColor", opacity: 1 }}>
          {task.desc && <p className={cn("text-xs", theme.textMuted)}>{task.desc}</p>}
          {subTotal > 0 && (
            <ul className="flex flex-col gap-1">
              {task.subtasks.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => onToggleSubtask(task.id, s.id)}
                    className={cn(
                      "w-4 h-4 rounded-md border flex items-center justify-center",
                      s.done ? "bg-emerald-400 border-emerald-400" : theme.border
                    )}
                  >
                    {s.done && <Check size={10} className="text-white" />}
                  </button>
                  <span className={cn(theme.text, s.done && "line-through opacity-60")}>{s.title}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => onEdit(task)} className={cn("flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full", theme.subtleBg, theme.textMuted)}>
              <Edit2 size={11} /> ویرایش
            </button>
            <button onClick={() => (task.completed ? setConfirmingDelete(true) : onDelete(task.id))} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400">
              <Trash2 size={11} /> حذف
            </button>
          </div>
        </div>
      )}
      {confirmingDelete && (
        <ConfirmModal
          theme={theme}
          title="حذف کار؟"
          body="این کار قبلاً انجام شده است. حذف آن باعث می‌شود XP مربوط به آن از پیشرفتت حذف شود."
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => { onDelete(task.id); setConfirmingDelete(false); }}
        />
      )}
    </div>
  );
}

function TaskFormModal({ theme, initial, onClose, onSave, stacks, categories, onCreateCategory, recentIconIds, favoriteIconIds, onUseIcon, onToggleFavoriteIcon }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [desc, setDesc] = useState(initial?.desc || "");
  const [category, setCategory] = useState(initial?.categoryId || "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty || "normal");
  const [xp, setXp] = useState(initial?.xp ?? DIFFICULTY_OPTIONS.find((d) => d.key === "normal").xp);
  const [estMinutes, setEstMinutes] = useState(initial?.estMinutes ?? 15);
  const [timeOfDay, setTimeOfDay] = useState(initial?.timeOfDay || "morning");
  const [stackId, setStackId] = useState(initial?.stackId || "");
  const [subtasks, setSubtasks] = useState(initial?.subtasks || []);
  const [subInput, setSubInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const suggestSplit = estMinutes >= 45 || difficulty === "hard" || difficulty === "veryHard";

  const handleDifficultyChange = (key) => {
    setDifficulty(key);
    setXp(DIFFICULTY_OPTIONS.find((d) => d.key === key).xp);
  };

  const addSubtask = () => {
    if (!subInput.trim()) return;
    setSubtasks((s) => [...s, { id: uid("sub"), title: subInput.trim(), done: false }]);
    setSubInput("");
  };

  const removeSubtask = (id) => setSubtasks((s) => s.filter((x) => x.id !== id));

  const askAiForSubtasks = async () => {
    if (!title.trim()) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content:
                `این کار را به ۳ تا ۵ زیروظیفه‌ی کوچک، مشخص و عملی به زبان فارسی تقسیم کن.\n` +
                `فقط یک آرایه JSON از رشته‌ها برگردان، بدون هیچ توضیح یا Markdown اضافه.\n\n` +
                `عنوان: ${title}\nتوضیح: ${desc || "-"}`,
            },
          ],
        }),
      });
      const data = await res.json();
      const text = (data.content || []).map((c) => c.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const arr = JSON.parse(clean);
      if (Array.isArray(arr)) {
        setSubtasks((s) => [...s, ...arr.map((t) => ({ id: uid("sub"), title: String(t), done: false }))]);
      }
    } catch (e) {
      setAiError("پیشنهاد گرفتن با مشکل مواجه شد. دوباره تلاش کن.");
    } finally {
      setAiLoading(false);
    }
  };

  const canSave = title.trim().length > 0;

  return (
    <Modal title={initial ? "ویرایش کار" : "کار جدید"} onClose={onClose} theme={theme}>
      <div className="flex flex-col gap-3">
        <Field label="عنوان" theme={theme}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={cn("w-full text-sm rounded-xl px-3 py-2 border outline-none", theme.inputBg, theme.border, theme.text)} placeholder="مثلاً: مطالعه فصل ۳" />
        </Field>
        <Field label="توضیح کوتاه" theme={theme}>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className={cn("w-full text-sm rounded-xl px-3 py-2 border outline-none resize-none", theme.inputBg, theme.border, theme.text)} />
        </Field>
        <Field label="دسته‌بندی" theme={theme}>
          <CategoryPickerField
            theme={theme}
            categories={categories}
            value={category}
            onChange={setCategory}
            onCreateCategory={onCreateCategory}
            recentIconIds={recentIconIds}
            favoriteIconIds={favoriteIconIds}
            onUseIcon={onUseIcon}
            onToggleFavoriteIcon={onToggleFavoriteIcon}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="سختی / XP" theme={theme}>
            <select value={difficulty} onChange={(e) => handleDifficultyChange(e.target.value)} className={cn("w-full text-sm rounded-xl px-2 py-2 border outline-none", theme.inputBg, theme.border, theme.text)}>
              {DIFFICULTY_OPTIONS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </Field>
          <Field label="XP دستی" theme={theme}>
            <input type="number" min={0} value={xp} onChange={(e) => setXp(Number(e.target.value))} className={cn("w-full text-sm rounded-xl px-3 py-2 border outline-none", theme.inputBg, theme.border, theme.text)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="زمان تقریبی (دقیقه)" theme={theme}>
            <input type="number" min={0} value={estMinutes} onChange={(e) => setEstMinutes(Number(e.target.value))} className={cn("w-full text-sm rounded-xl px-3 py-2 border outline-none", theme.inputBg, theme.border, theme.text)} />
          </Field>
          <Field label="زمان انجام" theme={theme}>
            <select value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} className={cn("w-full text-sm rounded-xl px-2 py-2 border outline-none", theme.inputBg, theme.border, theme.text)}>
              {TIME_SLOTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="استک (اختیاری)" theme={theme}>
          <select
            value={stackId}
            onChange={(e) => {
              const newStackId = e.target.value;
              setStackId(newStackId);
              if (!category && newStackId) {
                const s = stacks.find((st) => st.id === newStackId);
                if (s?.defaultCategoryId) setCategory(s.defaultCategoryId);
              }
            }}
            className={cn("w-full text-sm rounded-xl px-2 py-2 border outline-none", theme.inputBg, theme.border, theme.text)}
          >
            <option value="">بدون استک</option>
            {stacks.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>

        <Field label="زیروظیفه‌ها" theme={theme}>
          <div className="flex flex-col gap-1.5">
            {subtasks.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <span className={cn("flex-1 text-xs rounded-lg px-2.5 py-1.5", theme.subtleBg, theme.text)}>{s.title}</span>
                <button onClick={() => removeSubtask(s.id)} className="text-rose-400"><X size={14} /></button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                value={subInput}
                onChange={(e) => setSubInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubtask())}
                placeholder="زیروظیفه جدید..."
                className={cn("flex-1 text-xs rounded-xl px-3 py-2 border outline-none", theme.inputBg, theme.border, theme.text)}
              />
              <button onClick={addSubtask} className={cn("p-2 rounded-xl", theme.subtleBg)}><Plus size={14} className={theme.textMuted} /></button>
            </div>
          </div>
        </Field>

        {suggestSplit && (
          <div className={cn("rounded-xl p-2.5 border flex items-center justify-between gap-2", "border-violet-400/30 bg-violet-400/5")}>
            <span className="text-[11px] text-violet-300 flex items-center gap-1"><Wand2 size={12} /> این کار بزرگه؛ می‌خوای تقسیمش کنم؟</span>
            <button onClick={askAiForSubtasks} disabled={aiLoading} className="text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-violet-500 text-white flex items-center gap-1 disabled:opacity-50">
              {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              پیشنهاد هوشمند
            </button>
          </div>
        )}
        {aiError && <p className="text-[11px] text-rose-400">{aiError}</p>}

        <button
          disabled={!canSave}
          onClick={() =>
            onSave({
              title: title.trim(),
              desc: desc.trim(),
              categoryId: category || null,
              difficulty,
              xp,
              estMinutes,
              timeOfDay,
              stackId: stackId || null,
              subtasks,
            })
          }
          className={cn("w-full py-2.5 rounded-xl text-sm font-extrabold disabled:opacity-40 mt-1 text-slate-900", theme.accentBg)}
        >
          {initial ? "ذخیره تغییرات" : "افزودن کار"}
        </button>
      </div>
    </Modal>
  );
}

// Shared category picker: choose from the personalized Category registry, or
// create a new one (name + icon + color) inline. Used by the Task form, the
// inline "add task to stack" form, and a Stack's default-category field.
function CategoryPickerField({ theme, categories, value, onChange, onCreateCategory, recentIconIds, favoriteIconIds, onUseIcon, onToggleFavoriteIcon }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState(DEFAULT_ICON_ID);
  const [newColor, setNewColor] = useState("violet");
  const [showIconPicker, setShowIconPicker] = useState(false);

  if (creating) {
    return (
      <div className={cn("flex flex-col gap-2.5 rounded-xl p-2.5 border", theme.border, theme.subtleBg)}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="نام دسته‌بندی جدید"
          className={cn("text-xs rounded-lg px-3 py-2 border outline-none", theme.inputBg, theme.border, theme.text)}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowIconPicker(true)}
            className={cn("w-10 h-10 rounded-xl border flex items-center justify-center shrink-0", theme.border, theme.inputBg)}
          >
            <IconGlyph id={newIcon} size={16} className={`text-${newColor}-400`} />
          </button>
          <ColorSwatchPicker value={newColor} onChange={setNewColor} />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!newName.trim()}
            onClick={() => {
              const id = uid("cat");
              onCreateCategory({ id, name: newName.trim(), iconId: newIcon, color: newColor });
              onChange(id);
              setCreating(false);
              setNewName("");
            }}
            className={cn("flex-1 text-xs font-bold py-2 rounded-lg text-slate-900", theme.accentBg, "disabled:opacity-40")}
          >
            ایجاد دسته‌بندی
          </button>
          <button type="button" onClick={() => setCreating(false)} className={cn("text-xs px-3 py-2 rounded-lg", theme.subtleBg, theme.textMuted)}>لغو</button>
        </div>
        {showIconPicker && (
          <Modal title="انتخاب آیکون" onClose={() => setShowIconPicker(false)} theme={theme}>
            <IconPicker
              theme={theme}
              value={newIcon}
              onChange={setNewIcon}
              recentIds={recentIconIds}
              favoriteIds={favoriteIconIds}
              onUseIcon={onUseIcon}
              onToggleFavorite={onToggleFavoriteIcon}
            />
            <button onClick={() => setShowIconPicker(false)} className={cn("w-full mt-3 py-2 rounded-xl text-sm font-bold text-slate-900", theme.accentBg)}>تأیید</button>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <select
      value={value || ""}
      onChange={(e) => (e.target.value === "__new__" ? setCreating(true) : onChange(e.target.value || null))}
      className={cn("w-full text-sm rounded-xl px-2 py-2 border outline-none", theme.inputBg, theme.border, theme.text)}
    >
      <option value="">بدون دسته‌بندی</option>
      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      <option value="__new__">+ دسته‌بندی جدید</option>
    </select>
  );
}

function Field({ label, children, theme }) {
  return (
    <label className="flex flex-col gap-1">
      <span className={cn("text-[11px] font-semibold", theme.textMuted)}>{label}</span>
      {children}
    </label>
  );
}

/* =====================================================================
   HABITS
   ===================================================================== */

function buildLinkableItems(stacks, tasks) {
  const items = [];
  stacks.forEach((stack) => {
    stack.taskTemplates.forEach((tpl) => {
      items.push({ key: tpl.id, label: tpl.title, icon: stack.icon, stackId: stack.id, stackName: stack.name });
    });
  });
  tasks
    .filter((t) => !t.stackId)
    .forEach((t) => {
      items.push({ key: t.id, label: t.title, icon: "target", stackId: null, stackName: null });
    });
  return items;
}

function HabitCard({ habit, theme, onToggle, onDelete, onEdit, dateStr, stacks }) {
  const week = last7Dates(dateStr);
  const doneThisWeek = week.filter((d) => habit.history.includes(d)).length;
  const weekPercent = Math.round((doneThisWeek / 7) * 100);
  const taskCount = habit.linkedTaskIds?.length || 0;
  const linkedStack = habit.linkedStackId ? stacks.find((s) => s.id === habit.linkedStackId) : null;
  const linkParts = [];
  if (linkedStack) linkParts.push(`استک: ${linkedStack.name}`);
  if (taskCount > 0) linkParts.push(`${taskCount} کار`);
  const linkLabel = linkParts.join(" + ");
  const habitColor = habit.color || "emerald";
  const isAutoToday = habit.doneToday && habit.xpSourceToday === "auto";
  return (
    <div className={cn("rounded-2xl border p-3", theme.cardSecondary, theme.border)}>
      <div className="flex items-center gap-3">
        <span className={cn(`bg-${habitColor}-400/15`, "w-11 h-11 rounded-xl flex items-center justify-center shrink-0")}>
          <IconGlyph id={habit.icon} size={20} className={`text-${habitColor}-400`} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5">
            <span className={cn("text-sm font-bold truncate", theme.text)}>{habit.name}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {isAutoToday && (
                <span className={cn("text-[8.5px] font-extrabold tracking-wide px-1.5 py-0.5 rounded-full", theme.accentSoftBg, theme.accentText)}>AUTO</span>
              )}
              <span className={cn("text-[11px] font-bold", theme.accentText)}>{habit.xp} XP</span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10.5px]" >
            <span className="flex items-center gap-1 text-orange-400 font-semibold"><Flame size={11} className="fill-orange-400" />{habit.streak} روز</span>
            <span className={theme.textMuted}>بهترین: {habit.bestStreak}</span>
            <span className={theme.textMuted}>هفته: {weekPercent}%</span>
          </div>
          {linkLabel && (
            <div className={cn("flex items-center gap-1 mt-1 text-[10px] font-semibold", "text-sky-400")}>
              <Layers size={10} /> {linkLabel}
            </div>
          )}
        </div>
        <button
          onClick={() => onToggle(habit.id)}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0",
            habit.doneToday ? "bg-emerald-400 border-emerald-400" : cn("border-current", theme.textMuted)
          )}
        >
          {habit.doneToday && <Check size={16} className="text-white" />}
        </button>
      </div>
      <div className="flex items-center gap-1 mt-2.5">
        {week.map((d) => (
          <div key={d} className={cn("flex-1 h-1.5 rounded-full", habit.history.includes(d) ? "bg-emerald-400" : theme.trackBg)} />
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2">
        <button onClick={() => onEdit(habit)} className="text-[10.5px] font-semibold flex items-center gap-1" style={{ color: "inherit" }}>
          <Edit2 size={10} /> <span className={theme.textMuted}>ویرایش / اتصال</span>
        </button>
        <button onClick={() => onDelete(habit.id)} className="text-[10.5px] text-rose-400 font-semibold">حذف عادت</button>
      </div>
    </div>
  );
}

function HabitFormModal({ theme, initial, stacks, tasks, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || "");
  const [icon, setIcon] = useState(initial?.icon || DEFAULT_ICON_ID);
  const [color, setColor] = useState(initial?.color || "emerald");
  const [xp, setXp] = useState(initial?.xp ?? 10);
  const [linkedStackId, setLinkedStackId] = useState(initial?.linkedStackId || "");
  const [linkedTaskIds, setLinkedTaskIds] = useState(initial?.linkedTaskIds || []);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const linkable = useMemo(() => buildLinkableItems(stacks, tasks), [stacks, tasks]);
  const visible = linkedStackId ? linkable.filter((i) => i.stackId === linkedStackId) : linkable;

  const toggleLink = (key) => {
    setLinkedTaskIds((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  return (
    <Modal title={initial ? "ویرایش عادت" : "عادت جدید"} onClose={onClose} theme={theme}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowIconPicker(true)}
            className={cn("w-14 h-14 shrink-0 rounded-xl border flex items-center justify-center", theme.border, theme.inputBg)}
          >
            <IconGlyph id={icon} size={22} className={`text-${color}-400`} />
          </button>
          <div className="flex-1 flex flex-col gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام عادت" className={cn("text-sm rounded-xl px-3 py-2 border outline-none", theme.inputBg, theme.border, theme.text)} />
            <ColorSwatchPicker value={color} onChange={setColor} />
          </div>
        </div>
        <Field label="XP (فقط برای تکمیل دستی)" theme={theme}>
          <input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))} className={cn("w-full text-sm rounded-xl px-3 py-2 border outline-none", theme.inputBg, theme.border, theme.text)} />
        </Field>

        <div className={cn("rounded-xl p-3 border flex flex-col gap-2", theme.border, theme.subtleBg)}>
          <div className="flex items-center gap-1.5">
            <Layers size={13} className="text-violet-400" />
            <span className={cn("text-[11px] font-extrabold tracking-wide", theme.text)}>CONNECT TO STACK</span>
          </div>
          <p className={cn("text-[10.5px] leading-relaxed", theme.textMuted)}>
            انجام هر Task از این Stack، عادت را خودکار کامل می‌کند.
          </p>
          <select value={linkedStackId} onChange={(e) => setLinkedStackId(e.target.value)} className={cn("w-full text-sm rounded-xl px-2 py-2 border outline-none", theme.inputBg, theme.border, theme.text)}>
            <option value="">هیچ‌کدام</option>
            {stacks.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className={cn("rounded-xl p-3 border flex flex-col gap-2", theme.border, theme.subtleBg)}>
          <div className="flex items-center gap-1.5">
            <ListChecks size={13} className="text-sky-400" />
            <span className={cn("text-[11px] font-extrabold tracking-wide", theme.text)}>CONNECT TO SPECIFIC TASKS</span>
          </div>
          <p className={cn("text-[10.5px] leading-relaxed", theme.textMuted)}>
            فقط Taskهای انتخاب‌شده در پایین، عادت را کامل می‌کنند{linkedStackId ? " (لیست به Taskهای همین Stack محدود شده)" : ""}.
          </p>
          <div className={cn("flex flex-col gap-1.5 max-h-40 overflow-y-auto rounded-xl p-2", theme.inputBg)}>
            {visible.length === 0 && <p className={cn("text-[11px]", theme.textMuted)}>Taskی برای اتصال نیست.</p>}
            {visible.map((item) => (
              <label key={item.key} className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={linkedTaskIds.includes(item.key)} onChange={() => toggleLink(item.key)} className="accent-emerald-500" />
                <IconGlyph id={item.icon} size={13} className={theme.textMuted} />
                <span className={cn(theme.text, "truncate")}>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <p className={cn("text-[10px] leading-relaxed", theme.textMuted)}>
          این دو نوع اتصال با هم جمع می‌شوند (هر کدام فعال شود کافی است) و در هر دو حالت XP اضافه‌ای داده نمی‌شود — چون Task مرتبط قبلاً XP خودش را داده، برای جلوگیری از XP تکراری.
        </p>

        <button
          disabled={!name.trim()}
          onClick={() =>
            onSave({
              name: name.trim(),
              icon,
              color,
              xp,
              linkedStackId: linkedStackId || null,
              linkedTaskIds,
            })
          }
          className="py-2.5 rounded-xl bg-emerald-400 text-slate-900 text-sm font-extrabold disabled:opacity-40"
        >
          {initial ? "ذخیره تغییرات" : "افزودن عادت"}
        </button>

        {showIconPicker && (
          <Modal title="انتخاب آیکون" onClose={() => setShowIconPicker(false)} theme={theme}>
            <IconPicker theme={theme} value={icon} onChange={setIcon} />
            <button onClick={() => setShowIconPicker(false)} className={cn("w-full mt-3 py-2 rounded-xl text-sm font-bold text-slate-900", theme.accentBg)}>تأیید</button>
          </Modal>
        )}
      </div>
    </Modal>
  );
}

function HabitsView({ habits, theme, onToggle, onAdd, onUpdate, onDelete, dateStr, stacks, tasks }) {
  const [adding, setAdding] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  return (
    <div className="flex flex-col gap-2.5 pb-24">
      <SectionTitle icon={<Target size={15} className="text-emerald-400" />} theme={theme}
        right={<button onClick={() => setAdding(true)} className={cn("text-[11px] font-semibold px-2 py-1 rounded-full", theme.subtleBg, theme.textMuted)}>+ عادت</button>}
      >
        عادت‌های روزانه
      </SectionTitle>
      {habits.map((h) => (
        <HabitCard key={h.id} habit={h} theme={theme} onToggle={onToggle} onDelete={onDelete} onEdit={(habit) => setEditingHabit(habit)} dateStr={dateStr} stacks={stacks} />
      ))}
      {adding && (
        <HabitFormModal
          theme={theme}
          stacks={stacks}
          tasks={tasks}
          onClose={() => setAdding(false)}
          onSave={(payload) => {
            onAdd({ id: uid("habit"), streak: 0, bestStreak: 0, history: [], doneToday: false, xpSourceToday: null, ...payload });
            setAdding(false);
          }}
        />
      )}
      {editingHabit && (
        <HabitFormModal
          theme={theme}
          initial={editingHabit}
          stacks={stacks}
          tasks={tasks}
          onClose={() => setEditingHabit(null)}
          onSave={(payload) => {
            onUpdate(editingHabit.id, payload);
            setEditingHabit(null);
          }}
        />
      )}
    </div>
  );
}

/* =====================================================================
   STATISTICS SERVICE — Stack Progress
   Pure data-layer functions with no UI dependency, kept deliberately separate
   from the chart component below so this logic can be lifted into its own
   module later without touching any JSX. Flow:

     Stack History (archive[date].stackStats + live today)
       -> buildStackProgressChartData()  [this section]
       -> recharts-ready rows
       -> <StackProgressChart> [UI layer]
   ===================================================================== */

// Extendable now, not just "7/30/90" — add { key: "6m", days: 180, label: "6 Months" }
// etc. later without touching the chart component itself.
const STACK_HISTORY_RANGE_OPTIONS = [
  { key: "7d", days: 7, label: "7 Days" },
  { key: "30d", days: 30, label: "30 Days" },
  { key: "90d", days: 90, label: "90 Days" },
];

function lastNDates(fromDateStr, n) {
  const arr = [];
  for (let i = n - 1; i >= 0; i--) arr.push(addDaysStr(fromDateStr, -i));
  return arr;
}

/* ---------------------------------------------------------------------
   DATA INTEGRITY HELPERS — the single source of truth for "what happened
   on a given day". Every Statistics function below goes through these
   instead of re-deriving its own "today ? live : archive" branch, so there
   is exactly one place that decides live-vs-frozen, not four.

   getTasksForDate   — today's live Tasks only (any other day has none live;
                       its facts live in the frozen archive entry instead).
   getDailySnapshot  — today: computed fresh from current state (mirrors
                       exactly what rollDataForward will freeze once the day
                       actually ends). Any other date: the frozen archive
                       entry, verbatim, never recomputed.
   getStackStatsForDate / getDailyScoreForDate — thin convenience readers
                       over getDailySnapshot for the common single-value cases.
   --------------------------------------------------------------------- */

function getTasksForDate(data, date) {
  if (date !== data.todayDate) return [];
  // Defensive guard: today's Tasks are already guaranteed day-scoped by
  // construction (the array is fully replaced on rollover), but every Task
  // also carries an explicit `date` — if one somehow doesn't match, it's
  // excluded rather than silently counted into the wrong day's stats.
  return data.tasks.filter((t) => !t.date || t.date === date);
}

function getDailySnapshot(data, date) {
  if (date === data.todayDate) {
    const tasks = getTasksForDate(data, date);
    const taskWeightStats = { totalWeight: 0, completedWeight: 0 };
    const stackStats = {};
    const categoryStats = {};
    tasks.forEach((t) => {
      const w = taskWeight(t.difficulty);
      taskWeightStats.totalWeight += w;
      if (t.completed) taskWeightStats.completedWeight += w;

      if (t.stackId) {
        if (!stackStats[t.stackId]) stackStats[t.stackId] = { total: 0, completed: 0 };
        stackStats[t.stackId].total += 1;
        if (t.completed) stackStats[t.stackId].completed += 1;
      }

      const cat = t.categoryId || "__none__";
      if (!categoryStats[cat]) categoryStats[cat] = { total: 0, completed: 0, plannedXp: 0, completedXp: 0 };
      categoryStats[cat].total += 1;
      categoryStats[cat].plannedXp += t.xp;
      if (t.completed) {
        categoryStats[cat].completed += 1;
        categoryStats[cat].completedXp += t.xp;
      }
    });
    const habitStats = { total: data.habits.length, completed: data.habits.filter((h) => h.doneToday).length };
    const stackCompletions = Object.values(stackStats).filter((s) => s.total > 0).map((s) => (s.completed / s.total) * 100);
    const dailyScore = computeDailyScore({ taskWeightStats, stackCompletions, habitStats });
    return {
      date,
      tasksTotal: data.today.tasksTotal,
      tasksCompleted: data.today.tasksCompleted,
      xpEarned: data.today.xpEarned,
      categoryStats,
      stackStats,
      taskWeightStats,
      habitStats,
      dailyScore,
      stackBonusStackIds: data.today.stackBonusGiven,
      cumulativeXp: data.profile.totalXp,
    };
  }
  // Any other day: read the frozen archive entry verbatim. If it doesn't exist
  // (e.g. a day from before this feature existed, or before the app was ever
  // opened), return null — callers must treat that as "no data", never a fake 0.
  const rec = data.archive[date];
  return rec ? { date, ...rec } : null;
}

function getStackStatsForDate(data, stackId, date) {
  return getDailySnapshot(data, date)?.stackStats?.[stackId] ?? null;
}

function getDailyScoreForDate(data, date) {
  return getDailySnapshot(data, date)?.dailyScore ?? null;
}

// Named to match the requested Data Helper vocabulary directly — thin readers
// over the same single source of truth (getDailySnapshot), not new logic.
function getHistoricalXP(data, date) {
  return getDailySnapshot(data, date)?.xpEarned ?? null;
}

// Whether a Stack's completion Bonus was actually paid on a given day — reads
// the explicit event record (stackBonusStackIds), not a re-derivation from
// stackStats. "Claiming" the Bonus itself already happens centrally inside
// applyEconomyMutation/computeStackBonusSet (see toggleTask/addStackTask/etc)
// every time Tasks change; this is the read-side counterpart for Statistics
// or any future feature (e.g. an Achievement) that needs to ask "was Stack X's
// Bonus claimed on date Y?" without re-running completion math itself.
function wasStackBonusClaimed(data, stackId, date) {
  return (getDailySnapshot(data, date)?.stackBonusStackIds || []).includes(stackId);
}

/* =====================================================================
   ACHIEVEMENT SERVICE — "achievementEngine"
   Fully separate from UI: definitions are static data, metrics are pure
   reads from the same reliable historical sources as Statistics (never
   re-derived from "current" state in a way that could drift), and the
   unlock check is a pure function of (definitions, metrics, prior state).

   IMPORTANT — matches the project's core invariant: an Achievement's
   `unlocked`/`unlockedAt` is a permanent, one-way fact once set. The engine
   only ever flips locked -> unlocked, never the reverse, even if the live
   metric that earned it later drops (e.g. a Habit whose check-ins
   contributed to "Habit Master" gets deleted). Achievements grant NO XP,
   NO Coins, and currently NO reward — `reward` is deliberately kept as an
   explicit `null` field so a future Mini Game can populate it later without
   any data-model migration being needed for that specific change.
   ===================================================================== */

const ACHIEVEMENT_DEFINITIONS = [
  { id: "first_task", title: "First Step", description: "Complete your first task.", icon: "target", category: "tasks", requirement: 1, metric: "tasksCompleted" },
  { id: "getting_started", title: "Getting Started", description: "Complete 10 tasks.", icon: "check-circle", category: "tasks", requirement: 10, metric: "tasksCompleted" },
  { id: "task_master", title: "Task Master", description: "Complete 50 tasks.", icon: "swords", category: "tasks", requirement: 50, metric: "tasksCompleted" },
  { id: "task_veteran", title: "Task Veteran", description: "Complete 100 tasks.", icon: "crown", category: "tasks", requirement: 100, metric: "tasksCompleted" },

  { id: "first_stack", title: "First Stack", description: "Complete your first stack.", icon: "layers", category: "stacks", requirement: 1, metric: "stacksCompleted" },
  { id: "stack_master", title: "Stack Master", description: "Complete 10 stacks.", icon: "gem", category: "stacks", requirement: 10, metric: "stacksCompleted" },
  { id: "stack_veteran", title: "Stack Veteran", description: "Complete 50 stacks.", icon: "crown", category: "stacks", requirement: 50, metric: "stacksCompleted" },

  { id: "streak_3", title: "3 Day Streak", description: "Reach a 3 day streak.", icon: "flame", category: "streak", requirement: 3, metric: "bestStreak" },
  { id: "streak_7", title: "7 Day Streak", description: "Reach a 7 day streak.", icon: "flame", category: "streak", requirement: 7, metric: "bestStreak" },
  { id: "streak_30", title: "30 Day Streak", description: "Reach a 30 day streak.", icon: "flame", category: "streak", requirement: 30, metric: "bestStreak" },

  { id: "level_2", title: "Level Up", description: "Reach Level 2.", icon: "hexagon", category: "level", requirement: 2, metric: "level" },
  { id: "level_5", title: "Rising Hero", description: "Reach Level 5.", icon: "swords", category: "level", requirement: 5, metric: "level" },
  { id: "level_10", title: "Experienced", description: "Reach Level 10.", icon: "crown", category: "level", requirement: 10, metric: "level" },

  { id: "first_habit", title: "First Habit", description: "Complete a habit for the first time.", icon: "droplets", category: "habits", requirement: 1, metric: "habitCheckIns" },
  { id: "habit_builder", title: "Habit Builder", description: "Complete 25 habit check-ins.", icon: "activity", category: "habits", requirement: 25, metric: "habitCheckIns" },
  { id: "habit_master", title: "Habit Master", description: "Complete 100 habit check-ins.", icon: "gem", category: "habits", requirement: 100, metric: "habitCheckIns" },

  { id: "perfect_day", title: "Perfect Day", description: "Reach 100 Daily Score in one day.", icon: "star", category: "dailyScore", requirement: 1, metric: "perfectDays" },
  { id: "consistency", title: "Consistency", description: "Reach Daily Score of 80+ for 7 different days.", icon: "target", category: "dailyScore", requirement: 7, metric: "daysAbove80" },
  { id: "high_performer", title: "High Performer", description: "Reach Daily Score of 90+ for 10 different days.", icon: "crown", category: "dailyScore", requirement: 10, metric: "daysAbove90" },
];

const ACHIEVEMENT_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "tasks", label: "Tasks" },
  { key: "stacks", label: "Stacks" },
  { key: "habits", label: "Habits" },
  { key: "streak", label: "Streak" },
  { key: "level", label: "Level" },
  { key: "dailyScore", label: "Daily Score" },
];

function defaultAchievementState() {
  return ACHIEVEMENT_DEFINITIONS.reduce((map, def) => {
    map[def.id] = { unlocked: false, unlockedAt: null, seen: true };
    return map;
  }, {});
}

// Every metric here reads from the same reliable, history-respecting sources
// Statistics already uses (frozen archive + live today) — never a value that
// could retroactively change because of an unrelated future action.
function computeAchievementMetrics(data) {
  const tasksCompleted =
    Object.values(data.archive).reduce((s, a) => s + (a.tasksCompleted || 0), 0) + data.today.tasksCompleted;

  // A Stack "completing" is an event, same as its XP Bonus — count every
  // stack-day where the Bonus was actually claimed, past (frozen) + today (live).
  const stacksCompleted =
    Object.values(data.archive).reduce((s, a) => s + (a.stackBonusStackIds?.length || 0), 0) +
    (data.today.stackBonusGiven?.length || 0);

  const bestStreak = data.profile.bestStreak;
  const level = levelInfo(data.profile.totalXp).level;

  // A Habit's own `history` array only ever grows for past dates (today's entry
  // can be removed on same-day undo, but a closed day's entry is never touched),
  // so summing it across all current Habits gives a reliable lifetime count.
  const habitCheckIns = data.habits.reduce((s, h) => s + (h.history?.length || 0), 0);

  let perfectDays = 0;
  let daysAbove80 = 0;
  let daysAbove90 = 0;
  const allDates = new Set([...Object.keys(data.archive), data.todayDate]);
  allDates.forEach((d) => {
    const score = getDailyScoreForDate(data, d);
    if (score == null) return;
    if (score >= 100) perfectDays += 1;
    if (score >= 90) daysAbove90 += 1;
    if (score >= 80) daysAbove80 += 1;
  });

  return { tasksCompleted, stacksCompleted, bestStreak, level, habitCheckIns, perfectDays, daysAbove80, daysAbove90 };
}

function getAchievementProgress(def, metrics) {
  return Math.max(0, metrics[def.metric] ?? 0);
}

// Pure: (current achievements state, current data) -> { achievements, newlyUnlocked }.
// Never revokes an unlock — only ever flips locked -> unlocked.
function checkAchievements(data) {
  const metrics = computeAchievementMetrics(data);
  const prev = data.achievements || defaultAchievementState();
  const next = { ...prev };
  const newlyUnlocked = [];

  ACHIEVEMENT_DEFINITIONS.forEach((def) => {
    const state = next[def.id] || { unlocked: false, unlockedAt: null, seen: true };
    if (!state.unlocked && getAchievementProgress(def, metrics) >= def.requirement) {
      next[def.id] = { unlocked: true, unlockedAt: data.todayDate, seen: false };
      newlyUnlocked.push(def);
    } else if (!next[def.id]) {
      next[def.id] = state;
    }
  });

  const changed = newlyUnlocked.length > 0;
  return { achievements: changed ? next : prev, newlyUnlocked };
}

/* =====================================================================
   STACK PROGRESS — 30-day multi-line chart data
   ===================================================================== */

// Completion % for one Stack on one specific day, or null when that day shouldn't
// be plotted at all (Stack didn't exist yet, or existed but had zero Tasks that day).
function getStackDailyCompletion(data, stack, dateStr) {
  if (dateStr < stack.createdDate) return null;
  const rec = getStackStatsForDate(data, stack.id, dateStr);
  if (!rec || !rec.total) return null; // no data, or Stack existed but had 0 Tasks that day — a gap, not a 0%
  return Math.round((rec.completed / rec.total) * 100);
}

// Builds recharts-ready data: one row per day (all series merged by date, as
// recharts' multi-Line convention expects), plus per-Stack metadata for the
// legend/tooltip. Archived Stacks are included (their history is still valid),
// each Stack's own createdDate naturally clips its line to when it existed.
function buildStackProgressChartData(data, rangeDays) {
  const dates = lastNDates(data.todayDate, rangeDays);
  const stacksMeta = data.stacks.map((s) => ({ id: s.id, name: s.name, color: s.color || "violet", archived: !!s.archived }));

  const rows = dates.map((date) => {
    const row = { date };
    data.stacks.forEach((stack) => {
      row[stack.id] = getStackDailyCompletion(data, stack, date);
    });
    return row;
  });

  // Only offer Stacks in the legend/selector that actually have at least one
  // real data point in this range — an empty line is just clutter.
  const stacksWithData = stacksMeta.filter((s) => rows.some((r) => r[s.id] != null));

  return { dates, rows, stacks: stacksWithData };
}

// Live Daily Score for "today" — mirrors exactly what rollDataForward will freeze
// once today ends, since it's the same getDailySnapshot() read.
function computeLiveDailyScore(data) {
  return getDailySnapshot(data, data.todayDate)?.dailyScore ?? null;
}

// Daily Score line chart data — historical (frozen, from archive) + live today.
// A day with no stored/computable score is a genuine gap (null), never a fake 0.
function buildDailyScoreChartData(data, rangeDays) {
  const dates = lastNDates(data.todayDate, rangeDays);
  return dates.map((date) => ({ date, score: getDailyScoreForDate(data, date) }));
}

// XP Growth — cumulative lifetime XP per day. Historical days read the frozen
// `cumulativeXp` snapshot; days from before this feature existed simply have no
// snapshot and render as a gap rather than a fabricated backfilled number.
function buildXpGrowthChartData(data, rangeDays) {
  const dates = lastNDates(data.todayDate, rangeDays);
  return dates.map((date) => ({ date, xp: getDailySnapshot(data, date)?.cumulativeXp ?? null }));
}

/* =====================================================================
   STATISTICS
   ===================================================================== */

function StatsView({ data, theme, onUpdateWeeklyGoal }) {
  const week = last7Dates(data.todayDate);
  const dayData = week.map((d) => {
    const snap = getDailySnapshot(data, d);
    return { date: d, xp: snap?.xpEarned || 0, done: snap?.tasksCompleted || 0, total: snap?.tasksTotal || 0 };
  });
  const maxXp = Math.max(1, ...dayData.map((d) => d.xp));
  const weeklyXpTotal = dayData.reduce((s, d) => s + d.xp, 0);
  const weeklyGoal = data.settings?.weeklyXpGoal || DEFAULT_WEEKLY_XP_GOAL;
  const weeklyPercent = weeklyGoal > 0 ? Math.min(100, Math.round((weeklyXpTotal / weeklyGoal) * 100)) : 0;
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(weeklyGoal);

  const milestone = getStreakMilestone(data.profile.streak);
  const milestoneSpan = milestone.next - milestone.prev;
  const streakPercent = milestoneSpan > 0 ? Math.round(((data.profile.streak - milestone.prev) / milestoneSpan) * 100) : 0;

  // Task completion rate — last 7 days
  const weekTasksDone = dayData.reduce((s, d) => s + d.done, 0);
  const weekTasksTotal = dayData.reduce((s, d) => s + d.total, 0);
  const taskRate = weekTasksTotal === 0 ? 0 : Math.round((weekTasksDone / weekTasksTotal) * 100);

  // Habit completion rate — last 7 days (a habit "counts" on a day if its history includes that date)
  const habitCount = data.habits.length;
  const weekHabitsDone = week.reduce((s, d) => s + data.habits.filter((h) => h.history.includes(d)).length, 0);
  const weekHabitsTotal = habitCount * 7;
  const habitRate = weekHabitsTotal === 0 ? 0 : Math.round((weekHabitsDone / weekHabitsTotal) * 100);

  // Category performance — for each category over the last 7 days:
  //   Effort       = completedXP / plannedXP      (did I do the harder/valuable tasks?)
  //   Completion   = completedTasks / plannedTasks (did I finish what I planned?)
  //   Consistency  = activeDays / 7                (did I show up regularly?)
  // These are shown separately in the UI; a blended score is used only for ranking.
  // Categories are pure Task classification — Habits and Stacks never contribute
  // XP here directly, only via the Tasks that reference a categoryId.
  const catAgg = {};
  week.forEach((d) => {
    const stats = getDailySnapshot(data, d)?.categoryStats || {};
    Object.entries(stats).forEach(([cat, s]) => {
      if (!catAgg[cat]) catAgg[cat] = { total: 0, completed: 0, plannedXp: 0, completedXp: 0, activeDays: 0 };
      catAgg[cat].total += s.total;
      catAgg[cat].completed += s.completed;
      catAgg[cat].plannedXp += s.plannedXp ?? s.xp ?? 0; // s.xp fallback for pre-migration archive entries
      catAgg[cat].completedXp += s.completedXp ?? s.xp ?? 0;
      if (s.completed > 0) catAgg[cat].activeDays += 1;
    });
  });
  const allCats = Object.entries(catAgg)
    .filter(([cat, s]) => cat !== "__none__" && s.plannedXp > 0) // "Uncategorized" tasks don't get ranked as a fake category
    .map(([cat, s]) => {
      const effort = s.plannedXp > 0 ? Math.round((s.completedXp / s.plannedXp) * 100) : 0;
      const completion = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
      const consistency = Math.round((s.activeDays / 7) * 100);
      const score = effort * 0.45 + completion * 0.35 + consistency * 0.2; // sorting only, never shown
      return {
        cat,
        plannedXp: s.plannedXp,
        completedXp: s.completedXp,
        total: s.total,
        completed: s.completed,
        activeDays: s.activeDays,
        effort,
        completion,
        consistency,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
  // Top Categories require at least 2 tasks AND at least 2 active days in the window;
  // smaller categories still show up under "View All" so they're never fully hidden.
  const topCats = allCats.filter((c) => c.total >= 2 && c.activeDays >= 2).slice(0, 4);

  const [showAllCats, setShowAllCats] = useState(false);
  const visibleCats = showAllCats ? allCats : topCats;

  const info = levelInfo(data.profile.totalXp);
  const coins = getCoinBalance(data.profile);
  const totalTasksDone = Object.values(data.archive).reduce((s, a) => s + a.tasksCompleted, 0) + data.today.tasksCompleted;
  const totalTasksAll = Object.values(data.archive).reduce((s, a) => s + a.tasksTotal, 0) + data.today.tasksTotal;
  const completionRate = totalTasksAll === 0 ? 0 : Math.round((totalTasksDone / totalTasksAll) * 100);
  const bestDay = dayData.reduce((best, d) => (d.xp > best.xp ? d : best), dayData[0]);

  const todayDailyScore = computeLiveDailyScore(data);

  // Weekly/Monthly summary — fixed 30-day window, built from the same frozen
  // archive + live-today pattern as everything else on this page.
  const summaryDates = lastNDates(data.todayDate, 30);
  const summaryScores = summaryDates.map((d) => getDailyScoreForDate(data, d)).filter((v) => v != null);
  const avgDailyScore = summaryScores.length ? Math.round(summaryScores.reduce((s, v) => s + v, 0) / summaryScores.length) : null;
  const bestDailyScore = summaryScores.length ? Math.max(...summaryScores) : null;
  const summaryTasksCompleted = summaryDates.reduce((s, d) => s + (getDailySnapshot(data, d)?.tasksCompleted || 0), 0);
  let stackPctSum = 0;
  let stackPctCount = 0;
  summaryDates.forEach((d) => {
    const stackStatsForDay = getDailySnapshot(data, d)?.stackStats || {};
    Object.values(stackStatsForDay).forEach((s) => {
      if (s.total > 0) {
        stackPctSum += (s.completed / s.total) * 100;
        stackPctCount += 1;
      }
    });
  });
  const avgStackCompletion = stackPctCount ? Math.round(stackPctSum / stackPctCount) : null;

  return (
    <div className="flex flex-col gap-3 pb-24">
      <SectionTitle icon={<BarChart3 size={15} className="text-sky-400" />} theme={theme}>آمار پیشرفت</SectionTitle>

      <div className="grid grid-cols-2 gap-2.5">
        <MiniStat theme={theme} label="مجموع XP" value={data.profile.totalXp} icon={<Sparkles size={14} className="text-violet-400" />} />
        <MiniStat theme={theme} label="Daily Score امروز" value={todayDailyScore != null ? `${todayDailyScore} / 100` : "—"} icon={<Target size={14} className={theme.accentText} />} />
        <MiniStat theme={theme} label="کارهای امروز" value={`${data.today.tasksCompleted} / ${data.today.tasksTotal}`} icon={<ListChecks size={14} className="text-emerald-400" />} />
        <MiniStat theme={theme} label="بهترین Streak" value={`${data.profile.bestStreak} روز`} icon={<Flame size={14} className="text-orange-400" />} />
      </div>

      <DailyScoreChart data={data} theme={theme} />

      <div className={cn("rounded-2xl p-4 border", theme.cardSecondary, theme.border)}>
        <h3 className={cn("text-xs font-bold mb-3", theme.text)}>خلاصه ۷ روز اخیر</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <StatRing theme={theme} icon={<ListChecks size={12} className="text-amber-400" />} label="TASKS" centerLabel={`${taskRate}%`} percent={taskRate} colorClass="text-amber-400" />
          <StatRing theme={theme} icon={<Target size={12} className="text-emerald-400" />} label="HABITS" centerLabel={`${habitRate}%`} percent={habitRate} colorClass="text-emerald-400" />
          <div className="flex flex-col items-center gap-1">
            <StatRing theme={theme} icon={<Sparkles size={12} className="text-violet-400" />} label="WEEKLY XP" centerLabel={`${weeklyXpTotal}`} percent={weeklyPercent} colorClass="text-violet-400" caption={`Goal: ${weeklyGoal} XP`} />
            {!editingGoal ? (
              <button onClick={() => { setGoalInput(weeklyGoal); setEditingGoal(true); }} className="text-[9px] font-semibold text-sky-400">ویرایش هدف</button>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={MIN_WEEKLY_XP_GOAL}
                  max={MAX_WEEKLY_XP_GOAL}
                  value={goalInput}
                  onChange={(e) => setGoalInput(Number(e.target.value))}
                  className={cn("w-16 text-[10px] text-center rounded-lg px-1 py-0.5 border outline-none", theme.inputBg, theme.border, theme.text)}
                />
                <button
                  onClick={() => { onUpdateWeeklyGoal(goalInput); setEditingGoal(false); }}
                  className="text-[9px] font-bold text-emerald-400"
                >
                  ذخیره
                </button>
              </div>
            )}
          </div>
          <StatRing theme={theme} icon={<Flame size={12} className="text-orange-400" />} label="STREAK" centerLabel={`${data.profile.streak}`} percent={streakPercent} colorClass="text-orange-400" caption={`NEXT: ${milestone.next} DAYS`} />
        </div>
      </div>

      <StackProgressChart data={data} theme={theme} />

      <XpGrowthChart data={data} theme={theme} />

      <div className={cn("rounded-2xl p-4 border", theme.cardSecondary, theme.border)}>
        <h3 className={cn("text-xs font-bold mb-3", theme.text)}>خلاصه ۳۰ روز اخیر</h3>
        <div className="grid grid-cols-3 gap-y-3 gap-x-2">
          <SummaryStat theme={theme} label="میانگین Daily Score" value={avgDailyScore != null ? avgDailyScore : "—"} />
          <SummaryStat theme={theme} label="بهترین Daily Score" value={bestDailyScore != null ? bestDailyScore : "—"} />
          <SummaryStat theme={theme} label="مجموع XP" value={data.profile.totalXp} />
          <SummaryStat theme={theme} label="Taskهای تکمیل‌شده" value={summaryTasksCompleted} />
          <SummaryStat theme={theme} label="بهترین Streak" value={`${data.profile.bestStreak} روز`} />
          <SummaryStat theme={theme} label="میانگین تکمیل استک‌ها" value={avgStackCompletion != null ? `${avgStackCompletion}%` : "—"} />
        </div>
      </div>

      {(data.settings?.showWeeklyChart ?? true) && (
        <div className={cn("rounded-2xl p-4 border", theme.cardSecondary, theme.border)}>
          <h3 className={cn("text-xs font-bold mb-3", theme.text)}>XP هفت روز اخیر</h3>
          <div className="flex items-end gap-2 h-36">
            {dayData.map((d, idx) => {
              const isToday = d.date === data.todayDate;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className={cn("text-[10px] font-bold", isToday ? theme.accentText : theme.textMuted)}>{d.xp}</span>
                  <div className="w-full rounded-xl overflow-hidden flex items-end" style={{ height: 92 }}>
                    <div
                      className={cn("w-full rounded-xl bar-rise", isToday ? theme.accentBg : "bg-violet-400/60")}
                      style={{ height: `${Math.max(5, (d.xp / maxXp) * 100)}%`, animationDelay: `${idx * 70}ms` }}
                    />
                  </div>
                  <span className={cn("text-[9px] font-semibold", isToday ? theme.accentText : theme.textMuted)}>{weekdayFa(d.date).slice(0, 3)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(data.settings?.showCategoryStats ?? true) && (
        <div className={cn("rounded-2xl p-4 border", theme.cardSecondary, theme.border)}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={cn("text-xs font-bold", theme.text)}>عملکرد دسته‌بندی‌ها (۷ روز اخیر)</h3>
            {allCats.length > topCats.length && (
              <button onClick={() => setShowAllCats((v) => !v)} className={cn("text-[10.5px] font-bold", "text-sky-400")}>
                {showAllCats ? "نمایش کمتر" : "مشاهده همه"}
              </button>
            )}
          </div>
          {allCats.length === 0 && <p className={cn("text-xs", theme.textMuted)}>هنوز داده‌ای نیست.</p>}
          {allCats.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {visibleCats.map((c, idx) => (
                <CategoryCard key={c.cat} theme={theme} categoryId={c.cat} c={c} colorIdx={idx} categories={data.categories} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   STACK PROGRESS CHART (UI layer — reads only from buildStackProgressChartData)
   ===================================================================== */

function StackProgressChart({ data, theme }) {
  const [rangeKey, setRangeKey] = useState("30d");
  const range = STACK_HISTORY_RANGE_OPTIONS.find((r) => r.key === rangeKey) || STACK_HISTORY_RANGE_OPTIONS[1];
  const { rows, stacks } = useMemo(() => buildStackProgressChartData(data, range.days), [data, range.days]);

  const [hiddenIds, setHiddenIds] = useState(() => new Set());
  const toggleStack = (id) => setHiddenIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const visibleStacks = stacks.filter((s) => !hiddenIds.has(s.id));

  // Compact date tick — only show a handful of labels regardless of range length,
  // so a 90-day axis doesn't turn into unreadable overlapping text on mobile.
  const tickIndices = useMemo(() => {
    const maxTicks = 5;
    const step = Math.max(1, Math.ceil(rows.length / maxTicks));
    return new Set(rows.map((_, i) => i).filter((i) => i % step === 0 || i === rows.length - 1));
  }, [rows.length]);

  const formatTick = (idx) => {
    if (!tickIndices.has(idx)) return "";
    const d = rows[idx]?.date;
    if (!d) return "";
    const dt = new Date(d + "T00:00:00");
    return `${dt.getMonth() + 1}/${dt.getDate()}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    const dt = new Date(label + "T00:00:00");
    const dateLabel = dt.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    return (
      <div className={cn("rounded-xl border p-2.5 text-xs", theme.cardPrimary, theme.border)} style={{ minWidth: 140 }}>
        <div className={cn("font-bold mb-1.5", theme.text)}>{dateLabel}</div>
        <div className="flex flex-col gap-1">
          {payload
            .filter((p) => p.value != null)
            .map((p) => {
              const meta = stacks.find((s) => s.id === p.dataKey);
              const rec = data.archive[label]?.stackStats?.[p.dataKey];
              const fraction = label === data.todayDate
                ? (() => {
                    const t = data.tasks.filter((tk) => tk.stackId === p.dataKey);
                    return t.length ? `${t.filter((tk) => tk.completed).length} / ${t.length} Tasks` : "";
                  })()
                : rec ? `${rec.completed} / ${rec.total} Tasks` : "";
              return (
                <div key={p.dataKey} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ACCENT_HEX[meta?.color] || ACCENT_HEX.violet }} />
                    <span className={theme.textMuted}>{meta?.name || p.dataKey}</span>
                  </span>
                  <span className={cn("font-bold", theme.text)}>{p.value}% <span className={cn("font-normal", theme.textMuted)}>({fraction})</span></span>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("rounded-2xl p-4 border", theme.cardSecondary, theme.border)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn("text-xs font-bold", theme.text)}>Stack Progress</h3>
        <div className={cn("flex items-center rounded-xl p-0.5 gap-0.5", theme.subtleBg)}>
          {STACK_HISTORY_RANGE_OPTIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => setRangeKey(r.key)}
              className={cn(
                "text-[10px] font-bold px-2 py-1 rounded-lg transition-colors",
                rangeKey === r.key ? cn(theme.accentBg, "text-slate-900") : theme.textMuted
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {stacks.length === 0 ? (
        <p className={cn("text-xs py-6 text-center", theme.textMuted)}>هنوز داده‌ای برای این بازه نیست.</p>
      ) : (
        <>
          {/* Legend — tap a Stack to toggle its line. Scrolls horizontally instead of
              wrapping into a wall of text when there are many Stacks. */}
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-scrollbar pb-1">
            {stacks.map((s) => {
              const hidden = hiddenIds.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleStack(s.id)}
                  className={cn(
                    "flex items-center gap-1.5 text-[10.5px] font-semibold px-2 py-1 rounded-full border shrink-0 transition-opacity",
                    theme.border,
                    hidden ? "opacity-35" : "opacity-100",
                    theme.subtleBg
                  )}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ACCENT_HEX[s.color] || ACCENT_HEX.violet }} />
                  <span className={theme.text}>{s.name}</span>
                  {s.archived && <span className={theme.textMuted}>(آرشیو)</span>}
                </button>
              );
            })}
          </div>

          <div className="w-full overflow-x-auto no-scrollbar">
            <div style={{ minWidth: 280, width: "100%", height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.isDark ? "#1e293b" : "#e7e5e4"} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v, idx) => formatTick(idx)}
                    tick={{ fontSize: 9, fill: theme.isDark ? "#94a3b8" : "#78716c" }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 50, 100]}
                    tick={{ fontSize: 9, fill: theme.isDark ? "#94a3b8" : "#78716c" }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {visibleStacks.map((s) => (
                    <Line
                      key={s.id}
                      type="monotone"
                      dataKey={s.id}
                      name={s.name}
                      stroke={ACCENT_HEX[s.color] || ACCENT_HEX.violet}
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                      activeDot={{ r: 3 }}
                      strokeDasharray={s.archived ? "4 3" : undefined}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Small shared line-chart shell used by both Daily Score and XP Growth — same
// range selector pattern, tooltip style, and responsive container as Stack
// Progress, just single-line instead of multi-line.
function SingleLineChart({ theme, title, rows, dataKey, color, yDomain, yTicks, formatValue, emptyLabel, decimals = 0 }) {
  const [rangeKey, setRangeKey] = useState("30d");
  const range = STACK_HISTORY_RANGE_OPTIONS.find((r) => r.key === rangeKey) || STACK_HISTORY_RANGE_OPTIONS[1];
  const slicedRows = useMemo(() => rows(range.days), [rows, range.days]);
  const hasAnyData = slicedRows.some((r) => r[dataKey] != null);

  const tickIndices = useMemo(() => {
    const maxTicks = 5;
    const step = Math.max(1, Math.ceil(slicedRows.length / maxTicks));
    return new Set(slicedRows.map((_, i) => i).filter((i) => i % step === 0 || i === slicedRows.length - 1));
  }, [slicedRows.length]);
  const formatTick = (idx) => {
    if (!tickIndices.has(idx)) return "";
    const d = slicedRows[idx]?.date;
    if (!d) return "";
    const dt = new Date(d + "T00:00:00");
    return `${dt.getMonth() + 1}/${dt.getDate()}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0 || payload[0].value == null) return null;
    const dt = new Date(label + "T00:00:00");
    const dateLabel = dt.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    return (
      <div className={cn("rounded-xl border p-2.5 text-xs", theme.cardPrimary, theme.border)}>
        <div className={cn("font-bold mb-1", theme.text)}>{dateLabel}</div>
        <div className={cn("font-bold", theme.text)} style={{ color }}>{formatValue ? formatValue(payload[0].value) : payload[0].value}</div>
      </div>
    );
  };

  return (
    <div className={cn("rounded-2xl p-4 border", theme.cardSecondary, theme.border)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn("text-xs font-bold", theme.text)}>{title}</h3>
        <div className={cn("flex items-center rounded-xl p-0.5 gap-0.5", theme.subtleBg)}>
          {STACK_HISTORY_RANGE_OPTIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => setRangeKey(r.key)}
              className={cn(
                "text-[10px] font-bold px-2 py-1 rounded-lg transition-colors",
                rangeKey === r.key ? cn(theme.accentBg, "text-slate-900") : theme.textMuted
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      {!hasAnyData ? (
        <p className={cn("text-xs py-6 text-center", theme.textMuted)}>{emptyLabel}</p>
      ) : (
        <div className="w-full overflow-x-auto no-scrollbar">
          <div style={{ minWidth: 280, width: "100%", height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={slicedRows} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.isDark ? "#1e293b" : "#e7e5e4"} vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v, idx) => formatTick(idx)}
                  tick={{ fontSize: 9, fill: theme.isDark ? "#94a3b8" : "#78716c" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  domain={yDomain}
                  ticks={yTicks}
                  tick={{ fontSize: 9, fill: theme.isDark ? "#94a3b8" : "#78716c" }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} connectNulls={false} activeDot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function DailyScoreChart({ data, theme }) {
  return (
    <SingleLineChart
      theme={theme}
      title="Daily Score"
      rows={(days) => buildDailyScoreChartData(data, days)}
      dataKey="score"
      color={ACCENT_HEX[theme.accentColor] || ACCENT_HEX.amber}
      yDomain={[0, 100]}
      yTicks={[0, 50, 100]}
      formatValue={(v) => `${v} / 100`}
      emptyLabel="هنوز Daily Score کافی برای این بازه ثبت نشده."
    />
  );
}

function XpGrowthChart({ data, theme }) {
  return (
    <SingleLineChart
      theme={theme}
      title="XP Growth"
      rows={(days) => buildXpGrowthChartData(data, days)}
      dataKey="xp"
      color={ACCENT_HEX.violet}
      yDomain={[0, "auto"]}
      yTicks={undefined}
      formatValue={(v) => `${v} XP`}
      emptyLabel="هنوز رشد XP کافی برای این بازه ثبت نشده."
    />
  );
}

function CategoryCard({ theme, categoryId, c, colorIdx, categories }) {
  const catDef = categories?.find((cat) => cat.id === categoryId);
  const color = catDef?.color || CATEGORY_COLORS[colorIdx % CATEGORY_COLORS.length];
  const label = catDef?.name || "Uncategorized";
  return (
    <div className={cn("rounded-2xl p-3 flex flex-col items-center gap-1 border", theme.cardSmall, theme.border)}>
      <CircularProgress percent={c.effort} size={62} stroke={6} label={`${c.effort}%`} trackColor={theme.ringTrack} barColor={`text-${color}-400`} />
      <div className="flex items-center gap-1 mt-0.5">
        {catDef && <IconGlyph id={catDef.iconId} size={11} className={`text-${color}-400`} />}
        <span className={cn("text-[11px] font-bold truncate max-w-full", theme.text)}>{label}</span>
      </div>
      <span className={cn("text-[10px]", theme.textMuted)}>{c.completedXp} / {c.plannedXp} XP</span>
      <div className={cn("w-full grid grid-cols-3 gap-1 mt-1.5 pt-1.5 border-t", theme.border)}>
        <div className="flex flex-col items-center">
          <span className={cn("text-[9px] font-bold", theme.textMuted)}>XP</span>
          <span className={cn("text-[10px] font-bold", theme.text)}>{c.effort}%</span>
        </div>
        <div className="flex flex-col items-center">
          <span className={cn("text-[9px] font-bold", theme.textMuted)}>TASKS</span>
          <span className={cn("text-[10px] font-bold", theme.text)}>{c.completion}%</span>
        </div>
        <div className="flex flex-col items-center">
          <span className={cn("text-[9px] font-bold", theme.textMuted)}>DAYS</span>
          <span className={cn("text-[10px] font-bold", theme.text)}>{c.consistency}%</span>
        </div>
      </div>
    </div>
  );
}

function StatRing({ theme, icon, label, centerLabel, percent, colorClass, caption }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <CircularProgress percent={percent} size={68} stroke={6} label={centerLabel} trackColor={theme.ringTrack} barColor={colorClass} />
      <div className="flex items-center gap-1">
        {icon}
        <span className={cn("text-[9.5px] font-bold tracking-wide", theme.textMuted)}>{label}</span>
      </div>
      {caption && <span className={cn("text-[9px]", theme.textMuted)}>{caption}</span>}
    </div>
  );
}

function MiniStat({ theme, label, value, icon }) {
  return (
    <div className={cn("rounded-2xl p-3 border flex flex-col gap-1", theme.cardSmall, theme.border)}>
      <div className="flex items-center gap-1.5">{icon}<span className={cn("text-[10px]", theme.textMuted)}>{label}</span></div>
      <span className={cn("text-base font-extrabold", theme.text)}>{value}</span>
    </div>
  );
}

function SummaryStat({ theme, label, value }) {
  return (
    <div className="flex flex-col items-center text-center gap-0.5">
      <span className={cn("text-sm font-extrabold", theme.text)}>{value}</span>
      <span className={cn("text-[9px] leading-tight", theme.textMuted)}>{label}</span>
    </div>
  );
}

/* =====================================================================
   REWARDS
   ===================================================================== */

function RewardsView({ rewards, coins, theme, onAdd, onRedeem, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [cost, setCost] = useState(20);
  const [icon, setIcon] = useState("package");
  const [color, setColor] = useState("amber");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [deletingReward, setDeletingReward] = useState(null);
  const isDebt = coins < 0;

  return (
    <div className="flex flex-col gap-2.5 pb-24">
      <SectionTitle icon={<Gift size={15} className="text-rose-400" />} theme={theme}
        right={<button onClick={() => setAdding(true)} className={cn("text-[11px] font-semibold px-2 py-1 rounded-full", theme.subtleBg, theme.textMuted)}>+ جایزه</button>}
      >
        LOOT
      </SectionTitle>

      <div className={cn("rounded-2xl p-4 border flex items-center justify-between", theme.cardPrimary, theme.border)}>
        <span className={cn("flex items-center gap-1.5 text-xs font-bold tracking-wide", theme.textMuted)}><Coins size={13} /> COINS</span>
        <span key={coins} className={cn("flex items-center gap-1.5 text-2xl font-extrabold xp-bump", isDebt ? "text-rose-400" : theme.accentText)}>
          <Coins size={19} />{coins.toLocaleString("fa-IR")}
        </span>
      </div>
      {isDebt && (
        <p className={cn("text-[10.5px] px-1", theme.textMuted)}>
          Coin منفیه — یعنی یک Task را بعد از خرج کردن Coinش Undo کردی. با کارهای بعدی جبران می‌شود.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {rewards.map((r) => {
          const canAfford = coins >= r.cost;
          const rewardColor = r.color || "amber";
          return (
            <div key={r.id} className={cn("rounded-2xl p-3.5 border flex flex-col items-center gap-1.5 text-center", theme.cardSecondary, theme.border)}>
              <button onClick={() => setDeletingReward(r)} className="self-end -mt-1 -ml-1 text-rose-400/70"><X size={13} /></button>
              <span className={cn(`bg-${rewardColor}-400/15`, "w-12 h-12 rounded-xl flex items-center justify-center -mt-2")}>
                <IconGlyph id={r.icon} size={22} className={`text-${rewardColor}-400`} />
              </span>
              <span className={cn("text-xs font-bold leading-tight", theme.text)}>{r.name}</span>
              <span className={cn("text-[11px] font-bold", theme.accentText)}>{r.cost} COINS</span>
              <button
                disabled={!canAfford}
                onClick={() => onRedeem(r)}
                className={cn(
                  "w-full mt-1 text-[11px] font-bold px-3 py-1.5 rounded-full",
                  canAfford ? cn(theme.accentBg, "text-slate-900") : cn(theme.subtleBg, theme.textMuted)
                )}
              >
                {canAfford ? "دریافت" : `نیاز به ${r.cost} Coin`}
              </button>
            </div>
          );
        })}
      </div>

      {adding && (
        <Modal title="جایزه جدید" onClose={() => setAdding(false)} theme={theme}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowIconPicker(true)}
                className={cn("w-14 h-14 shrink-0 rounded-xl border flex items-center justify-center", theme.border, theme.inputBg)}
              >
                <IconGlyph id={icon} size={22} className={`text-${color}-400`} />
              </button>
              <div className="flex-1 flex flex-col gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام جایزه" className={cn("text-sm rounded-xl px-3 py-2 border outline-none", theme.inputBg, theme.border, theme.text)} />
                <ColorSwatchPicker value={color} onChange={setColor} />
              </div>
            </div>
            <input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} placeholder="تعداد Coin لازم" className={cn("text-sm rounded-xl px-3 py-2 border outline-none", theme.inputBg, theme.border, theme.text)} />
            <button
              disabled={!name.trim() || cost <= 0}
              onClick={() => { onAdd({ id: uid("reward"), name: name.trim(), cost, icon, color }); setAdding(false); setName(""); setCost(20); setIcon("package"); setColor("amber"); }}
              className="py-2.5 rounded-xl bg-rose-400 text-white text-sm font-extrabold disabled:opacity-40"
            >
              افزودن جایزه
            </button>
            {showIconPicker && (
              <Modal title="انتخاب آیکون" onClose={() => setShowIconPicker(false)} theme={theme}>
                <IconPicker theme={theme} value={icon} onChange={setIcon} />
                <button onClick={() => setShowIconPicker(false)} className={cn("w-full mt-3 py-2 rounded-xl text-sm font-bold text-slate-900", theme.accentBg)}>تأیید</button>
              </Modal>
            )}
          </div>
        </Modal>
      )}
      {deletingReward && (
        <ConfirmModal
          theme={theme}
          title="حذف جایزه؟"
          body={`«${deletingReward.name}» از لیست جایزه‌ها حذف می‌شود. تاریخچه Redeemهای قبلی این جایزه دست‌نخورده می‌ماند.`}
          confirmLabel="حذف جایزه"
          onCancel={() => setDeletingReward(null)}
          onConfirm={() => { onDelete(deletingReward.id); setDeletingReward(null); }}
        />
      )}
    </div>
  );
}

/* =====================================================================
   BOTTOM NAV
   ===================================================================== */

function BottomNav({ tab, setTab, theme }) {
  const items = [
    { key: "home", label: "خانه", icon: Home },
    { key: "habits", label: "عادت‌ها", icon: Target },
    { key: "stats", label: "آمار", icon: BarChart3 },
    { key: "rewards", label: "جوایز", icon: Gift },
  ];
  return (
    <div className={cn("fixed bottom-0 inset-x-0 border-t backdrop-blur-md z-40", theme.navBg, theme.border)}>
      <div className="max-w-md mx-auto grid grid-cols-4 py-1.5 px-1.5">
        {items.map((it) => {
          const Icon = it.icon;
          const active = tab === it.key;
          return (
            <button key={it.key} onClick={() => setTab(it.key)} className="flex flex-col items-center gap-1 py-1.5">
              <span className={cn("flex items-center justify-center w-9 h-7 rounded-lg transition-colors", active && theme.accentSoftBg)}>
                <Icon size={18} className={active ? theme.accentText : theme.textMuted} strokeWidth={active ? 2.3 : 2} />
              </span>
              <span className={cn("text-[10px] font-semibold", active ? theme.accentText : theme.textMuted)}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =====================================================================
   HABIT ↔ TASK AUTO-LINKING
   If a Habit is linked to one or more Tasks (by templateId for recurring
   Stack tasks, or by literal id for one-off tasks) and/or to a Stack,
   completing any matching Task automatically marks the Habit done for the
   day — with NO extra XP, to avoid double-counting. Manual habit toggles
   (xpSourceToday: "manual") are never overwritten by this recompute.
   ===================================================================== */

/* =====================================================================
   ECONOMY — SINGLE SOURCE OF TRUTH
   Every XP-affecting number (task XP, Stack Bonus) is *derived fresh* from
   the current tasks/stacks every time, never incrementally cached. This is
   what makes every mutation path — complete, undo, edit XP, edit stack,
   add task to a stack, delete a task, delete a stack — automatically
   correct with no special-casing: whatever the "before" and "after" totals
   are, the difference is exactly the XP that should be applied.

   stackBonusGiven is kept in `today` purely as a *cache* for the UI (which
   stacks are glowing "complete" right now) — it is never read to decide how
   much XP to award; computeStackBonusSet() rebuilds it from scratch here.
   ===================================================================== */

function computeTaskXp(tasks) {
  return tasks.reduce((total, t) => total + (t.completed ? (t.xp || 0) : 0), 0);
}

function computeEarnedXp(tasks) {
  // Lifetime/task XP only. Stack Bonus is intentionally NOT derived here because
  // a paid Stack Bonus is a one-time event for a specific Stack on a specific day.
  return computeTaskXp(tasks);
}

function computeStackBonusSet(tasks, stacks) {
  const set = [];
  stacks.forEach((stack) => {
    const stackTasks = tasks.filter((t) => t.stackId === stack.id);
    if (stackTasks.length > 0 && stackTasks.every((t) => t.completed)) set.push(stack.id);
  });
  return set;
}

// Every handler that can touch tasks/stacks/habits goes through this. `updater`
// receives the previous data and returns only the fields it actually changed
// ({ tasks, stacks, habits, todayPatch }); everything economy-related
// (XP delta, Coin, Stack Bonus cache, Habit auto-link recompute) is derived
// centrally here so no individual handler can under- or over-apply XP.
function applyEconomyMutation(prev, updater) {
  const result = updater(prev) || {};
  const tasks = result.tasks ?? prev.tasks;
  const stacks = result.stacks ?? prev.stacks;
  const beforeTaskXp = computeEarnedXp(prev.tasks);
  const afterTaskXp = computeEarnedXp(tasks);
  const taskXpDelta = afterTaskXp - beforeTaskXp;

  const beforeCompletedStacks = new Set(computeStackBonusSet(prev.tasks, prev.stacks));
  const afterCompletedStacks = computeStackBonusSet(tasks, stacks);
  const alreadyClaimed = new Set(prev.today.stackBonusGiven || []);
  // A bonus is paid only when a Stack becomes complete for the first time that day.
  // If the user later adds another Task and makes the Stack incomplete, the old
  // bonus is NOT taken back. Completing it again also does NOT pay a second bonus.
  const newlyClaimed = afterCompletedStacks.filter(
    (id) => !beforeCompletedStacks.has(id) && !alreadyClaimed.has(id)
  );
  const stackBonusGiven = Array.from(new Set([...alreadyClaimed, ...newlyClaimed]));
  const xpDelta = taskXpDelta + newlyClaimed.length * STACK_BONUS_XP;
  const habits = recomputeAutoHabits(result.habits ?? prev.habits, tasks, prev.todayDate);

  return {
    ...prev,
    tasks,
    stacks,
    habits,
    profile: applyXpToProfile(prev.profile, xpDelta),
    today: {
      ...prev.today,
      ...(result.todayPatch || {}),
      xpEarned: Math.max(0, prev.today.xpEarned + xpDelta),
      stackBonusGiven,
    },
  };
}

/* Habit streaks are *derived from history*, never incrementally trusted. Given
   the set of dates a Habit was completed on, the current streak is just "how
   many consecutive days ending today (or yesterday, if today isn't done yet)
   are present" — recomputing this from scratch on every mutation (and on each
   daily rollover) means the streak can never drift out of sync with history,
   survives reload perfectly, and self-heals if a day was silently skipped. */
function computeHabitStreak(history, todayDate) {
  if (!history || history.length === 0) return 0;
  const set = new Set(history);
  const yesterday = addDaysStr(todayDate, -1);
  let cursor;
  if (set.has(todayDate)) cursor = todayDate;
  else if (set.has(yesterday)) cursor = yesterday; // still "alive" — today just hasn't happened yet
  else return 0;
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = addDaysStr(cursor, -1);
  }
  return streak;
}

function recomputeAutoHabits(habits, tasks, dateStr) {
  return habits.map((h) => {
    const hasTaskLinks = h.linkedTaskIds && h.linkedTaskIds.length > 0;
    const hasStackLink = !!h.linkedStackId;
    if (!hasTaskLinks && !hasStackLink) {
      // No active trigger left at all (e.g. its Stack was deleted and it had no
      // task links either) — an existing auto-completion must be cleared, but a
      // manual one is left untouched.
      if (h.doneToday && h.xpSourceToday === "auto") {
        const history = h.history.filter((d) => d !== dateStr);
        return { ...h, doneToday: false, xpSourceToday: null, history, streak: computeHabitStreak(history, dateStr) };
      }
      return h;
    }

    // Triggers only if this exact habit is bound to the task (by id/templateId)
    // OR bound to the stack the task belongs to — never "any stack completes any habit".
    // Both link types are OR'd together: either one firing is enough.
    const anyLinkedDone = tasks.some(
      (t) =>
        t.completed &&
        ((hasTaskLinks && (h.linkedTaskIds.includes(t.id) || (t.templateId && h.linkedTaskIds.includes(t.templateId)))) ||
          (hasStackLink && t.stackId === h.linkedStackId))
    );

    if (anyLinkedDone && !h.doneToday) {
      // A linked Task just got completed — auto-complete the Habit. No Habit XP is granted;
      // the Task already carried the XP for this activity (xpSourceToday marks *why* it's done).
      const history = h.history.includes(dateStr) ? h.history : [...h.history, dateStr];
      const streak = computeHabitStreak(history, dateStr);
      return { ...h, doneToday: true, xpSourceToday: "auto", history, streak, bestStreak: Math.max(h.bestStreak, streak) };
    }
    if (!anyLinkedDone && h.doneToday && h.xpSourceToday === "auto") {
      // The linked Task was undone (or deleted, or moved out of the linked Stack, or the
      // link itself was removed) — undo the auto-completion. No XP is reversed here
      // because none was ever granted for the auto path. This branch is only reached
      // when xpSourceToday === "auto" proves *this same day's* auto-completion is the
      // one being undone — a manual completion has xpSourceToday === "manual" and is
      // never touched by this function.
      const history = h.history.filter((d) => d !== dateStr);
      return { ...h, doneToday: false, xpSourceToday: null, history, streak: computeHabitStreak(history, dateStr) };
    }
    return h;
  });
}

/* =====================================================================
   MAIN APP
   ===================================================================== */

export default function App() {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("home");
  const [timeFilter, setTimeFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [levelUpAt, setLevelUpAt] = useState(null);
  const [toast, setToast] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const levelRef = useRef(1);

  // ---- load + rollover ----
  useEffect(() => {
    (async () => {
      let loadedData = null;
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res?.value) loadedData = JSON.parse(res.value);
      } catch {
        loadedData = null;
      }
      let base = migrateData(loadedData);
      base = rollDataForward(base);
      levelRef.current = levelInfo(base.profile.totalXp).level;
      if (base.pendingStreakEvent?.type === "saved") {
        setToast({
          icon: "shield",
          title: "STREAK SAVED!",
          subtitle: `${base.profile.streak} Day Streak Protected`,
          meta: "1 Streak Shield Used",
        });
      }
      base = { ...base, pendingStreakEvent: null };
      setData(base);
      setLoaded(true);
    })();
  }, []);

  // ---- persist ----
  useEffect(() => {
    if (!loaded || !data) return;
    const t = setTimeout(() => {
      window.storage.set(STORAGE_KEY, JSON.stringify(data), false).catch(() => {});
    }, 350);
    return () => clearTimeout(t);
  }, [data, loaded]);

  // ---- level up detection ----
  useEffect(() => {
    if (!data) return;
    const lvl = levelInfo(data.profile.totalXp).level;
    if (lvl > levelRef.current) {
      setLevelUpAt(lvl);
      levelRef.current = lvl;
    } else {
      levelRef.current = lvl;
    }
  }, [data?.profile.totalXp]);

  const [showAchievements, setShowAchievements] = useState(false);

  // ---- achievement unlock check ----
  // Runs whenever anything that could move a metric changes. checkAchievements()
  // is pure and never revokes an existing unlock, so this is safe to run freely —
  // worst case it's a no-op. Any newly-unlocked Achievement gets a short Toast
  // (grants NO XP/Coins — Achievements are recognition-only for now).
  useEffect(() => {
    if (!loaded || !data) return;
    const { achievements, newlyUnlocked } = checkAchievements(data);
    if (newlyUnlocked.length === 0) return;
    setData((prev) => ({ ...prev, achievements }));
    const [first, ...rest] = newlyUnlocked;
    setToast({
      icon: first.icon,
      title: "ACHIEVEMENT UNLOCKED!",
      subtitle: first.title,
      meta: rest.length > 0 ? `+${rest.length} more` : undefined,
    });
  }, [loaded, data]);

  const markAchievementsSeen = () =>
    setData((prev) => {
      const achievements = { ...prev.achievements };
      let changed = false;
      Object.keys(achievements).forEach((id) => {
        if (achievements[id]?.unlocked && !achievements[id]?.seen) {
          achievements[id] = { ...achievements[id], seen: true };
          changed = true;
        }
      });
      return changed ? { ...prev, achievements } : prev;
    });

  const isDark = data?.settings?.theme !== "light";
  const accentColor = data?.settings?.accentColor || "amber";
  const glowIntensity = data?.settings?.glowIntensity || "medium";
  const theme = useMemo(() => buildTheme(isDark, accentColor, glowIntensity), [isDark, accentColor, glowIntensity]);

  const sortedTasks = useMemo(() => {
    if (!data) return [];
    let list = [...data.tasks].sort((a, b) => a.order - b.order);
    if (timeFilter !== "all") list = list.filter((t) => t.timeOfDay === timeFilter);
    return list;
  }, [data, timeFilter]);

  if (!loaded || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className={cn("animate-spin", theme.accentText)} size={28} />
      </div>
    );
  }

  /* ---------- handlers ---------- */

  // NOTE: there is intentionally no standalone "addXp"/"addCoin" helper here.
  // Every path that can change XP or Coins goes through applyEconomyMutation
  // (Task/Stack changes) or applyXpToProfile directly inside a handler that
  // itself is the single, auditable place that XP number changes (Habit
  // manual toggle, Reward redemption). This is deliberate — see V10 refactor.

  const toggleTask = (taskId) => {
    setData((prev) =>
      applyEconomyMutation(prev, () => {
        const target = prev.tasks.find((t) => t.id === taskId);
        if (!target) return {};
        const tasks = prev.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
        const delta = target.completed ? -1 : 1;
        return { tasks, todayPatch: { tasksCompleted: Math.max(0, prev.today.tasksCompleted + delta) } };
      })
    );
  };

  const toggleSubtask = (taskId, subId) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)) } : t
      ),
    }));
  };

  const moveTask = (taskId, dir) => {
    setData((prev) => {
      const tasks = [...prev.tasks];
      const idx = tasks.findIndex((t) => t.id === taskId);
      const swapIdx = idx + dir;
      if (idx < 0 || swapIdx < 0 || swapIdx >= tasks.length) return prev;
      [tasks[idx].order, tasks[swapIdx].order] = [tasks[swapIdx].order, tasks[idx].order];
      [tasks[idx], tasks[swapIdx]] = [tasks[swapIdx], tasks[idx]];
      return { ...prev, tasks };
    });
  };

  const deleteTask = (taskId) => {
    setData((prev) =>
      applyEconomyMutation(prev, () => {
        const target = prev.tasks.find((t) => t.id === taskId);
        if (!target) return {};
        const tasks = prev.tasks.filter((t) => t.id !== taskId);
        const completedDelta = target.completed ? -1 : 0;
        return {
          tasks,
          todayPatch: {
            tasksTotal: Math.max(0, prev.today.tasksTotal - 1),
            tasksCompleted: Math.max(0, prev.today.tasksCompleted + completedDelta),
          },
        };
      })
    );
  };

  const saveTask = (payload) => {
    setData((prev) =>
      applyEconomyMutation(prev, () => {
        if (editingTask) {
          // Recomputed centrally: XP diff (only if still/now completed), old & new
          // Stack Bonus eligibility, and any Habit auto-links — all derived fresh
          // from the edited task, whether XP, Stack, or both changed.
          const tasks = prev.tasks.map((t) => (t.id === editingTask.id ? { ...t, ...payload } : t));
          return { tasks };
        }
        const newTask = { id: uid("task"), templateId: null, completed: false, order: prev.tasks.length, createdDate: prev.todayDate, date: prev.todayDate, ...payload };
        return { tasks: [...prev.tasks, newTask], todayPatch: { tasksTotal: prev.today.tasksTotal + 1 } };
      })
    );
    setShowAdd(false);
    setEditingTask(null);
  };

  const addStackTask = (stackId, payload) => {
    setData((prev) =>
      applyEconomyMutation(prev, () => {
        const templateId = uid("tpl");
        const stacks = prev.stacks.map((s) =>
          s.id === stackId ? { ...s, taskTemplates: [...s.taskTemplates, { id: templateId, ...payload }] } : s
        );
        const newTask = {
          id: uid("task"), templateId, title: payload.title, desc: "", categoryId: payload.categoryId, difficulty: payload.difficulty, xp: payload.xp,
          estMinutes: 15, timeOfDay: "morning", stackId, completed: false, subtasks: [],
          order: prev.tasks.length, createdDate: prev.todayDate, date: prev.todayDate,
        };
        // Adding a new task may make a completed Stack incomplete again, but any
        // Stack Bonus already paid today is an event and is intentionally NOT reversed.
        return { stacks, tasks: [...prev.tasks, newTask], todayPatch: { tasksTotal: prev.today.tasksTotal + 1 } };
      })
    );
  };

  // Archiving a Stack (not hard-deleting it) is what makes its Stack Progress
  // history in Statistics survive: the Stack object — with its id, name, color,
  // createdDate — keeps existing, just flagged `archived: true`. That stops it
  // from generating new daily Tasks (tasksFromStacks skips archived Stacks) and
  // hides it from the active Daily Stacks list, while every already-archived
  // `archive[date].stackStats[stackId]` entry for it remains fully readable.
  const archiveStack = (stackId) => {
    setData((prev) =>
      applyEconomyMutation(prev, () => {
        const stackToArchive = prev.stacks.find((s) => s.id === stackId);
        if (!stackToArchive) return {};
        const orphanedTemplateIds = stackToArchive.taskTemplates.map((t) => t.id);
        const stacks = prev.stacks.map((s) => (s.id === stackId ? { ...s, archived: true } : s));
        const tasks = prev.tasks.map((t) => (t.stackId === stackId ? { ...t, stackId: null } : t));
        // Task XP stays. Any Stack Bonus already paid today is an event and remains
        // paid even if archiving changes the current Stack state. Any Habit linked to
        // this Stack, or to one of its task templates, is
        // unlinked so no invisible dangling connection survives; a manual completion is
        // left untouched, only a live auto-completion is reverted.
        const habits = prev.habits.map((h) => ({
          ...h,
          linkedStackId: h.linkedStackId === stackId ? null : h.linkedStackId,
          linkedTaskIds: h.linkedTaskIds.filter((id) => !orphanedTemplateIds.includes(id)),
        }));
        return { stacks, tasks, habits };
      })
    );
  };

  const addStack = (stack) =>
    setData((prev) => ({ ...prev, stacks: [...prev.stacks, { ...stack, createdDate: prev.todayDate, archived: false }] }));

  const createCategory = (cat) => setData((prev) => ({ ...prev, categories: [...(prev.categories || []), cat] }));

  const useIcon = (iconId) =>
    setData((prev) => {
      const recent = [iconId, ...(prev.settings.recentIconIds || []).filter((id) => id !== iconId)].slice(0, 12);
      return { ...prev, settings: { ...prev.settings, recentIconIds: recent } };
    });
  const toggleFavoriteIcon = (iconId) =>
    setData((prev) => {
      const favs = prev.settings.favoriteIconIds || [];
      const next = favs.includes(iconId) ? favs.filter((id) => id !== iconId) : [...favs, iconId];
      return { ...prev, settings: { ...prev.settings, favoriteIconIds: next } };
    });

  const toggleHabit = (habitId) => {
    setData((prev) => {
      const target = prev.habits.find((h) => h.id === habitId);
      if (!target) return prev;

      let xpDelta = 0;
      let updated;

      if (!target.doneToday) {
        // Turning ON manually — this is always a genuine manual completion, XP is granted.
        const history = target.history.includes(prev.todayDate) ? target.history : [...target.history, prev.todayDate];
        const streak = computeHabitStreak(history, prev.todayDate);
        xpDelta = target.xp;
        updated = { ...target, doneToday: true, xpSourceToday: "manual", history, streak, bestStreak: Math.max(target.bestStreak, streak) };
      } else if (target.xpSourceToday === "auto") {
        // Turning OFF a habit that was auto-completed by a linked Task — no XP was ever
        // granted for it, so none is reversed. This mirrors recomputeAutoHabits's own undo path.
        const history = target.history.filter((d) => d !== prev.todayDate);
        xpDelta = 0;
        updated = { ...target, doneToday: false, xpSourceToday: null, history, streak: computeHabitStreak(history, prev.todayDate) };
      } else {
        // Turning OFF a habit that was manually completed — reverse its own XP.
        const history = target.history.filter((d) => d !== prev.todayDate);
        xpDelta = -target.xp;
        updated = { ...target, doneToday: false, xpSourceToday: null, history, streak: computeHabitStreak(history, prev.todayDate) };
      }

      const habits = prev.habits.map((h) => (h.id === habitId ? updated : h));
      return {
        ...prev,
        habits,
        profile: applyXpToProfile(prev.profile, xpDelta),
        today: { ...prev.today, xpEarned: Math.max(0, prev.today.xpEarned + xpDelta) },
      };
    });
  };

  // Habit create/edit/delete now go through the same "recompute against current
  // Tasks" pass Task/Stack mutations use (V10: Habit joins the single source of
  // truth) — so e.g. linking a new Habit to an already-completed Task marks it
  // done immediately, and removing a link clears a stale auto-completion right away.
  const addHabit = (habit) =>
    setData((prev) => {
      const habits = recomputeAutoHabits([...prev.habits, habit], prev.tasks, prev.todayDate);
      return { ...prev, habits };
    });

  const updateHabit = (id, payload) =>
    setData((prev) => {
      const habits = recomputeAutoHabits(prev.habits.map((h) => (h.id === id ? { ...h, ...payload } : h)), prev.tasks, prev.todayDate);
      return { ...prev, habits };
    });

  // Deleting a Habit never touches XP — any XP it (or a Task auto-linked to it)
  // already earned is part of the user's historical progress and stays exactly
  // as-is. Only the Habit itself (its tracking/streak/links) is removed.
  const deleteHabit = (id) => setData((prev) => ({ ...prev, habits: prev.habits.filter((h) => h.id !== id) }));

  const addReward = (r) => setData((prev) => ({ ...prev, rewards: [...prev.rewards, r] }));
  const deleteReward = (id) => setData((prev) => ({ ...prev, rewards: prev.rewards.filter((r) => r.id !== id) }));
  const redeemReward = (r) => {
    if (!data || getCoinBalance(data.profile) < r.cost) return;
    setData((prev) => {
      if (getCoinBalance(prev.profile) < r.cost) return prev;
      return {
        ...prev,
        profile: { ...prev.profile, coinBalance: (prev.profile.coinBalance || 0) - r.cost },
        redeemedLog: [...prev.redeemedLog, { id: uid("log"), rewardId: r.id, name: r.name, cost: r.cost, date: prev.todayDate }],
      };
    });
    setToast({ icon: "gem", title: "REWARD UNLOCKED!", subtitle: r.name, meta: `-${r.cost} Coins` });
  };

  const toggleTheme = () => setData((prev) => ({ ...prev, settings: { ...prev.settings, theme: prev.settings.theme === "light" ? "dark" : "light" } }));
  const updateWeeklyGoal = (goal) =>
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, weeklyXpGoal: Math.min(MAX_WEEKLY_XP_GOAL, Math.max(MIN_WEEKLY_XP_GOAL, Math.round(goal) || DEFAULT_WEEKLY_XP_GOAL)) },
    }));

  const updateSettings = (patch) => setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));

  const exportData = () => {
    if (!data) return;
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `daily-quest-backup-${data.todayDate}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  };

  const importData = (rawText) => {
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return { ok: false, error: "فایل JSON معتبر نیست." };
    }
    if (!parsed || typeof parsed !== "object" || !parsed.profile || typeof parsed.profile !== "object" || !Array.isArray(parsed.tasks)) {
      return { ok: false, error: "این فایل ساختار معتبر Daily Quest ندارد." };
    }
    // Validate fully before touching any live state — if migration itself throws
    // on some deeper malformed shape, the current (good) data is left untouched.
    try {
      const migrated = migrateData(parsed);
      setData(migrated);
      levelRef.current = levelInfo(migrated.profile.totalXp).level;
      window.storage.set(STORAGE_KEY, JSON.stringify(migrated), false).catch(() => {});
      return { ok: true };
    } catch {
      return { ok: false, error: "فایل معتبر است ولی قابل بازیابی نیست." };
    }
  };

  const resetAll = async () => {
    const fresh = makeDefaultData();
    setData(fresh);
    levelRef.current = 1;
    setShowSettings(false);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(fresh), false); } catch {}
  };

  /* ---------- derived ---------- */

  return (
    <div dir="rtl" className={cn("min-h-screen font-sans relative", theme.appBg, theme.text)}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: theme.pageBg }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: theme.pageGlow }}
      />
      <style>{`
        @keyframes xpBump { 0% { transform: scale(1); } 30% { transform: scale(1.14); } 100% { transform: scale(1); } }
        .xp-bump { display: inline-block; animation: xpBump 0.4s ease-out; }
        @keyframes toastIn { 0% { transform: translateY(-130%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes toastOut { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-130%); opacity: 0; } }
        .toast-in { animation: toastIn 0.35s cubic-bezier(.22,.9,.32,1.2) forwards; }
        .toast-out { animation: toastOut 0.3s ease-in forwards; }
        @keyframes shieldPulse { 0% { transform: scale(1); } 50% { transform: scale(1.35); } 100% { transform: scale(1); } }
        .shield-pulse { display: inline-block; animation: shieldPulse 0.5s ease-out; }
        @keyframes barRise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .bar-rise { transform-origin: bottom; animation: barRise 0.6s ease-out both; }
        @keyframes taskPop { 0% { transform: scale(1); } 45% { transform: scale(1.18); } 100% { transform: scale(1); } }
        .task-pop { animation: taskPop 0.35s ease-out; }
        @keyframes stackGlow { 0%, 100% { box-shadow: 0 0 0 rgba(52,211,153,0); } 40% { box-shadow: 0 0 22px rgba(52,211,153,0.45); } }
        .stack-complete-glow { animation: stackGlow 0.9s ease-out; }
        ${data.settings?.animationEnabled === false ? `
        *, *::before, *::after {
          animation-duration: 0.001ms !important;
          animation-delay: 0s !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }
        ` : ""}
      `}</style>
      <div className="relative max-w-md mx-auto px-3.5 pt-4 pb-28 flex flex-col gap-3.5">
        {tab === "home" && (() => {
          const visible = data.settings?.homeVisible || {};
          const layout = data.settings?.homeLayout || ["level", "progress", "achievements", "stacks", "tasks"];
          const sections = {
            level: <LevelHeader profile={data.profile} theme={theme} isDark={isDark} onToggleTheme={toggleTheme} celebrate={!!levelUpAt} coins={getCoinBalance(data.profile)} onOpenSettings={() => setShowSettings(true)} />,
            progress: <TodayProgress data={data} theme={theme} />,
            achievements: <AchievementsCard data={data} theme={theme} onOpen={() => { setShowAchievements(true); markAchievementsSeen(); }} />,
            stacks: <DailyStacks stacks={data.stacks} tasks={data.tasks} theme={theme} categories={data.categories} onAddStackTask={addStackTask} onArchiveStack={archiveStack} onAddStack={addStack} onCreateCategory={createCategory} recentIconIds={data.settings.recentIconIds} favoriteIconIds={data.settings.favoriteIconIds} onUseIcon={useIcon} onToggleFavoriteIcon={toggleFavoriteIcon} />,
            tasks: (
              <div>
                <SectionTitle icon={<ListChecks size={15} className={theme.accentText} />} theme={theme} right={<button onClick={() => setShowAdd(true)} className={cn("p-1.5 rounded-full text-slate-900", theme.accentBg)}><Plus size={14} /></button>}>کارهای امروز</SectionTitle>
                <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto no-scrollbar">
                  <FilterChip active={timeFilter === "all"} onClick={() => setTimeFilter("all")} theme={theme}>همه</FilterChip>
                  {TIME_SLOTS.map((s) => <FilterChip key={s.key} active={timeFilter === s.key} onClick={() => setTimeFilter(s.key)} theme={theme}><span className="flex items-center gap-1"><IconGlyph id={s.icon} size={11} />{s.label}</span></FilterChip>)}
                </div>
                {timeFilter !== "all" && <p className={cn("text-[10.5px] px-0.5 -mt-1 mb-2", theme.textMuted)}>برای جابه‌جایی، ابتدا فیلتر را روی «همه» بگذار.</p>}
                <div className="flex flex-col gap-2">
                  {sortedTasks.length === 0 && <p className={cn("text-xs text-center py-6", theme.textMuted)}>کاری برای این بازه نیست. یکی اضافه کن.</p>}
                  {sortedTasks.map((t) => <TaskItem key={t.id} task={t} theme={theme} onToggle={toggleTask} onEdit={(task) => setEditingTask(task)} onDelete={deleteTask} onToggleSubtask={toggleSubtask} onMove={moveTask} reorderDisabled={timeFilter !== "all"} categories={data.categories} />)}
                </div>
              </div>
            ),
          };
          return <>{layout.filter((id) => visible[id] !== false).map((id) => <React.Fragment key={id}>{sections[id]}</React.Fragment>)}</>;
        })()}

        {tab === "habits" && (
          <HabitsView
            habits={data.habits}
            theme={theme}
            onToggle={toggleHabit}
            onAdd={addHabit}
            onUpdate={updateHabit}
            onDelete={deleteHabit}
            dateStr={data.todayDate}
            stacks={data.stacks}
            tasks={data.tasks}
          />
        )}

        {tab === "stats" && <StatsView data={data} theme={theme} onUpdateWeeklyGoal={updateWeeklyGoal} />}

        {tab === "rewards" && (
          <RewardsView rewards={data.rewards} coins={getCoinBalance(data.profile)} theme={theme} onAdd={addReward} onRedeem={redeemReward} onDelete={deleteReward} />
        )}
      </div>

      <BottomNav tab={tab} setTab={setTab} theme={theme} />

      {showSettings && (
        <SettingsModal
          theme={theme}
          data={data}
          onClose={() => setShowSettings(false)}
          onReset={resetAll}
          onUpdateSettings={updateSettings}
          onExport={exportData}
          onImportFile={importData}
        />
      )}

      {showAchievements && (
        <AchievementsModal data={data} theme={theme} onClose={() => setShowAchievements(false)} />
      )}

      {(showAdd || editingTask) && (
        <TaskFormModal
          theme={theme}
          initial={editingTask}
          stacks={data.stacks}
          categories={data.categories}
          onCreateCategory={createCategory}
          recentIconIds={data.settings.recentIconIds}
          favoriteIconIds={data.settings.favoriteIconIds}
          onUseIcon={useIcon}
          onToggleFavoriteIcon={toggleFavoriteIcon}
          onClose={() => { setShowAdd(false); setEditingTask(null); }}
          onSave={saveTask}
        />
      )}

      {levelUpAt && <LevelUpOverlay level={levelUpAt} theme={theme} onClose={() => setLevelUpAt(null)} />}
      <TopToast toast={toast} theme={theme} onDone={() => setToast(null)} />
    </div>
  );
}

function FilterChip({ active, onClick, children, theme }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-[11px] font-semibold px-2.5 py-1.5 rounded-full whitespace-nowrap shrink-0 transition-colors",
        active ? cn(theme.accentBg, "text-slate-900") : cn(theme.subtleBg, theme.textMuted)
      )}
    >
      {children}
    </button>
  );
}

/* =====================================================================
   THEME TOKENS
   ===================================================================== */

const ACCENT_HEX = { amber: "#f5b942", violet: "#8b5cf6", emerald: "#34d399", sky: "#38bdf8", rose: "#fb7185", orange: "#fb923c" };
const ACCENT_SECONDARY_HEX = { amber: "#7c5cff", violet: "#f5b942", emerald: "#38bdf8", sky: "#f5b942", rose: "#8b5cf6" };
const GLOW_SCALE = { off: 0, low: 0.5, medium: 1, high: 1.6 };

function buildTheme(isDark, accentColor = "amber", glowIntensity = "medium") {
  const accent = ACCENT_HEX[accentColor] ? accentColor : "amber";
  const accentHex = ACCENT_HEX[accent];
  const secondaryHex = ACCENT_SECONDARY_HEX[accent];
  const scale = GLOW_SCALE[glowIntensity] ?? 1;
  const glow = (blurPx, alpha) => (scale <= 0 ? "none" : `0 0 ${Math.round(blurPx * Math.max(0.5, scale))}px rgba(${hexToRgb(accentHex)},${(alpha * scale).toFixed(2)})`);
  const radial = (alpha) => (scale <= 0 ? 0 : alpha * scale);

  const base = {
    isDark,
    accentColor: accent,
    xpBarColor: `bg-${accent}-400`,
    ringBar: `text-${accent}-400`,
    accentText: `text-${accent}-400`,
    accentBg: `bg-${accent}-400`,
    accentBorder: `border-${accent}-400`,
    accentSoftBg: `bg-${accent}-400/10`,
    hexGradient: `linear-gradient(135deg, ${accentHex}, ${secondaryHex})`,
    hexOuterGradient: `linear-gradient(135deg, ${accentHex}cc, ${secondaryHex}99)`,
    hexGlow: glow(22, 0.55),
    headerGlow: `radial-gradient(circle at 20% 0%, ${accentHex}, transparent 60%), radial-gradient(circle at 90% 100%, ${secondaryHex}, transparent 55%)`,
    glowScale: scale,
  };

  if (isDark) {
    return {
      ...base,
      appBg: "bg-slate-950",
      pageBg: "linear-gradient(180deg, #0b0f1c 0%, #0a0a12 45%, #0b0e18 100%)",
      pageGlow: `radial-gradient(ellipse 60% 40% at 12% 0%, rgba(${hexToRgb(secondaryHex)},${radial(0.16)}), transparent 60%), radial-gradient(ellipse 55% 35% at 100% 18%, rgba(${hexToRgb(accentHex)},${radial(0.1)}), transparent 60%)`,
      surface: "bg-slate-900",
      surfaceStrong: "bg-slate-900",
      cardPrimary: "bg-gradient-to-br from-slate-900 to-slate-900/60",
      cardSecondary: "bg-slate-900/80",
      cardSmall: "bg-slate-900/60",
      subtleBg: "bg-slate-800",
      inputBg: "bg-slate-800",
      border: "border-slate-800",
      text: "text-slate-100",
      textMuted: "text-slate-400",
      trackBg: "bg-slate-800",
      navBg: "bg-slate-950/90",
      ringTrack: "text-slate-800",
    };
  }
  return {
    ...base,
    appBg: "bg-stone-50",
    pageBg: "linear-gradient(180deg, #fdfcfb 0%, #f7f5f2 100%)",
    pageGlow: `radial-gradient(ellipse 55% 35% at 10% 0%, rgba(${hexToRgb(accentHex)},${radial(0.1)}), transparent 60%), radial-gradient(ellipse 50% 35% at 100% 15%, rgba(${hexToRgb(secondaryHex)},${radial(0.08)}), transparent 60%)`,
    surface: "bg-white",
    surfaceStrong: "bg-white",
    cardPrimary: "bg-gradient-to-br from-white to-stone-50",
    cardSecondary: "bg-white",
    cardSmall: "bg-white",
    subtleBg: "bg-stone-100",
    inputBg: "bg-stone-100",
    border: "border-stone-200",
    text: "text-stone-800",
    textMuted: "text-stone-500",
    trackBg: "bg-stone-200",
    navBg: "bg-white/90",
    ringTrack: "text-stone-200",
  };
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}
