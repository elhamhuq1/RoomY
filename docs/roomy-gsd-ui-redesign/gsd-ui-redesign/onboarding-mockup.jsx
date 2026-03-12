import { useState } from "react";

const COLORS = {
  bg: "#FAFAF8",
  card: "#FFFFFF",
  text: "#1A1A1A",
  textSecondary: "#8E8E93",
  textTertiary: "#AEAEB2",
  brand: "#2D6A4F",
  brandLight: "#D8F3DC",
  brandMuted: "#95D5B2",
  danger: "#E5383B",
  dangerLight: "#FFE5E5",
  warning: "#F4A261",
  warningLight: "#FFF3E0",
  success: "#40916C",
  successLight: "#E8F5E9",
  border: "#F0EFEB",
  shadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
};

// ─── Welcome Carousel ─────────────────────────────────────
const WelcomeScreen = ({ onNext }) => {
  const [page, setPage] = useState(0);

  const slides = [
    {
      emoji: "💰",
      gradient: "linear-gradient(135deg, #2D6A4F, #1B4332)",
      title: "Split Expenses Fairly",
      body: "Track shared costs and settle up with one tap. No more awkward money conversations.",
      accent: "#95D5B2",
    },
    {
      emoji: "🛒",
      gradient: "linear-gradient(135deg, #7209B7, #B5179E)",
      title: "Shared Grocery Lists",
      body: "Keep one list everyone can add to. Never buy duplicate milk again.",
      accent: "#E0AAFF",
    },
    {
      emoji: "✨",
      gradient: "linear-gradient(135deg, #E76F51, #F4A261)",
      title: "Fair Chore Rotation",
      body: "Take turns automatically with smart scheduling. Everyone does their part.",
      accent: "#FFDAB9",
    },
  ];

  const s = slides[page];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: COLORS.bg, position: "relative", overflow: "hidden" }}>
      {/* Top section with gradient */}
      <div style={{
        flex: "0 0 52%", background: s.gradient, borderRadius: "0 0 40px 40px",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden", transition: "background 0.4s ease",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", top: 60, right: 30, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

        {/* Logo */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24, background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)",
          }}>
            <span style={{ fontSize: 40 }}>🏠</span>
          </div>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.03em" }}>RoomY</h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", margin: "6px 0 0", fontWeight: 500 }}>Living together, made easy</p>

        {/* Feature emoji badge */}
        <div style={{
          marginTop: 32, width: 72, height: 72, borderRadius: 22,
          background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}>
          <span style={{ fontSize: 36 }}>{s.emoji}</span>
        </div>
      </div>

      {/* Content section */}
      <div style={{ flex: 1, padding: "28px 28px 0", display: "flex", flexDirection: "column" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, margin: 0, letterSpacing: "-0.02em", textAlign: "center" }}>
          {s.title}
        </h2>
        <p style={{ fontSize: 15, color: COLORS.textSecondary, margin: "10px 0 0", lineHeight: 1.5, textAlign: "center" }}>
          {s.body}
        </p>

        <div style={{ flex: 1 }} />

        {/* Page dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => setPage(i)} style={{
              width: i === page ? 24 : 8, height: 8, borderRadius: 4,
              background: i === page ? COLORS.brand : COLORS.border,
              transition: "all 0.3s ease", cursor: "pointer",
            }} />
          ))}
        </div>

        {/* Buttons */}
        <button onClick={onNext} style={{
          width: "100%", padding: "16px 0", borderRadius: 14, border: "none",
          background: COLORS.brand, color: "#fff", fontSize: 17, fontWeight: 700,
          cursor: "pointer", boxShadow: `0 4px 16px ${COLORS.brand}44`,
          letterSpacing: "-0.01em",
        }}>
          Get Started
        </button>
        <p style={{ textAlign: "center", margin: "14px 0 8px", fontSize: 14, color: COLORS.textSecondary }}>
          Already have an account? <span style={{ color: COLORS.brand, fontWeight: 600, cursor: "pointer" }}>Sign in</span>
        </p>
      </div>
    </div>
  );
};

