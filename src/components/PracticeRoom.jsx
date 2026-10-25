"use client";
// Practice-mode interview room. Ported from asparagus src/components/InterviewRoom.jsx
// (same lobby → Daily call → Jane flow, same engine session API) with the
// hiring-only parts removed: proctoring, video upload, tenant branding and the
// "sent to recruiter" screens. When the call ends we hand off to the report page.
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/authFetch";
import { PRODUCT_MANAGER } from "@/lib/practiceConfig";

const BRAND = "#8b5cf6";

// ─── Icons (stroke-based, consistent style) ───────────────────────────────────
const I = { fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };

const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...I}>
    <rect x="9" y="2" width="6" height="12" rx="3"/>
    <path d="M19 10a7 7 0 0 1-14 0"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
  </svg>
);

const MicOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...I}>
    <line x1="2" y1="2" x2="22" y2="22"/>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"/>
    <path d="M5 10a7 7 0 0 0 12.33 4.58M19 10v0"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const CamIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...I}>
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2"/>
  </svg>
);

const CamOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...I}>
    <line x1="2" y1="2" x2="22" y2="22"/>
    <path d="M16 16H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2m3-1h6l2 3h2a2 2 0 0 1 2 2v6"/>
    <line x1="16" y1="12" x2="23" y2="7"/>
    <line x1="23" y1="17" x2="23" y2="7"/>
  </svg>
);

const PhoneOffIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...I}>
    <line x1="23" y1="1" x2="1" y2="23"/>
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.96.37 1.97.61 3 .7a2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67"/>
    <path d="M5.68 5.68A19.75 19.75 0 0 0 2 12.34 2 2 0 0 0 3.72 14.4c1.03.09 2.04.33 3 .7a2 2 0 0 1 .45 2.11L6 18.5"/>
  </svg>
);

// ─── Mini waveform (name strip) ──────────────────────────────────────────────
function MiniWaveform({ active }) {
  const BARS = 4;
  const [heights, setHeights] = useState(Array(BARS).fill(2));
  const frameRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const animate = () => {
      frameRef.current++;
      if (active) {
        setHeights(prev => prev.map((_, i) => {
          const wave = Math.sin((frameRef.current * 0.25) + i * 1.1) * 0.5 + 0.5;
          return Math.max(2, 2 + (wave + Math.random() * 0.15) * 11);
        }));
      } else {
        setHeights(Array(BARS).fill(2));
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {heights.map((h, i) => (
        <div key={i} style={{
          width: 2, borderRadius: 2,
          height: `${h}px`,
          background: active ? "#a78bfa" : "rgba(255,255,255,0.25)",
          transition: "height 0.08s ease",
        }} />
      ))}
    </div>
  );
}

// ─── Timer ────────────────────────────────────────────────────────────────────
function Timer({ startTime, durationMins = 20 }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);
  const remaining = durationMins * 60 - elapsed;
  const over = remaining < 0;
  const abs = Math.abs(remaining);
  const mm = Math.floor(abs / 60).toString().padStart(2, "0");
  const ss = (abs % 60).toString().padStart(2, "0");
  const color = over ? "#f87171" : remaining < 120 ? "#fbbf24" : "rgba(255,255,255,0.7)";
  return (
    <span style={{ fontFamily: "monospace", fontSize: 14, color, letterSpacing: "0.05em" }}>
      {over ? "+" : ""}{mm}:{ss}
    </span>
  );
}

