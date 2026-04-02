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

      {/* Wand cursor — PNG image */}
      <img
        ref={wandRef}
        src="/Adobe Express - file.png"
        alt=""
        draggable={false}
        style={{
          position: 'fixed',
          top: -2,
          left: -2,
          width: 50,
          height: 75,
          objectFit: 'contain',
          filter: hovering
            ? 'drop-shadow(0 0 8px rgba(80,200,100,0.5)) drop-shadow(0 0 16px rgba(74,212,100,0.2))'
            : 'drop-shadow(0 0 3px rgba(140,120,60,0.4))',
          transition: 'filter 0.3s',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