// ─── Sign Up ─────────────────────────────────────────────
const SignUpScreen = ({ onNext, onBack }) => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", background: COLORS.bg, padding: "0 24px" }}>
    {/* Back button */}
    <div style={{ paddingTop: 12, marginBottom: 8 }}>
      <button onClick={onBack} style={{
        width: 40, height: 40, borderRadius: 12, background: COLORS.card, border: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: COLORS.shadow,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.text} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
    </div>

    {/* Header */}
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, margin: 0, letterSpacing: "-0.02em" }}>Create Account</h1>
      <p style={{ fontSize: 15, color: COLORS.textSecondary, margin: "6px 0 0" }}>Join your household on RoomY</p>
    </div>

    {/* Form */}
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>Email</label>
      <div style={{
        padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${COLORS.border}`,
        background: COLORS.card, fontSize: 15, color: COLORS.textTertiary,
      }}>you@example.com</div>
    </div>
    <div style={{ marginBottom: 24 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>Password</label>
      <div style={{
        padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${COLORS.border}`,
        background: COLORS.card, fontSize: 15, color: COLORS.textTertiary,
      }}>At least 6 characters</div>
    </div>

    <button onClick={onNext} style={{
      width: "100%", padding: "16px 0", borderRadius: 14, border: "none",
      background: COLORS.brand, color: "#fff", fontSize: 17, fontWeight: 700,
      cursor: "pointer", boxShadow: `0 4px 16px ${COLORS.brand}44`, marginBottom: 20,
    }}>Sign Up</button>

    {/* Divider */}
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={{ flex: 1, height: 1, background: COLORS.border }} />
      <span style={{ fontSize: 13, color: COLORS.textTertiary }}>or</span>
      <div style={{ flex: 1, height: 1, background: COLORS.border }} />
    </div>

    {/* Social */}
    <button style={{
      width: "100%", padding: "14px 0", borderRadius: 14, border: `1.5px solid ${COLORS.border}`,
      background: COLORS.card, fontSize: 15, fontWeight: 600, color: COLORS.text,
      cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    }}>
      <span style={{ fontSize: 18 }}>G</span> Continue with Google
    </button>
    <button style={{
      width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
      background: COLORS.text, fontSize: 15, fontWeight: 600, color: "#fff",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    }}>
      <span style={{ fontSize: 16 }}>🍎</span> Continue with Apple
    </button>

    <div style={{ flex: 1 }} />
    <p style={{ textAlign: "center", margin: "0 0 16px", fontSize: 14, color: COLORS.textSecondary }}>
      Already have an account? <span style={{ color: COLORS.brand, fontWeight: 600, cursor: "pointer" }}>Sign in</span>
    </p>
  </div>
);