// ─── Mobile breakpoint hook ───────────────────────────────────────────────────
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PracticeRoom({ sessionId }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState("loading");
  const [sessionData, setSessionData] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [error, setError] = useState("");

  const callRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const inCallVideoNodeRef = useRef(null);
  const localVideoTrackRef = useRef(null); // stores Daily local video track
  const joinedAtRef = useRef(null); // timestamp of joined-meeting — used to detect near-instant disconnects

  // Callback ref: fires when <video> mounts. If the track already arrived
  // via track-started (which fires before joined-meeting→phase=active),
  // attach it immediately. Otherwise it's a no-op — track-started will set it.
  const inCallVideoRef = useCallback((node) => {
    inCallVideoNodeRef.current = node;
    if (node && localVideoTrackRef.current) {
      node.srcObject = new MediaStream([localVideoTrackRef.current]);
    }
  }, []);

  // ── Load session ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await authFetch(`/api/practice/${sessionId}/join`);
        if (res.status === 401) {
          router.replace(`/signin?next=${encodeURIComponent(`/practice/${sessionId}/room`)}`);
          return;
        }
        if (res.status === 410) {
          const body = await res.text().catch(() => "");
          if (body.includes("completed")) {
            router.replace(`/practice/${sessionId}`);
          } else {
            setError("session_expired");
            setPhase("error");
          }
          return;
        }
        if (res.status === 404) {
          setError("not_found");
          setPhase("error");
          return;
        }
        if (!res.ok) throw new Error(await res.text());
        setSessionData(await res.json());
        setPhase("lobby");
      } catch (e) {
        setError(e.message || "Could not load session");
        setPhase("error");
      }
    };
    load();
  }, [sessionId, router]);

  useEffect(() => {
    const titles = {
      loading: "Preparing your practice interview… · Shortlst",
      lobby: "Practice lobby · Shortlst",
      joining: "Joining… · Shortlst",
      active: "Practice interview in progress · Shortlst",
      complete: "Generating your feedback… · Shortlst",
      error: "Practice interview · Shortlst",
    };
    if (titles[phase]) document.title = titles[phase];
  }, [phase]);

  // ── Camera preview in lobby ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "lobby") return;
    let stream;
    let raf;
    let ctx;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(s => {
        stream = s;
        localStreamRef.current = s;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = s;
        }
        // Audio level analyser — drives the "Mic working" indicator
        ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(s).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setIsCandidateSpeaking(avg > 15);
          raf = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => setIsVideoOff(true));
    return () => {
      cancelAnimationFrame(raf);
      ctx?.close().catch(() => {});
      // Only stop if we haven't already handed it off to Daily on join
      if (localStreamRef.current === stream) {
        stream?.getTracks().forEach(t => t.stop());
      }
    };
  }, [phase]);

  // ── Join call ─────────────────────────────────────────────────────────────
  const joinInterview = useCallback(async () => {
    if (!sessionData) return;
    setPhase("joining");
    try {
      // Start the bot (lazy — it isn't running until the candidate joins)
      await authFetch(`/api/practice/${sessionId}/start`, { method: "POST" }).catch(() => {});

      // Stop the lobby preview stream — Daily will open the camera itself
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;

      const DailyIframe = (await import("@daily-co/daily-js")).default;
      const call = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: !isVideoOff,
      });
      callRef.current = call;

      call.on("joining-meeting", () => setPhase("joining"));
      call.on("joined-meeting", () => {
        setPhase("active");
        setStartTime(Date.now());
        joinedAtRef.current = Date.now();
        call.startRemoteParticipantsAudioLevelObserver(100);
        call.startLocalAudioLevelObserver?.(100);
        if (isMuted) call.setLocalAudio(false);
      });

      // Local video + remote audio via track-started
      call.on("track-started", (evt) => {
        if (evt.participant?.local) {
          if (evt.track?.kind === "video") {
            localVideoTrackRef.current = evt.track;
            if (inCallVideoNodeRef.current) {
              inCallVideoNodeRef.current.srcObject = new MediaStream([evt.track]);
            }
          }
          return;
        }
        if (evt.track?.kind !== "audio") return;
        const el = document.createElement("audio");
        el.srcObject = new MediaStream([evt.track]);
        el.autoplay = true;
        el.setAttribute("playsinline", "");
        el.dataset.dailyTrackId = evt.track.id;
        document.body.appendChild(el);
      });
      call.on("track-stopped", (evt) => {
        if (evt.track?.kind !== "audio") return;
        document.querySelector(`audio[data-daily-track-id="${evt.track.id}"]`)?.remove();
      });

      call.on("remote-participants-audio-level", (evt) => {
        setIsAISpeaking(Object.values(evt.participantsAudioLevel).some(l => l > 0.01));
      });
      call.on("local-audio-level", (evt) => {
        setIsCandidateSpeaking(evt.audioLevel > 0.02);
      });

      // Jane leaving the room means the interview is over
      call.on("participant-left", (evt) => {
        if (!evt.participant?.local) call.leave();
      });

      call.on("left-meeting", () => {
        setIsAISpeaking(false);
        document.querySelectorAll("audio[data-daily-track-id]").forEach(el => el.remove());

        // Jane leaving within seconds of joining means the bot's pipeline failed,
        // not that an interview concluded — don't send them to an empty report.
        const elapsedMs = joinedAtRef.current ? Date.now() - joinedAtRef.current : 0;
        if (elapsedMs < 8000) {
          setError("connection_dropped");
          setPhase("error");
          return;
        }

        setPhase("complete");
        router.replace(`/practice/${sessionId}`);
      });
      call.on("error", (e) => {
        setError(e.errorMsg || "Connection error");
        setPhase("error");
      });

      await call.join({ url: sessionData.room_url, token: sessionData.token });
    } catch (e) {
      setError(e.message || "Failed to join");
      setPhase("error");
    }
  }, [sessionData, isMuted, isVideoOff, sessionId, router]);

  // Leave the Daily call if the user navigates away mid-interview
  useEffect(() => () => { callRef.current?.leave?.().catch?.(() => {}); }, []);

  const toggleMic = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    callRef.current?.setLocalAudio(!next);
  }, [isMuted]);

  const toggleVideo = useCallback(() => {
    const next = !isVideoOff;
    setIsVideoOff(next);
    callRef.current?.setLocalVideo(!next);
  }, [isVideoOff]);

  const endCall = useCallback(async () => {
    // Notify the engine so it skips the reconnect grace period
    try {
      await authFetch(`/api/practice/${sessionId}/end`, { method: "POST" });
    } catch (_) { /* non-fatal — bot will still time out */ }
    if (callRef.current) await callRef.current.leave();
  }, [sessionId]);

  // ── Pre-lobby mute/video toggles (before joining) ─────────────────────────
  const toggleLobbyMic = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !next; });
  };
  const toggleLobbyVideo = () => {
    const next = !isVideoOff;
    setIsVideoOff(next);
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !next; });
    if (localVideoRef.current) {
      localVideoRef.current.style.visibility = next ? "hidden" : "visible";
    }
  };

  const firstName = sessionData?.candidate_name?.split(" ")[0] || "there";
  const practice = sessionData?.practice;
  const typeConfig = PRODUCT_MANAGER.interviewTypes.find(t => t.id === practice?.interview_type);
  const levelConfig = PRODUCT_MANAGER.levels.find(l => l.id === practice?.level);
  const roleLabel = [typeConfig?.name, levelConfig?.name].filter(Boolean).join(" · ") || "Product Manager";

  // ══════════════════════════════════════════════════════════════════════════
  // LOADING / COMPLETE (handing off to the report page)
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === "loading" || phase === "complete") return (
    <div style={S.loadScreen}>
      <div style={S.spinner} />
      <p style={{ color: "#6b7280", fontSize: 14, marginTop: 16 }}>
        {phase === "complete" ? "Nice work — Jane is writing up your feedback…" : "Preparing your practice interview…"}
      </p>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ERROR
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === "error") {
    const title =
      error === "session_expired" ? "This practice session has expired" :
      error === "not_found" ? "Practice session not found" :
      error === "connection_dropped" ? "Couldn't connect you to Jane" :
      "Something went wrong";
    const body =
      error === "session_expired" ? "Practice links are valid for 48 hours. Start a fresh session from your dashboard." :
      error === "not_found" ? "We couldn't find this session on your account. It may belong to a different sign-in." :
      error === "connection_dropped" ? "Something went wrong on our end before the interview could begin. Nothing was recorded. Please start a new session." :
      "We couldn't connect to your interview session. Check your internet connection and try again.";
    return (
      <div style={S.loadScreen}>
        <img src="/logo.svg" alt="Shortlst" style={{ height: 32, marginBottom: 40 }} />
        <div style={S.errorCard}>
          <div style={{ height: 5, background: "linear-gradient(90deg, #e5e7eb, #d1d5db)" }} />
          <div style={{ padding: "36px 36px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: "#111", margin: 0 }}>{title}</h1>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, margin: 0, maxWidth: 360 }}>{body}</p>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <a href="/practice" style={{ ...S.secondaryBtn }}>Back to dashboard</a>
              {error !== "session_expired" && error !== "not_found" && error !== "connection_dropped" && (
                <button onClick={() => window.location.reload()} style={{ ...S.primaryBtn }}>Try again</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LOBBY (pre-interview, white)
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === "lobby" || phase === "joining") return (
    <div style={{ ...S.lobbyPage, overflowY: "auto" }}>
      <div style={{ ...S.lobbyLogo, padding: isMobile ? "14px 20px" : "20px 40px" }}>
        <a href="/practice" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <img src="/logo.svg" alt="Shortlst" style={{ height: isMobile ? 24 : 28 }} />
          <span style={{ fontWeight: 700, fontSize: isMobile ? 16 : 20, letterSpacing: "-0.01em", color: "#111" }}>shortlst</span>
          <span style={S.practicePill}>Practice</span>
        </a>
      </div>

      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center",
        justifyContent: "center",
        gap: isMobile ? 0 : 48,
        padding: isMobile ? "0" : "60px 40px",
        width: "100%",
        maxWidth: isMobile ? "100%" : 980,
        flex: 1,
      }}>
        {/* Camera preview */}
        <div style={{
          ...S.previewBox,
          width: isMobile ? "100%" : 440,
          height: isMobile ? 220 : 300,
          borderRadius: isMobile ? 0 : 16,
        }}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ ...S.previewVideo, visibility: isVideoOff ? "hidden" : "visible" }}
          />
          {isVideoOff && (
            <div style={S.previewOff}>
              <div style={S.avatarCircle}>{firstName[0]?.toUpperCase()}</div>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 10 }}>Camera is off</span>
            </div>
          )}
          <div style={S.previewControls}>
            <button onClick={toggleLobbyMic} title={isMuted ? "Unmute" : "Mute"}
              style={{ ...S.lobbyCtrlBtn, background: isMuted ? "#ef4444" : "rgba(0,0,0,0.6)" }}>
              {isMuted ? <MicOffIcon /> : <MicIcon />}
            </button>
            <button onClick={toggleLobbyVideo} title={isVideoOff ? "Turn on camera" : "Turn off camera"}
              style={{ ...S.lobbyCtrlBtn, background: isVideoOff ? "#ef4444" : "rgba(0,0,0,0.6)" }}>
              {isVideoOff ? <CamOffIcon /> : <CamIcon />}
            </button>
          </div>
          {!isMuted && isCandidateSpeaking && (
            <div style={S.micIndicator}>🎙 Mic working</div>
          )}
        </div>

        {/* Right panel */}
        <div style={{
          ...S.lobbyPanel,
          gap: isMobile ? 16 : 18,
          padding: isMobile ? "28px 20px 36px" : 0,
          flex: isMobile ? "none" : 1,
        }}>
          <div style={S.lobbyBadge}>{roleLabel}</div>
          <h1 style={{ ...S.lobbyTitle, fontSize: isMobile ? 22 : 26 }}>
            Ready to practise, {firstName}?
          </h1>
          <p style={S.lobbySubtitle}>
            <strong>Jane</strong> will run a realistic {typeConfig?.name ?? "PM"} interview
            {practice?.target_company ? <> tailored to <strong>{practice.target_company}</strong></> : null}.
            It takes about 20 minutes. Think out loud, ask clarifying questions, and say
            &ldquo;I&rsquo;d like to end the interview&rdquo; whenever you want to stop.
          </p>

          <div style={S.checkList}>
            <CheckItem ok={!isMuted} label={isMuted ? "Microphone is muted" : "Microphone ready"} />
            <CheckItem ok={!isVideoOff} label={isVideoOff ? "Camera is off (optional)" : "Camera ready"} />
            <CheckItem ok label="Personal feedback report when you finish" />
          </div>

          {typeConfig && (
            <div style={S.scoredBox}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>You&rsquo;ll be scored on</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {typeConfig.rubric.map(r => (
                  <span key={r.label} style={S.rubricChip}>{r.label}</span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={joinInterview}
            disabled={phase === "joining"}
            style={{ ...S.joinBtn, opacity: phase === "joining" ? 0.7 : 1 }}
          >
            {phase === "joining" ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ ...S.spinner, width: 16, height: 16, borderTopColor: "#fff" }} />
                Connecting to Jane…
              </span>
            ) : "Start practice interview"}
          </button>

          <p style={S.securityNote}>🔒 Private to you · Your transcript is used only to generate your feedback</p>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ACTIVE INTERVIEW (dark)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={S.callPage}>
      {/* Top bar */}
      <div style={{ ...S.callHeader, padding: isMobile ? "10px 16px" : "12px 24px" }}>
        <img src="/logo.svg" alt="Shortlst" style={{ height: isMobile ? 22 : 28, filter: "brightness(0) invert(1)" }} />
        <div style={S.practiceBadge}>PRACTICE</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Timer startTime={startTime} />
          {!isMobile && <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>{roleLabel}</span>}
        </div>
      </div>

      {/* Main area: candidate fills the screen */}
      <div style={S.callBody}>
        {!isVideoOff ? (
          <video ref={inCallVideoRef} autoPlay muted playsInline style={S.mainVideo} />
        ) : (
          <div style={S.mainVideoOff}>
            <div style={{ ...S.avatarCircle, width: isMobile ? 72 : 100, height: isMobile ? 72 : 100, fontSize: isMobile ? 26 : 36 }}>
              {firstName[0]?.toUpperCase()}
            </div>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 16 }}>Camera off</span>
          </div>
        )}

        {/* Candidate speaking glow */}
        {isCandidateSpeaking && !isMuted && (
          <div style={{
            position: "absolute", inset: 0,
            border: `2px solid ${BRAND}80`,
            pointerEvents: "none",
            boxShadow: `inset 0 0 60px ${BRAND}14`,
            animation: "pulse-ring 1.5s ease-in-out infinite",
          }} />
        )}

        {/* Candidate name tag */}
        <div style={{ ...S.nameTag, bottom: isMobile ? 80 : 16 }}>
          {isCandidateSpeaking && !isMuted && (
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: BRAND, flexShrink: 0, animation: "pulse 1.2s ease-in-out infinite" }} />
          )}
          {sessionData?.candidate_name}
          {isMuted && <span style={{ color: "#f87171", fontSize: 12 }}>🔇</span>}
        </div>

        {/* Jane PiP — portrait card, bottom right */}
        <div style={{
          position: "absolute",
          bottom: isMobile ? 80 : 16, right: 16,
          width: isMobile ? 100 : 152, height: isMobile ? 140 : 210,
          borderRadius: isMobile ? 12 : 16,
          overflow: "hidden",
          boxShadow: isAISpeaking
            ? `0 0 0 2px ${BRAND}, 0 0 28px ${BRAND}73, 0 12px 40px rgba(0,0,0,0.7)`
            : "0 0 0 1px rgba(255,255,255,0.07), 0 12px 40px rgba(0,0,0,0.6)",
          transition: "box-shadow 0.4s ease",
        }}>
          <img src="/jane.png" alt="Jane" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 55%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 10px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: isAISpeaking ? "#a78bfa" : "rgba(255,255,255,0.35)", flexShrink: 0, transition: "background 0.3s" }} />
              <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Jane</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>· AI</span>
            </div>
            <MiniWaveform active={isAISpeaking} />
          </div>
          {isAISpeaking && <div style={S.speakingBadge}>Speaking</div>}
        </div>
      </div>

      {/* Controls bar */}
      <div style={S.controlsBar}>
        <div style={S.controlsPill}>
          <button onClick={toggleMic} style={{ ...S.ctrlBtn, background: isMuted ? "#ef4444" : "transparent" }} title={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? <MicOffIcon /> : <MicIcon />}
          </button>
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />
          <button onClick={toggleVideo} style={{ ...S.ctrlBtn, background: isVideoOff ? "#ef4444" : "transparent" }} title={isVideoOff ? "Turn on camera" : "Turn off camera"}>
            {isVideoOff ? <CamOffIcon /> : <CamIcon />}
          </button>
        </div>
        <button onClick={endCall} style={{ ...S.ctrlBtn, ...S.endCallBtn }} title="End interview & get feedback">
          <PhoneOffIcon />
        </button>
      </div>
    </div>
  );
}

