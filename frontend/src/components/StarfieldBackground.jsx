import React from "react";

const STAR_LAYERS = [
  { count: 90, minSize: 0.8, maxSize: 2.2, durationMin: 4.8, durationMax: 8.5, delayStep: 0.12, opacity: 0.52 },
  { count: 56, minSize: 1.4, maxSize: 3.1, durationMin: 6.2, durationMax: 10.8, delayStep: 0.18, opacity: 0.78 },
  { count: 28, minSize: 2.2, maxSize: 4.6, durationMin: 7.5, durationMax: 12.5, delayStep: 0.25, opacity: 1 },
];

function createLayer(config, layerIndex) {
  return Array.from({ length: config.count }, (_, index) => {
    const seed = (index + 1) * (layerIndex + 3) * 9973;
    const top = (seed * 17) % 100;
    const left = (seed * 29) % 100;
    const sizeRange = config.maxSize - config.minSize;
    const size = config.minSize + (((seed * 13) % 100) / 100) * sizeRange;
    const duration = config.durationMin + (((seed * 7) % 100) / 100) * (config.durationMax - config.durationMin);
    const delay = -1 * ((index * config.delayStep + layerIndex * 0.9) % config.durationMax);
    const driftX = (((seed * 19) % 7) - 3) * 0.8;
    const driftY = (((seed * 23) % 7) - 3) * 0.6;

    return {
      id: `layer-${layerIndex}-star-${index}`,
      style: {
        top: `${top}%`,
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        opacity: config.opacity,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        "--drift-x": `${driftX}px`,
        "--drift-y": `${driftY}px`,
      },
    };
  });
}

const LAYERS = STAR_LAYERS.map(createLayer);

export default function StarfieldBackground() {
  return (
    <div className="starfield" aria-hidden="true">
      <div className="starfieldGlow starfieldGlowA" />
      <div className="starfieldGlow starfieldGlowB" />
      {LAYERS.map((layer, layerIndex) => (
        <div key={layerIndex} className={`starLayer starLayer${layerIndex + 1}`}>
          {layer.map((star) => (
            <span key={star.id} className="star" style={star.style} />
          ))}
        </div>
      ))}
    </div>
  );
}
