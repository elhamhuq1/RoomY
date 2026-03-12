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
  shadowMd: "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
};

const MEMBERS = [
  { name: "Elham", initial: "E", color: "#E76F51", gradient: "linear-gradient(135deg, #E76F51, #F4A261)" },
  { name: "Tk", initial: "T", color: "#264653", gradient: "linear-gradient(135deg, #264653, #2A9D8F)" },
  { name: "Elham3", initial: "E", color: "#7209B7", gradient: "linear-gradient(135deg, #7209B7, #B5179E)" },
];

const Avatar = ({ member, size = 36 }) => (
  <div style={{
    width: size, height: size, borderRadius: size / 2,
    background: member.gradient,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontSize: size * 0.38, fontWeight: 600,
    letterSpacing: "0.02em", flexShrink: 0,
    boxShadow: `0 2px 8px ${member.color}33`,
  }}>
    {member.initial}
  </div>
);

const Badge = ({ children, color, bg }) => (
  <span style={{
    fontSize: 11, fontWeight: 600, color, background: bg,
    padding: "2px 8px", borderRadius: 6, letterSpacing: "0.02em",
  }}>
    {children}
  </span>
);

const HomeScreen = () => {
  const [calExpanded, setCalExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(11);

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  // Events on specific dates (March 2026)
  const events = {
    4: [{ color: COLORS.brand }],
    11: [{ color: COLORS.brand }, { color: COLORS.warning }],
    14: [{ color: COLORS.danger }],
    18: [{ color: COLORS.brand }],
    21: [{ color: "#7209B7" }],
    25: [{ color: COLORS.brand }],
  };

  // Current week: March 8–14
  const weekDays = [
    { date: 8 }, { date: 9 }, { date: 10 }, { date: 11 },
    { date: 12 }, { date: 13 }, { date: 14 },
  ];

  // Full month grid for March 2026 (starts Sunday)
  const marchGrid = [];
  for (let i = 1; i <= 31; i++) marchGrid.push(i);
  while (marchGrid.length % 7 !== 0) marchGrid.push(null);

  return (
    <div style={{ padding: "0 20px 24px" }}>
      {/* Header */}
      <div style={{ paddingTop: 16, paddingBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: 0, fontWeight: 500 }}>
            Wednesday, March 11
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: "4px 0 0", color: COLORS.text, letterSpacing: "-0.02em" }}>
            Good evening, Tk
          </h1>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: COLORS.card,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: COLORS.shadow, border: `1px solid ${COLORS.border}`,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        </div>
      </div>

      {/* Household Members */}
      <div style={{
        background: COLORS.card, borderRadius: 16, padding: "16px 16px",
        boxShadow: COLORS.shadow, border: `1px solid ${COLORS.border}`, marginBottom: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.06em" }}>Clowns</span>
          <span style={{ fontSize: 12, color: COLORS.brand, fontWeight: 600, cursor: "pointer" }}>Invite +</span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {MEMBERS.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Avatar member={m} size={44} />
              <span style={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: 500 }}>{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Card */}
      <div style={{
        background: COLORS.card, borderRadius: 16, padding: "14px 12px 8px",
        boxShadow: COLORS.shadow, border: `1px solid ${COLORS.border}`, marginBottom: 16,
      }}>
        {/* Calendar header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>March 2026</span>
            <button onClick={() => setCalExpanded(!calExpanded)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "2px 6px",
              display: "flex", alignItems: "center",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.brand} strokeWidth="2.5" strokeLinecap="round"
                style={{ transform: calExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button style={{ width: 28, height: 28, borderRadius: 8, background: "none", border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button style={{ width: 28, height: 28, borderRadius: 8, background: "none", border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        {/* Day labels */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0, marginBottom: 2 }}>
          {dayLabels.map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: COLORS.textTertiary, padding: "0 0 6px", letterSpacing: "0.04em" }}>
              {d}
            </div>
          ))}
        </div>

        {!calExpanded ? (
          /* Week Strip */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0 }}>
            {weekDays.map(({ date }) => {
              const isToday = date === 11;
              const isSelected = date === selectedDate;
              const dayEvents = events[date] || [];
              return (
                <div key={date} onClick={() => setSelectedDate(date)} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  padding: "6px 0 8px", cursor: "pointer", borderRadius: 10,
                  background: isSelected ? (isToday ? COLORS.brand : COLORS.brandLight) : "transparent",
                  transition: "background 0.15s ease",
                }}>
                  <span style={{
                    fontSize: 16, fontWeight: isToday ? 700 : 500,
                    color: isSelected ? (isToday ? "#fff" : COLORS.brand) : (isToday ? COLORS.brand : COLORS.text),
                  }}>{date}</span>
                  <div style={{ display: "flex", gap: 3, height: 5 }}>
                    {dayEvents.map((e, i) => (
                      <div key={i} style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: isSelected && isToday ? "rgba(255,255,255,0.8)" : e.color,
                      }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Full Month */
          <div>
            {Array.from({ length: Math.ceil(marchGrid.length / 7) }, (_, weekIdx) => (
              <div key={weekIdx} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0 }}>
                {marchGrid.slice(weekIdx * 7, weekIdx * 7 + 7).map((date, i) => {
                  if (!date) return <div key={i} />;
                  const isToday = date === 11;
                  const isSelected = date === selectedDate;
                  const dayEvents = events[date] || [];
                  const isPast = date < 11;
                  return (
                    <div key={i} onClick={() => setSelectedDate(date)} style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                      padding: "5px 0 6px", cursor: "pointer", borderRadius: 10,
                      background: isSelected ? (isToday ? COLORS.brand : COLORS.brandLight) : "transparent",
                    }}>
                      <span style={{
                        fontSize: 14, fontWeight: isToday ? 700 : 400,
                        color: isSelected ? (isToday ? "#fff" : COLORS.brand)
                          : isToday ? COLORS.brand
                          : isPast ? COLORS.textTertiary : COLORS.text,
                      }}>{date}</span>
                      <div style={{ display: "flex", gap: 2, height: 4 }}>
                        {dayEvents.slice(0, 3).map((e, j) => (
                          <div key={j} style={{
                            width: 4, height: 4, borderRadius: "50%",
                            background: isSelected && isToday ? "rgba(255,255,255,0.8)" : e.color,
                          }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Pull handle */}
        <div onClick={() => setCalExpanded(!calExpanded)} style={{
          display: "flex", justifyContent: "center", padding: "6px 0 2px", cursor: "pointer",
        }}>
          <div style={{ width: 32, height: 3, borderRadius: 2, background: COLORS.border }} />
        </div>
      </div>

      {/* Balance Summary Card */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.brand}, #1B4332)`,
        borderRadius: 16, padding: "20px 20px", marginBottom: 16,
        boxShadow: `0 4px 16px ${COLORS.brand}33`,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -30, right: -30, width: 120, height: 120,
          borderRadius: "50%", background: "rgba(255,255,255,0.06)",
        }} />
        <div style={{
          position: "absolute", bottom: -20, right: 40, width: 80, height: 80,
          borderRadius: "50%", background: "rgba(255,255,255,0.04)",
        }} />
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0, fontWeight: 500 }}>Owed to you</p>
        <p style={{ fontSize: 34, color: "#fff", margin: "4px 0 12px", fontWeight: 700, letterSpacing: "-0.02em" }}>$53.33</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{
            padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 13, fontWeight: 600,
            cursor: "pointer", backdropFilter: "blur(8px)",
          }}>Request</button>
          <button style={{
            padding: "8px 20px", borderRadius: 10, border: "none",
            background: "#fff", color: COLORS.brand, fontSize: 13, fontWeight: 600,
            cursor: "pointer",
          }}>Settle Up</button>
        </div>
      </div>

      {/* Needs Attention Section */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: "4px 0 12px", letterSpacing: "-0.01em" }}>
          Needs your attention
        </h2>

        {/* Chore due */}
        <div style={{
          background: COLORS.card, borderRadius: 14, padding: "14px 16px",
          boxShadow: COLORS.shadow, border: `1px solid ${COLORS.border}`, marginBottom: 10,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: COLORS.warningLight,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.warning} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: COLORS.text }}>Folding clothes</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: COLORS.textSecondary }}>Due in 7 days · Assigned to you</p>
          </div>
          <button style={{
            width: 36, height: 36, borderRadius: 10, border: `2px solid ${COLORS.brandMuted}`,
            background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.brand} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </div>

        {/* Disputed chore */}
        <div style={{
          background: COLORS.card, borderRadius: 14, padding: "14px 16px",
          boxShadow: COLORS.shadow, border: `1px solid ${COLORS.dangerLight}`, marginBottom: 10,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: COLORS.dangerLight,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.danger} strokeWidth="2.2" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: COLORS.text }}>Laundry</p>
              <Badge color={COLORS.danger} bg={COLORS.dangerLight}>Disputed</Badge>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: COLORS.textSecondary }}>Elham says this wasn't done</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.textTertiary} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        {/* Grocery request */}
        <div style={{
          background: COLORS.card, borderRadius: 14, padding: "14px 16px",
          boxShadow: COLORS.shadow, border: `1px solid ${COLORS.border}`, marginBottom: 10,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: "#EDE7F6",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7209B7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: COLORS.text }}>Elham3 added 3 items</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: COLORS.textSecondary }}>Milk, eggs, bread · Grocery list</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.textTertiary} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>

      {/* This Week */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: "4px 0 12px", letterSpacing: "-0.01em" }}>
          This week
        </h2>
        {[
          { day: "Wed 11", chores: [{ name: "Dishes", member: MEMBERS[2], done: true }, { name: "Vaccum", member: MEMBERS[0], done: false }] },
          { day: "Thu 12", chores: [{ name: "Take out trash", member: MEMBERS[1], done: false }] },
          { day: "Fri 13", chores: [] },
          { day: "Sat 14", chores: [{ name: "Bathroom", member: MEMBERS[0], done: false }] },
        ].map((d, i) => (
          <div key={i} style={{ display: "flex", gap: 14, marginBottom: i === 3 ? 0 : 6, minHeight: 44 }}>
            <div style={{
              width: 54, paddingTop: 12, textAlign: "center", flexShrink: 0,
            }}>
              <span style={{
                fontSize: 13, fontWeight: i === 0 ? 700 : 500,
                color: i === 0 ? COLORS.brand : COLORS.textSecondary,
              }}>{d.day}</span>
              {i === 0 && <div style={{ width: 5, height: 5, borderRadius: "50%", background: COLORS.brand, margin: "4px auto 0" }} />}
            </div>
            <div style={{
              flex: 1, borderLeft: `2px solid ${i === 0 ? COLORS.brand : COLORS.border}`,
              paddingLeft: 14, paddingTop: 4, paddingBottom: 12,
            }}>
              {d.chores.length === 0 ? (
                <p style={{ fontSize: 13, color: COLORS.textTertiary, margin: "8px 0", fontStyle: "italic" }}>Nothing scheduled</p>
              ) : d.chores.map((c, j) => (
                <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                  <Avatar member={c.member} size={24} />
                  <span style={{
                    fontSize: 14, color: c.done ? COLORS.textTertiary : COLORS.text,
                    fontWeight: 500,
                    textDecoration: c.done ? "line-through" : "none",
                  }}>{c.name}</span>
                  {c.done && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={COLORS.success} stroke="none">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ExpensesScreen = () => {
  const expenses = [
    { type: "expense", name: "Sauna", payer: MEMBERS[1], amount: 20, time: "2h ago" },
    { type: "settlement", from: MEMBERS[0], to: MEMBERS[1], amount: 33.33, time: "3h ago" },
    { type: "expense", name: "Grocery trip", payer: MEMBERS[1], amount: 100, time: "Yesterday" },
    { type: "settlement", from: MEMBERS[2], to: MEMBERS[1], amount: 38.33, time: "Yesterday" },
    { type: "expense", name: "Grocery trip", payer: MEMBERS[1], amount: 115, time: "Mar 8" },
    { type: "expense", name: "Internet bill", payer: MEMBERS[0], amount: 65, time: "Mar 7" },
  ];

  return (
    <div style={{ padding: "0 20px 24px" }}>
      {/* Header */}
      <div style={{ paddingTop: 16, paddingBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: COLORS.text, letterSpacing: "-0.02em" }}>Expenses</h1>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: COLORS.card,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: COLORS.shadow, border: `1px solid ${COLORS.border}`,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </div>
      </div>

      {/* Balance Cards */}
      <div style={{
        background: COLORS.card, borderRadius: 16, padding: 16,
        boxShadow: COLORS.shadow, border: `1px solid ${COLORS.border}`, marginBottom: 20,
      }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Balances</p>
        
        {/* Owed to you */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${COLORS.border}` }}>
          <Avatar member={MEMBERS[2]} size={40} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: COLORS.text }}>Elham3</p>
            <p style={{ margin: "1px 0 0", fontSize: 12, color: COLORS.success, fontWeight: 600 }}>owes you $53.33</p>
          </div>
          <button style={{
            padding: "7px 14px", borderRadius: 8, border: "none",
            background: COLORS.brand, color: "#fff", fontSize: 12, fontWeight: 600,
            cursor: "pointer",
          }}>Remind</button>
        </div>

        {/* All settled */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar member={MEMBERS[0]} size={40} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: COLORS.text }}>Elham</p>
            <p style={{ margin: "1px 0 0", fontSize: 12, color: COLORS.textTertiary, fontWeight: 500 }}>All settled up</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={COLORS.brandMuted} stroke="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
      </div>

      {/* History */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: 0, letterSpacing: "-0.01em" }}>History</h2>
        <span style={{ fontSize: 13, color: COLORS.brand, fontWeight: 600, cursor: "pointer" }}>Filter</span>
      </div>

      {/* Today section */}
      <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Today</p>
      
      {expenses.slice(0, 2).map((e, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
          borderBottom: i < 1 ? `1px solid ${COLORS.border}` : "none",
        }}>
          {e.type === "expense" ? (
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: COLORS.warningLight,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.warning} strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: COLORS.successLight,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.success} strokeWidth="2.2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: e.type === "settlement" ? COLORS.textSecondary : COLORS.text }}>
              {e.type === "expense" ? e.name : `${e.from.name} → ${e.to.name}`}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: COLORS.textTertiary }}>
              {e.type === "expense" ? `paid by ${e.payer.name} · ${e.time}` : `Settlement · ${e.time}`}
            </p>
          </div>
          <span style={{
            fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em",
            color: e.type === "settlement" ? COLORS.success : COLORS.text,
          }}>
            {e.type === "settlement" && "−"}${e.amount.toFixed(2)}
          </span>
        </div>
      ))}

      {/* Yesterday section */}
      <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", margin: "20px 0 8px" }}>Yesterday</p>
      
      {expenses.slice(2, 4).map((e, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
          borderBottom: i < 1 ? `1px solid ${COLORS.border}` : "none",
        }}>
          {e.type === "expense" ? (
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: COLORS.warningLight,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.warning} strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: COLORS.successLight,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.success} strokeWidth="2.2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: e.type === "settlement" ? COLORS.textSecondary : COLORS.text }}>
              {e.type === "expense" ? e.name : `${e.from.name} → ${e.to.name}`}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: COLORS.textTertiary }}>
              {e.type === "expense" ? `paid by ${e.payer.name} · ${e.time}` : `Settlement · ${e.time}`}
            </p>
          </div>
          <span style={{
            fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em",
            color: e.type === "settlement" ? COLORS.success : COLORS.text,
          }}>
            {e.type === "settlement" && "−"}${e.amount.toFixed(2)}
          </span>
        </div>
      ))}

      {/* Earlier section */}
      <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", margin: "20px 0 8px" }}>Earlier</p>
      
      {expenses.slice(4).map((e, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
          borderBottom: i < expenses.slice(4).length - 1 ? `1px solid ${COLORS.border}` : "none",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: COLORS.warningLight,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.warning} strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: COLORS.text }}>{e.name}</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: COLORS.textTertiary }}>paid by {e.payer.name} · {e.time}</p>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, letterSpacing: "-0.01em" }}>
            ${e.amount.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
};

const GroceriesScreen = () => {
  const [items, setItems] = useState([
    { name: "Milk (2%)", addedBy: MEMBERS[2], checked: false },
    { name: "Eggs (dozen)", addedBy: MEMBERS[2], checked: false },
    { name: "Sourdough bread", addedBy: MEMBERS[2], checked: true },
    { name: "Dish soap", addedBy: MEMBERS[0], checked: false },
    { name: "Paper towels", addedBy: MEMBERS[1], checked: false },
  ]);

  const toggleItem = (index) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, checked: !item.checked } : item));
  };

  const unchecked = items.filter(i => !i.checked);
  const checked = items.filter(i => i.checked);

  return (
    <div style={{ padding: "0 20px 24px" }}>
      <div style={{ paddingTop: 16, paddingBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: COLORS.text, letterSpacing: "-0.02em" }}>Groceries</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: COLORS.card,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: COLORS.shadow, border: `1px solid ${COLORS.border}`,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
        </div>
      </div>

      {/* Quick add */}
      <div style={{
        display: "flex", gap: 10, marginBottom: 20,
      }}>
        <div style={{
          flex: 1, background: COLORS.card, borderRadius: 12, padding: "12px 16px",
          border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center",
        }}>
          <span style={{ fontSize: 14, color: COLORS.textTertiary }}>Add an item...</span>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: COLORS.brand,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 2px 8px ${COLORS.brand}44`,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
      </div>

      {/* Items */}
      <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
        To get · {unchecked.length} items
      </p>
      <div style={{
        background: COLORS.card, borderRadius: 14, overflow: "hidden",
        boxShadow: COLORS.shadow, border: `1px solid ${COLORS.border}`, marginBottom: 20,
      }}>
        {unchecked.map((item, i) => {
          const origIndex = items.indexOf(item);
          return (
            <div key={origIndex} onClick={() => toggleItem(origIndex)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
              borderBottom: i < unchecked.length - 1 ? `1px solid ${COLORS.border}` : "none",
              cursor: "pointer",
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, border: `2px solid ${COLORS.textTertiary}`,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: COLORS.text }}>{item.name}</p>
              </div>
              <Avatar member={item.addedBy} size={22} />
            </div>
          );
        })}
      </div>

      {checked.length > 0 && (
        <>
          <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
            Done · {checked.length} item{checked.length > 1 ? "s" : ""}
          </p>
          <div style={{
            background: COLORS.card, borderRadius: 14, overflow: "hidden",
            boxShadow: COLORS.shadow, border: `1px solid ${COLORS.border}`,
          }}>
            {checked.map((item, i) => {
              const origIndex = items.indexOf(item);
              return (
                <div key={origIndex} onClick={() => toggleItem(origIndex)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                  borderBottom: i < checked.length - 1 ? `1px solid ${COLORS.border}` : "none",
                  cursor: "pointer", opacity: 0.5,
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, background: COLORS.brand,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: COLORS.textSecondary, textDecoration: "line-through" }}>{item.name}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const ChoresScreen = () => {
  return (
    <div style={{ padding: "0 20px 24px" }}>
      <div style={{ paddingTop: 16, paddingBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: COLORS.text, letterSpacing: "-0.02em" }}>Chores</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: COLORS.card,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: COLORS.shadow, border: `1px solid ${COLORS.border}`,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{
          flex: 1, background: COLORS.card, borderRadius: 14, padding: "14px 14px",
          boxShadow: COLORS.shadow, border: `1px solid ${COLORS.border}`, textAlign: "center",
        }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: COLORS.warning, margin: 0 }}>1</p>
          <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.04em" }}>Pending</p>
        </div>
        <div style={{
          flex: 1, background: COLORS.card, borderRadius: 14, padding: "14px 14px",
          boxShadow: COLORS.shadow, border: `1px solid ${COLORS.border}`, textAlign: "center",
        }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: COLORS.danger, margin: 0 }}>1</p>
          <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.04em" }}>Disputed</p>
        </div>
        <div style={{
          flex: 1, background: COLORS.card, borderRadius: 14, padding: "14px 14px",
          boxShadow: COLORS.shadow, border: `1px solid ${COLORS.border}`, textAlign: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: COLORS.brand, margin: 0 }}>2</p>
            <span style={{ fontSize: 16 }}>🔥</span>
          </div>
          <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.04em" }}>Streak</p>
        </div>
      </div>

      {/* My chores */}
      <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Your chores</p>
      <div style={{
        background: COLORS.card, borderRadius: 14, overflow: "hidden",
        boxShadow: COLORS.shadow, border: `1px solid ${COLORS.border}`, marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: COLORS.warningLight,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ fontSize: 20 }}>👕</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: COLORS.text }}>Folding clothes</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
              <Badge color={COLORS.warning} bg={COLORS.warningLight}>Weekly</Badge>
              <span style={{ fontSize: 12, color: COLORS.textTertiary }}>Due in 7d</span>
            </div>
          </div>
          <button style={{
            width: 36, height: 36, borderRadius: 10, border: `2px solid ${COLORS.brandMuted}`,
            background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.brand} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </div>
      </div>

      {/* Household chores */}
      <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Household</p>
      <div style={{
        background: COLORS.card, borderRadius: 14, overflow: "hidden",
        boxShadow: COLORS.shadow, border: `1px solid ${COLORS.border}`,
      }}>
        {[
          { name: "Dishes", emoji: "🍽️", member: MEMBERS[2], due: "7d", freq: "Weekly", status: null },
          { name: "Laundry", emoji: "🧺", member: MEMBERS[0], due: "7d", freq: "Weekly", status: "Disputed" },
          { name: "Vacuum", emoji: "🧹", member: MEMBERS[0], due: "7d", freq: "Weekly", status: null },
          { name: "Dishes", emoji: "🍽️", member: MEMBERS[2], due: "7d", freq: "Weekly", status: null },
        ].map((chore, i, arr) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
            borderBottom: i < arr.length - 1 ? `1px solid ${COLORS.border}` : "none",
            background: chore.status === "Disputed" ? `${COLORS.dangerLight}44` : "transparent",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: chore.status === "Disputed" ? COLORS.dangerLight : "#F5F5F5",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: 20 }}>{chore.emoji}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: COLORS.text }}>{chore.name}</p>
                {chore.status && <Badge color={COLORS.danger} bg={COLORS.dangerLight}>{chore.status}</Badge>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                <Avatar member={chore.member} size={16} />
                <span style={{ fontSize: 12, color: COLORS.textTertiary }}>{chore.member.name} · Due in {chore.due}</span>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.textTertiary} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function RoomYRedesign() {
  const [activeTab, setActiveTab] = useState("home");

  const tabs = [
    { id: "home", label: "Home", icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? COLORS.brand : "none"} stroke={active ? COLORS.brand : COLORS.textTertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    )},
    { id: "expenses", label: "Expenses", icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? COLORS.brand : "none"} stroke={active ? COLORS.brand : COLORS.textTertiary} strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
    )},
    { id: "groceries", label: "Groceries", icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? COLORS.brand : COLORS.textTertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
    )},
    { id: "chores", label: "Chores", icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? COLORS.brand : COLORS.textTertiary} strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    )},
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
      {/* Phone Frame */}
      <div style={{
        width: 390,
        height: 844,
        background: COLORS.bg,
        borderRadius: 44,
        boxShadow: "0 24px 80px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        border: "8px solid #1A1A1A",
      }}>
        {/* Status Bar */}
        <div style={{
          height: 54, padding: "12px 28px 0",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>9:41</span>
          <div style={{
            width: 126, height: 34, background: COLORS.text,
            borderRadius: 20, position: "absolute", left: "50%", transform: "translateX(-50%)", top: 12,
          }} />
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <svg width="16" height="12" viewBox="0 0 16 12"><rect x="0" y="3" width="3" height="9" rx="1" fill={COLORS.text}/><rect x="4.5" y="2" width="3" height="10" rx="1" fill={COLORS.text}/><rect x="9" y="0" width="3" height="12" rx="1" fill={COLORS.text}/><rect x="13" y="1" width="3" height="11" rx="1" fill={COLORS.textTertiary}/></svg>
            <svg width="15" height="12" viewBox="0 0 15 12"><path d="M7.5 3.6C9.3 3.6 10.9 4.3 12 5.5L13.5 4C12 2.4 9.9 1.4 7.5 1.4S3 2.4 1.5 4L3 5.5C4.1 4.3 5.7 3.6 7.5 3.6Z" fill={COLORS.text}/><path d="M7.5 6.8C8.6 6.8 9.5 7.2 10.2 7.9L11.7 6.4C10.6 5.3 9.1 4.6 7.5 4.6S4.4 5.3 3.3 6.4L4.8 7.9C5.5 7.2 6.4 6.8 7.5 6.8Z" fill={COLORS.text}/><circle cx="7.5" cy="10.5" r="1.5" fill={COLORS.text}/></svg>
            <div style={{ width: 25, height: 12, borderRadius: 3, border: `1px solid ${COLORS.textSecondary}`, padding: 1, display: "flex" }}>
              <div style={{ width: "70%", height: "100%", borderRadius: 1.5, background: COLORS.text }} />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {activeTab === "home" && <HomeScreen />}
          {activeTab === "expenses" && <ExpensesScreen />}
          {activeTab === "groceries" && <GroceriesScreen />}
          {activeTab === "chores" && <ChoresScreen />}
        </div>

        {/* FAB */}
        {(activeTab === "expenses" || activeTab === "chores") && (
          <div style={{
            position: "absolute", bottom: 100, right: 24,
            width: 52, height: 52, borderRadius: 16,
            background: COLORS.brand,
            boxShadow: `0 4px 16px ${COLORS.brand}55`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        )}

        {/* Tab Bar */}
        <div style={{
          height: 84, background: COLORS.card,
          borderTop: `1px solid ${COLORS.border}`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-around",
          paddingTop: 8, flexShrink: 0,
        }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "4px 12px", minWidth: 64,
            }}>
              {tab.icon(activeTab === tab.id)}
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: activeTab === tab.id ? COLORS.brand : COLORS.textTertiary,
                letterSpacing: "0.02em",
              }}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
