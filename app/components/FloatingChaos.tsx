"use client";

import { useMemo } from "react";

const PHRASES = [
  "email",
  "mot de passe",
  "ACCÈS REFUSÉ",
  "dossier incomplet",
  "voir agent",
  "tampon requis",
  "retente ta chance",
  "case 12B manquante",
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function FloatingChaos({ count = 10 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        text: PHRASES[Math.floor(Math.random() * PHRASES.length)],
        top: `${randomBetween(5, 90)}%`,
        left: `${randomBetween(5, 90)}%`,
        driftX: `${randomBetween(-200, 200)}px`,
        driftY: `${randomBetween(-200, 200)}px`,
        driftRot: `${randomBetween(-60, 60)}deg`,
        duration: `${randomBetween(2.5, 5)}s`,
        delay: `${randomBetween(0, 0.8)}s`,
        isField: Math.random() > 0.5,
      })),
    [count]
  );

  return (
    <>
      {items.map((item) => (
        <div
          key={item.id}
          className="float-chaos-item z-40"
          style={{
            top: item.top,
            left: item.left,
            // @ts-expect-error custom props CSS
            "--drift-x": item.driftX,
            "--drift-y": item.driftY,
            "--drift-rot": item.driftRot,
            "--drift-duration": item.duration,
            animationDelay: item.delay,
          }}
        >
          {item.isField ? (
            <div className="bg-ink border border-border-log rounded px-3 py-2 text-parchment text-sm font-mono-log shadow-lg">
              {item.text}
            </div>
          ) : (
            <span className="font-display text-rust text-lg font-bold uppercase tracking-wide drop-shadow-lg">
              {item.text}
            </span>
          )}
        </div>
      ))}
    </>
  );
}