// ─── Display Name ────────────────────────────────────────
const DisplayNameScreen = ({ onNext, onBack }) => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", background: COLORS.bg, padding: "0 24px" }}>
    <div style={{ paddingTop: 12, marginBottom: 8 }}>
      <button onClick={onBack} style={{
        width: 40, height: 40, borderRadius: 12, background: COLORS.card, border: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: COLORS.shadow,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.text} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
    </div>

    {/* Step indicator */}
    <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
      <div style={{ flex: 1, height: 3, borderRadius: 2, background: COLORS.brand }} />
      <div style={{ flex: 1, height: 3, borderRadius: 2, background: COLORS.border }} />
      <div style={{ flex: 1, height: 3, borderRadius: 2, background: COLORS.border }} />
    </div>

    {/* Avatar preview */}
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
      <div style={{
        width: 88, height: 88, borderRadius: 28,
        background: "linear-gradient(135deg, #264653, #2A9D8F)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 36, fontWeight: 700,
        boxShadow: "0 4px 20px rgba(38,70,83,0.3)",
      }}>T</div>
    </div>

    <h1 style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, margin: 0, textAlign: "center", letterSpacing: "-0.02em" }}>
      What should we call you?
    </h1>
    <p style={{ fontSize: 15, color: COLORS.textSecondary, margin: "6px 0 0", textAlign: "center" }}>
      This is how your roommates will see you
    </p>

    <div style={{ marginTop: 28, marginBottom: 24 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>Display Name</label>
      <div style={{
        padding: "14px 16px", borderRadius: 12, border: `2px solid ${COLORS.brand}`,
        background: COLORS.card, fontSize: 16, fontWeight: 600, color: COLORS.text,
      }}>Tk</div>
    </div>

    <button onClick={onNext} style={{
      width: "100%", padding: "16px 0", borderRadius: 14, border: "none",
      background: COLORS.brand, color: "#fff", fontSize: 17, fontWeight: 700,
      cursor: "pointer", boxShadow: `0 4px 16px ${COLORS.brand}44`,
    }}>Continue</button>
  </div>
);

// ─── Setup Choice ────────────────────────────────────────
const SetupChoiceScreen = ({ onNext, onBack }) => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", background: COLORS.bg, padding: "0 24px" }}>
    <div style={{ paddingTop: 12, marginBottom: 8 }}>
      <button onClick={onBack} style={{
        width: 40, height: 40, borderRadius: 12, background: COLORS.card, border: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: COLORS.shadow,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.text} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
    </div>

    <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
      <div style={{ flex: 1, height: 3, borderRadius: 2, background: COLORS.brand }} />
      <div style={{ flex: 1, height: 3, borderRadius: 2, background: COLORS.brand }} />
      <div style={{ flex: 1, height: 3, borderRadius: 2, background: COLORS.border }} />
    </div>

    <h1 style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Set Up Your Home</h1>
    <p style={{ fontSize: 15, color: COLORS.textSecondary, margin: "0 0 36px" }}>How would you like to get started?</p>

    {/* Create household */}
    <div onClick={onNext} style={{
      background: COLORS.card, borderRadius: 18, padding: "20px 20px",
      boxShadow: COLORS.shadow, border: `1.5px solid ${COLORS.border}`,
      marginBottom: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 18,
        background: `linear-gradient(135deg, ${COLORS.brand}, #1B4332)`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: `0 4px 12px ${COLORS.brand}33`,
      }}>
        <span style={{ fontSize: 28 }}>🏠</span>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: COLORS.text }}>Create a Household</p>
        <p style={{ margin: "3px 0 0", fontSize: 13, color: COLORS.textSecondary }}>Start fresh and invite your roommates</p>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.textTertiary} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
    </div>

    {/* Join household */}
    <div style={{
      background: COLORS.card, borderRadius: 18, padding: "20px 20px",
      boxShadow: COLORS.shadow, border: `1.5px solid ${COLORS.border}`,
      cursor: "pointer", display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 18,
        background: "linear-gradient(135deg, #7209B7, #B5179E)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: "0 4px 12px rgba(114,9,183,0.25)",
      }}>
        <span style={{ fontSize: 28 }}>🔑</span>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: COLORS.text }}>I Have an Invite Code</p>
        <p style={{ margin: "3px 0 0", fontSize: 13, color: COLORS.textSecondary }}>Join a household a roommate created</p>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.textTertiary} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  </div>
);