// ─── CheckItem helper ─────────────────────────────────────────────────────────
function CheckItem({ ok, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#374151" }}>
      <span style={{
        width: 20, height: 20, borderRadius: "50%",
        background: ok ? "#f5f3ff" : "#fee2e2",
        color: ok ? "#7c3aed" : "#ef4444",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>
        {ok ? "✓" : "✕"}
      </span>
      {label}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  spinner: {
    width: 32, height: 32,
    border: "3px solid #e5e7eb",
    borderTopColor: BRAND,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadScreen: {
    minHeight: "100vh",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    background: "#f9fafb",
    padding: 24,
  },
  errorCard: {
    background: "#fff", borderRadius: 20,
    boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
    maxWidth: 480, width: "100%", overflow: "hidden",
  },
  primaryBtn: {
    padding: "11px 22px", borderRadius: 10, border: "none",
    background: BRAND, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  secondaryBtn: {
    padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e5e7eb",
    background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, textDecoration: "none",
  },

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  lobbyPage: {
    minHeight: "100vh", background: "#ffffff",
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  lobbyLogo: {
    width: "100%", padding: "20px 40px",
    display: "flex", alignItems: "center", gap: 8,
    borderBottom: "1px solid #f3f4f6",
  },
  practicePill: {
    marginLeft: 4, padding: "2px 8px", borderRadius: 100,
    background: "#f5f3ff", border: "1px solid #ddd6fe",
    color: "#7c3aed", fontSize: 11, fontWeight: 600,
  },
  previewBox: {
    flexShrink: 0, background: "#1a1a2e",
    overflow: "hidden", position: "relative",
  },
  previewVideo: {
    width: "100%", height: "100%",
    objectFit: "cover", transform: "scaleX(-1)",
  },
  previewOff: {
    position: "absolute", inset: 0,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
  },
  previewControls: {
    position: "absolute", bottom: 16,
    left: "50%", transform: "translateX(-50%)",
    display: "flex", gap: 12,
  },
  lobbyCtrlBtn: {
    width: 44, height: 44, borderRadius: "50%", border: "none",
    color: "#fff", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  micIndicator: {
    position: "absolute", top: 12, left: 12,
    background: `${BRAND}e6`, color: "#fff", fontSize: 11, fontWeight: 600,
    padding: "4px 10px", borderRadius: 100,
  },
  lobbyPanel: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" },
  lobbyBadge: {
    display: "inline-flex", padding: "5px 14px", borderRadius: 100,
    background: "#f5f3ff", border: "1px solid #ddd6fe", color: "#7c3aed",
    fontSize: 12, fontWeight: 600, width: "fit-content",
  },
  lobbyTitle: { fontWeight: 700, color: "#111", lineHeight: 1.3, margin: 0 },
  lobbySubtitle: { fontSize: 14, color: "#6b7280", lineHeight: 1.7, margin: 0 },
  checkList: { display: "flex", flexDirection: "column", gap: 10 },
  scoredBox: {
    background: "#f9fafb", border: "1px solid #f3f4f6",
    borderRadius: 12, padding: "12px 14px",
  },
  rubricChip: {
    fontSize: 12, color: "#4b5563", background: "#fff",
    border: "1px solid #e5e7eb", borderRadius: 100, padding: "3px 10px",
  },
  joinBtn: {
    padding: "14px 0", width: "100%", borderRadius: 10, border: "none",
    background: BRAND, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 8px 24px rgba(139,92,246,0.25)",
  },
  securityNote: { fontSize: 12, color: "#9ca3af", textAlign: "center", margin: 0 },
  avatarCircle: {
    width: 64, height: 64, borderRadius: "50%",
    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    color: "#fff", fontSize: 22, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },

  // ── CALL ───────────────────────────────────────────────────────────────────
  callPage: {
    minHeight: "100vh", height: "100vh", background: "#0d1117",
    display: "flex", flexDirection: "column", overflow: "hidden",
  },
  callHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "rgba(0,0,0,0.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0,
  },
  practiceBadge: {
    padding: "4px 10px", background: "rgba(139,92,246,0.15)",
    border: "1px solid rgba(139,92,246,0.35)", borderRadius: 100,
    color: "#c4b5fd", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
  },
  callBody: { flex: 1, position: "relative", overflow: "hidden", background: "#0d1117", minHeight: 0 },
  mainVideo: { width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: "block" },
  mainVideoOff: {
    width: "100%", height: "100%",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  },
  nameTag: {
    position: "absolute", left: 16,
    display: "flex", alignItems: "center", gap: 8,
    background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
    color: "#fff", fontSize: 13, fontWeight: 500,
    padding: "6px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
  },
  speakingBadge: {
    position: "absolute", top: 8, left: 8,
    background: `${BRAND}d9`, backdropFilter: "blur(8px)",
    color: "#fff", fontSize: 9, fontWeight: 700,
    padding: "3px 7px", borderRadius: 100, letterSpacing: "0.07em", textTransform: "uppercase",
  },

  // ── Controls ───────────────────────────────────────────────────────────────
  controlsBar: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
    padding: "16px 24px", background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0,
  },
  controlsPill: {
    display: "flex", alignItems: "center",
    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 100, padding: "4px 4px", gap: 2,
  },
  ctrlBtn: {
    width: 48, height: 48, borderRadius: "50%", border: "none",
    color: "#fff", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "transform 0.15s, background 0.2s",
  },
  endCallBtn: {
    background: "#ef4444", width: 52, height: 52,
    boxShadow: "0 4px 16px rgba(239,68,68,0.4)",
  },
};
