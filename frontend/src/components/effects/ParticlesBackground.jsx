const ParticlesBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(161,161,170,0.5) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(9,9,11,0.6) 70%)',
        }}
      />
    </div>
  );
};

export default ParticlesBackground;
