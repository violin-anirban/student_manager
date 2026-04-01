'use client';

import { useEffect, useRef, useState } from 'react';

export default function AnimatedCursor() {
  const wandRef = useRef(null);
  const ringRef = useRef(null);
  const trailRef = useRef(null);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const mouse = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const trail = useRef({ x: -100, y: -100 });
  const raf = useRef(null);

  useEffect(() => {
    if ('ontouchstart' in window) return;
    setMounted(true);

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);
    const onHoverIn = () => setHovering(true);
    const onHoverOut = () => setHovering(false);

    const addHoverListeners = () => {
      document.querySelectorAll('a, button, [role="button"], input, select, textarea, [class*="cursor-pointer"]').forEach((el) => {
        el.addEventListener('mouseenter', onHoverIn);
        el.addEventListener('mouseleave', onHoverOut);
      });
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    addHoverListeners();
    const observer = new MutationObserver(addHoverListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    const animate = () => {
      if (wandRef.current) {
        wandRef.current.style.transform = `translate(${mouse.current.x}px, ${mouse.current.y}px) scale(${hovering ? 1.1 : 1})`;
      }
      ring.current.x += (mouse.current.x - ring.current.x) * 0.15;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.15;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px) scale(${hovering ? 1.8 : 1})`;
      }
      trail.current.x += (mouse.current.x - trail.current.x) * 0.08;
      trail.current.y += (mouse.current.y - trail.current.y) * 0.08;
      if (trailRef.current) {
        trailRef.current.style.transform = `translate(${trail.current.x}px, ${trail.current.y}px) scale(${hovering ? 2.2 : 1})`;
      }
      raf.current = requestAnimationFrame(animate);
    };

    raf.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      observer.disconnect();
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [hovering, visible]);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s',
      }}
    >
      {/* Trailing glow */}
      <div
        ref={trailRef}
        style={{
          position: 'fixed',
          top: -20,
          left: -20,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(184,146,42,0.12) 0%, transparent 70%)',
          willChange: 'transform',
        }}
      />

      {/* Ring */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: -18,
          left: -18,
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: `1.5px solid ${hovering ? '#d4aa4a' : 'rgba(184,146,42,0.5)'}`,
          transition: 'border-color 0.3s, width 0.3s, height 0.3s',
          willChange: 'transform',
          ...(hovering && { top: -24, left: -24, width: 48, height: 48 }),
        }}
      />

      {/*
        Voldemort's Wand — Elder Wand / bone wand style
        Oriented: tip at top-left (click hotspot), handle+hook at bottom-right
        Based on the movie prop: long yew shaft with twisted texture,
        widening into a bone handle with a distinctive curved talon/hook
      */}
      <svg
        ref={wandRef}
        style={{
          position: 'fixed',
          top: -3,
          left: -3,
          width: 80,
          height: 120,
          overflow: 'visible',
          filter: hovering
            ? 'drop-shadow(0 0 8px rgba(80,200,100,0.5)) drop-shadow(0 0 16px rgba(74,212,100,0.2))'
            : 'drop-shadow(0 0 3px rgba(140,120,60,0.4))',
          transition: 'filter 0.3s',
          willChange: 'transform',
        }}
        viewBox="0 0 80 125"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Shaft gradient — darker golden-brown at tip, lighter ivory toward handle */}
          <linearGradient id="vShaft" x1="0.05" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor="#8a7040" />
            <stop offset="20%" stopColor="#a08850" />
            <stop offset="50%" stopColor="#bca46a" />
            <stop offset="80%" stopColor="#cdb878" />
            <stop offset="100%" stopColor="#d8c888" />
          </linearGradient>
          {/* Bone handle gradient */}
          <radialGradient id="vBone" cx="45%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#f0e8d0" />
            <stop offset="40%" stopColor="#e4d8b8" />
            <stop offset="80%" stopColor="#d4c498" />
            <stop offset="100%" stopColor="#c4b080" />
          </radialGradient>
          {/* Hook gradient */}
          <linearGradient id="vHook" x1="0.3" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="#e8dcc0" />
            <stop offset="50%" stopColor="#dcd0a8" />
            <stop offset="100%" stopColor="#c8b890" />
          </linearGradient>
          {/* Shaft highlight (left/top edge gleam) */}
          <linearGradient id="vHi" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5efe4" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f5efe4" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ============================================ */}
        {/*  SHAFT — filled tapered shape, tip to handle */}
        {/* ============================================ */}
        <path
          d="
            M 3.2 0
            C 5 4, 8 12, 11 20
            C 15 30, 19 40, 23.5 50
            C 28 60, 32.5 68, 37.5 76
            C 39.5 79, 41.5 81, 44 83
            L 46 84
            L 43 85
            C 40 83, 38 80, 36 77
            C 31 69, 26.5 59, 22 49
            C 17.5 39, 13 29, 9 19
            C 6 11, 3.5 4, 2 0
            Z
          "
          fill="url(#vShaft)"
        />

        {/* Shaft highlight — gleam along left edge */}
        <path
          d="M 2.5 1 C 5 9, 9 21, 13 31 C 17 41, 21 51, 26 61 C 29 67, 32 72, 35 76"
          stroke="url(#vHi)"
          strokeWidth="0.8"
          strokeLinecap="round"
        />

        {/* Shaft shadow — subtle dark line on right edge */}
        <path
          d="M 4 2 C 7 10, 11 22, 15 32 C 19 42, 23.5 52, 28 62 C 31 68, 34 73, 38 78"
          stroke="#7a6438"
          strokeWidth="0.5"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* ======================================== */}
        {/*  TWISTED TEXTURE — diamond braided ridges */}
        {/* ======================================== */}
        {/* These create the characteristic rope/braid pattern on the shaft */}
        {/* Left-leaning ridges */}
        <path d="M 16.5 33 C 18 34.5, 19.5 33, 18 31" stroke="#a08850" strokeWidth="0.6" opacity="0.55" />
        <path d="M 19 38 C 20.5 39.5, 22 38, 20.5 36" stroke="#a08850" strokeWidth="0.6" opacity="0.55" />
        <path d="M 21.5 43 C 23 44.5, 24.5 43, 23 41" stroke="#a08850" strokeWidth="0.6" opacity="0.5" />
        <path d="M 24 48 C 25.5 49.5, 27 48, 25.5 46" stroke="#a08850" strokeWidth="0.6" opacity="0.5" />
        <path d="M 26.5 53 C 28 54.5, 29.5 53, 28 51" stroke="#a08850" strokeWidth="0.6" opacity="0.5" />
        <path d="M 29 58 C 30.5 59.5, 32 58, 30.5 56" stroke="#a08850" strokeWidth="0.6" opacity="0.45" />
        <path d="M 31.5 63 C 33 64.5, 34.5 63, 33 61" stroke="#a08850" strokeWidth="0.6" opacity="0.45" />
        <path d="M 34 68 C 35.5 69.5, 37 68, 35.5 66" stroke="#a08850" strokeWidth="0.6" opacity="0.4" />

        {/* Right-leaning ridges (cross-braiding) */}
        <path d="M 18 31.5 C 17 33, 18.5 34.5, 19.5 33" stroke="#cbb878" strokeWidth="0.45" opacity="0.4" />
        <path d="M 20.5 36.5 C 19.5 38, 21 39.5, 22 38" stroke="#cbb878" strokeWidth="0.45" opacity="0.4" />
        <path d="M 23 41.5 C 22 43, 23.5 44.5, 24.5 43" stroke="#cbb878" strokeWidth="0.45" opacity="0.4" />
        <path d="M 25.5 46.5 C 24.5 48, 26 49.5, 27 48" stroke="#cbb878" strokeWidth="0.45" opacity="0.4" />
        <path d="M 28 51.5 C 27 53, 28.5 54.5, 29.5 53" stroke="#cbb878" strokeWidth="0.45" opacity="0.35" />
        <path d="M 30.5 56.5 C 29.5 58, 31 59.5, 32 58" stroke="#cbb878" strokeWidth="0.45" opacity="0.35" />
        <path d="M 33 61.5 C 32 63, 33.5 64.5, 34.5 63" stroke="#cbb878" strokeWidth="0.45" opacity="0.35" />

        {/* ============================================ */}
        {/*  HANDLE — widening bone knob / joint         */}
        {/* ============================================ */}
        <path
          d="
            M 44 83
            C 46 82, 49 81, 52 82
            C 56 83, 59 86, 60 89
            C 61 92, 60 95, 57 97
            C 54 99, 50 99, 47 98
            C 44 97, 42 94, 41 91
            C 40 88, 41 85, 43 84
            Z
          "
          fill="url(#vBone)"
        />

        {/* Handle highlight — top-left gleam */}
        <path
          d="M 45 84 C 47 83, 50 82.5, 53 83.5"
          stroke="#f2ecd8"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Handle shadow — bottom-right depth */}
        <path
          d="M 55 97 C 52 99, 48 99, 46 97.5"
          stroke="#9a8860"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.4"
        />

        {/* Handle center ridge — bone joint line */}
        <path
          d="M 46 88 C 50 87, 54 88, 56 91"
          stroke="#b8a878"
          strokeWidth="0.6"
          strokeLinecap="round"
          opacity="0.35"
        />

        {/* ============================================ */}
        {/*  HOOK — the distinctive curved talon/claw    */}
        {/*  Extends from handle, curves right then       */}
        {/*  hooks back with a sharp tip                 */}
        {/* ============================================ */}
        <path
          d="
            M 57 96
            C 60 98, 63 101, 65 105
            C 67 109, 67 113, 64 115
            C 62 116.5, 59 115.5, 57 113
            C 55.5 111, 55 108, 56 105
            C 56.5 103, 55 100, 53 98
          "
          fill="url(#vHook)"
          stroke="#c0aa80"
          strokeWidth="0.6"
        />

        {/* Hook highlight — outer curve gleam */}
        <path
          d="M 58 97.5 C 61 100, 63.5 103, 65 107"
          stroke="#f0e8d4"
          strokeWidth="0.7"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Hook shadow — inner curve */}
        <path
          d="M 64 114 C 61 115, 59 113, 57.5 110"
          stroke="#8a7a50"
          strokeWidth="0.6"
          strokeLinecap="round"
          opacity="0.4"
        />

        {/* Hook tip — sharp point */}
        <circle cx="57" cy="112.5" r="0.8" fill="#c8b890" />

        {/* ============================================ */}
        {/*  SECONDARY PRONG — small bone spur            */}
        {/*  Branches off opposite side of handle         */}
        {/* ============================================ */}
        <path
          d="
            M 42 92
            C 40 94, 38 97, 37 100
            C 36.5 102, 37 103.5, 38.5 103
            C 40 102.5, 40.5 100, 40 97
            C 40 95, 41 93, 43 92
          "
          fill="url(#vHook)"
          stroke="#c0aa80"
          strokeWidth="0.4"
          opacity="0.85"
        />

        {/* Spur highlight */}
        <path
          d="M 41.5 93 C 39.5 95.5, 38.5 98, 38 100"
          stroke="#f0e8d4"
          strokeWidth="0.5"
          strokeLinecap="round"
          opacity="0.4"
        />

        {/* ============================================ */}
        {/*  TIP DETAIL — sharp wand point               */}
        {/* ============================================ */}
        <ellipse cx="2.6" cy="0.5" rx="1" ry="0.5" fill="#8a7040" opacity="0.6" />
        <circle cx="2.6" cy="0.3" r="0.4" fill="#f0e8d0" opacity="0.5" />
      </svg>
    </div>
  );
}