// ─── Name Household ──────────────────────────────────────
const NameHouseholdScreen = ({ onNext, onBack }) => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", background: COLORS.bg, padding: "0 24px" }}>
    <div style={{ paddingTop: 12, marginBottom: 8 }}>
      <button onClick={onBack} style={{
        width: 40, height: 40, borderRadius: 12, background: COLORS.card, border: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: COLORS.shadow,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.text} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
    </div>

    {/* House illustration */}
    <div style={{ display: "flex", justifyContent: "center", marginTop: 20, marginBottom: 24 }}>
      <div style={{
        width: 96, height: 96, borderRadius: 30,
        background: `linear-gradient(135deg, ${COLORS.brand}, #1B4332)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 8px 32px ${COLORS.brand}33`,
      }}>
        <span style={{ fontSize: 48 }}>🏠</span>
      </div>
    </div>

    <h1 style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, margin: 0, textAlign: "center", letterSpacing: "-0.02em" }}>
      Name Your Household
    </h1>
    <p style={{ fontSize: 15, color: COLORS.textSecondary, margin: "6px 0 0", textAlign: "center" }}>
      Pick something your roommates will recognize
    </p>

    <div style={{ marginTop: 28, marginBottom: 24 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>Household Name</label>
      <div style={{
        padding: "14px 16px", borderRadius: 12, border: `2px solid ${COLORS.brand}`,
        background: COLORS.card, fontSize: 16, fontWeight: 600, color: COLORS.text,
      }}>Clowns</div>
    </div>

    <button onClick={onNext} style={{
      width: "100%", padding: "16px 0", borderRadius: 14, border: "none",
      background: COLORS.brand, color: "#fff", fontSize: 17, fontWeight: 700,
      cursor: "pointer", boxShadow: `0 4px 16px ${COLORS.brand}44`,
    }}>Create Household</button>
  </div>
);

// ─── Invite Code ─────────────────────────────────────────
const InviteCodeScreen = ({ onNext }) => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", background: COLORS.bg, padding: "0 24px", alignItems: "center" }}>
    <div style={{ flex: "0 0 80px" }} />

    {/* Success icon */}
    <div style={{
      width: 80, height: 80, borderRadius: 24,
      background: COLORS.brandLight, display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: 20,
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={COLORS.brand} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
    </div>

    <h1 style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, margin: 0, letterSpacing: "-0.02em" }}>Clowns is ready!</h1>
    <p style={{ fontSize: 15, color: COLORS.textSecondary, margin: "6px 0 0", textAlign: "center" }}>
      Share this code with your roommates so they can join
    </p>

    {/* Code card */}
    <div style={{
      marginTop: 28, width: "100%", background: COLORS.card, borderRadius: 18,
      padding: "24px 20px", boxShadow: COLORS.shadow, border: `1px solid ${COLORS.border}`,
      textAlign: "center",
    }}>
      <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: "0.1em" }}>Invite Code</p>
      <p style={{ margin: "0 0 10px", fontSize: 36, fontWeight: 800, color: COLORS.brand, letterSpacing: "0.12em" }}>EVWY UFW3</p>
      <p style={{ margin: 0, fontSize: 12, color: COLORS.textTertiary }}>Expires in 7 days · Regenerate in Settings</p>
    </div>

    <div style={{ flex: 1 }} />

    <button style={{
      width: "100%", padding: "16px 0", borderRadius: 14, border: "none",
      background: COLORS.brand, color: "#fff", fontSize: 17, fontWeight: 700,
      cursor: "pointer", boxShadow: `0 4px 16px ${COLORS.brand}44`, marginBottom: 12,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
      Share with Roommates
    </button>
    <button onClick={onNext} style={{
      width: "100%", padding: "16px 0", borderRadius: 14,
      border: `2px solid ${COLORS.brand}`, background: "transparent",
      color: COLORS.brand, fontSize: 17, fontWeight: 700, cursor: "pointer", marginBottom: 24,
    }}>Continue Setup</button>
  </div>
);

// ─── Choose Modules ──────────────────────────────────────
const ModulesScreen = ({ onNext }) => {
  const [modules, setModules] = useState({ expenses: true, groceries: false, chores: true });

  const toggle = (key) => {
    if (key === "expenses") return; // always on
    setModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const moduleList = [
    { key: "expenses", emoji: "💰", title: "Expenses", desc: "Split bills and track who owes what", locked: true },
    { key: "groceries", emoji: "🛒", title: "Groceries", desc: "Shared shopping list with cost splitting", locked: false },
    { key: "chores", emoji: "✨", title: "Chores", desc: "Fair chore rotation with effort tracking", locked: false },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: COLORS.bg, padding: "0 24px" }}>
      <div style={{ paddingTop: 20, marginBottom: 4 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: COLORS.brand }} />
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: COLORS.brand }} />
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: COLORS.brand }} />
        </div>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, margin: 0, letterSpacing: "-0.02em" }}>Choose Your Modules</h1>
      <p style={{ fontSize: 15, color: COLORS.textSecondary, margin: "6px 0 32px" }}>You can always change these later in Settings</p>

      {moduleList.map((mod) => {
        const active = modules[mod.key];
        return (
          <div key={mod.key} onClick={() => toggle(mod.key)} style={{
            background: COLORS.card, borderRadius: 18, padding: "18px 18px",
            boxShadow: COLORS.shadow,
            border: active ? `2px solid ${COLORS.brand}` : `2px solid ${COLORS.border}`,
            marginBottom: 12, cursor: mod.locked ? "default" : "pointer",
            display: "flex", alignItems: "center", gap: 14,
            transition: "border-color 0.2s ease",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: active ? COLORS.brandLight : "#F5F5F5",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              transition: "background 0.2s ease",
            }}>
              <span style={{ fontSize: 24 }}>{mod.emoji}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.text }}>{mod.title}</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: COLORS.textSecondary }}>{mod.desc}</p>
              {mod.locked && <p style={{ margin: "3px 0 0", fontSize: 11, fontWeight: 600, color: COLORS.brand }}>Always enabled</p>}
            </div>
            {/* Toggle */}
            <div style={{
              width: 48, height: 28, borderRadius: 14, padding: 2,
              background: active ? COLORS.brand : "#E0E0E0",
              display: "flex", alignItems: "center",
              justifyContent: active ? "flex-end" : "flex-start",
              transition: "background 0.2s ease", flexShrink: 0,
              opacity: mod.locked ? 0.6 : 1,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 12, background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                transition: "all 0.2s ease",
              }} />
            </div>
          </div>
        );
      })}

      <div style={{ flex: 1 }} />

      <button onClick={onNext} style={{
        width: "100%", padding: "16px 0", borderRadius: 14, border: "none",
        background: COLORS.brand, color: "#fff", fontSize: 17, fontWeight: 700,
        cursor: "pointer", boxShadow: `0 4px 16px ${COLORS.brand}44`, marginBottom: 24,
      }}>Let's Go!</button>
    </div>
  );
};

