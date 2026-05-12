export default function HeroWaveform() {
  return (
    <div className="flex items-end gap-1.5 h-32 motion-reduce:hidden">
      {[
        { h: 40, d: "0s" },
        { h: 64, d: "0.2s" },
        { h: 32, d: "0.4s" },
        { h: 80, d: "0.1s" },
        { h: 48, d: "0.3s" },
        { h: 56, d: "0.5s" },
        { h: 28, d: "0.15s" },
        { h: 72, d: "0.35s" },
      ].map((bar, i) => (
        <span
          key={i}
          className="block w-[3px] bg-neon-amber rounded-sm origin-bottom"
          style={{
            height: `${bar.h}px`,
            animation: `wave 1.8s ease-in-out ${bar.d} infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(1); opacity: 0.45; }
          50%       { transform: scaleY(1.6); opacity: 0.95; }
        }
      `}</style>
    </div>
  );
}
