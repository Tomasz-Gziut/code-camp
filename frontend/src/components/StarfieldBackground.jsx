import React from "react";

export default function StarfieldBackground() {
  return (
    <div className="starfield" aria-hidden="true">
      <div className="starfieldBase" />
      <div className="starGradient starGradientA" />
      <div className="starGradient starGradientB" />
    </div>
  );
}