// ─── Success / Done ──────────────────────────────────────
const DoneScreen = () => (
  <div style={{
    height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    background: `linear-gradient(135deg, ${COLORS.brand}, #1B4332)`, padding: "0 32px", textAlign: "center",
    position: "relative", overflow: "hidden",
  }}>
    <div style={{ position: "absolute", top: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
    <div style={{ position: "absolute", bottom: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

    <div style={{
      width: 96, height: 96, borderRadius: 30,
      background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: 24, border: "1px solid rgba(255,255,255,0.2)",
    }}>
      <span style={{ fontSize: 48 }}>🎉</span>
    </div>
    <h1 style={{ fontSize: 30, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>You're all set!</h1>
    <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", margin: "10px 0 0", lineHeight: 1.5 }}>
      Welcome to Clowns. Your household is ready to go.
    </p>
  </div>
);


// ─── Main App ────────────────────────────────────────────
export default function OnboardingRedesign() {
  const [step, setStep] = useState(0);
  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));

  const screens = [
    <WelcomeScreen onNext={next} />,
    <SignUpScreen onNext={next} onBack={back} />,
    <DisplayNameScreen onNext={next} onBack={back} />,
    <SetupChoiceScreen onNext={next} onBack={back} />,
    <NameHouseholdScreen onNext={next} onBack={back} />,
    <InviteCodeScreen onNext={next} />,
    <ModulesScreen onNext={next} />,
    <DoneScreen />,
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#E8E4DF",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 16px",
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
    }}>
      <div style={{
        width: 390, height: 844,
        background: COLORS.bg,
        borderRadius: 44,
        boxShadow: "0 24px 80px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.1)",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        position: "relative",
        border: "8px solid #1A1A1A",
      }}>
        {/* Status Bar */}
        <div style={{
          height: 54, padding: "12px 28px 0",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0, position: "relative", zIndex: 10,
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: step === 0 || step === 7 ? "#fff" : COLORS.text }}>9:41</span>
          <div style={{
            width: 126, height: 34, background: "#000",
            borderRadius: 20, position: "absolute", left: "50%", transform: "translateX(-50%)", top: 12,
          }} />
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <svg width="16" height="12" viewBox="0 0 16 12"><rect x="0" y="3" width="3" height="9" rx="1" fill={step === 0 || step === 7 ? "#fff" : COLORS.text}/><rect x="4.5" y="2" width="3" height="10" rx="1" fill={step === 0 || step === 7 ? "#fff" : COLORS.text}/><rect x="9" y="0" width="3" height="12" rx="1" fill={step === 0 || step === 7 ? "#fff" : COLORS.text}/><rect x="13" y="1" width="3" height="11" rx="1" fill={step === 0 || step === 7 ? "rgba(255,255,255,0.4)" : COLORS.textTertiary}/></svg>
            <div style={{ width: 25, height: 12, borderRadius: 3, border: `1px solid ${step === 0 || step === 7 ? "rgba(255,255,255,0.5)" : COLORS.textSecondary}`, padding: 1, display: "flex" }}>
              <div style={{ width: "70%", height: "100%", borderRadius: 1.5, background: step === 0 || step === 7 ? "#fff" : COLORS.text }} />
            </div>
          </div>
        </div>

        {/* Screen content */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {screens[step]}
        </div>
      </div>

      {/* Step nav (for demo) */}
      <div style={{
        position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: 8, background: "rgba(0,0,0,0.8)", padding: "8px 16px",
        borderRadius: 12, zIndex: 100,
      }}>
        <button onClick={back} style={{
          background: "none", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600, padding: "4px 10px",
        }}>← Back</button>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, padding: "4px 0" }}>{step + 1}/{screens.length}</span>
        <button onClick={next} style={{
          background: "none", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600, padding: "4px 10px",
        }}>Next →</button>
      </div>
    </div>
  );
}
