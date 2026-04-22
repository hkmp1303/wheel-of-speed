import React, { useEffect, useRef, useState } from "react";

const VALUES = [100, 200, 300, 400, 500];
const COLORS = ["#f8b400", "#f85f73", "#28c76f", "#009efd", "#7367f0"];
const RADIUS = 45;
const SLICE_ANGLE = 360 / VALUES.length;

/**
 * Converts polar coordinates to cartesian for SVG path generation
 */
function polarToCartesian(angle, radius = RADIUS) {
  const rad = (angle - 90) * Math.PI / 180;
  return {
    x: radius * Math.cos(rad),
    y: radius * Math.sin(rad)
  };
}

/**
 * PrizeWheel Component
 *
 * Props:
 *   - spinPending: boolean - indicates if a spin is in progress
 *   - reward: number - the reward value that was won
 *   - onSpinComplete: function - callback after spin animation completes
 */
export default function PrizeWheel({ spinPending = false, reward = null, onSpinComplete = null }) {
  const wheelGroupRef = useRef(null);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [lastReward, setLastReward] = useState(null);
  const animationTimeoutRef = useRef(null);

  /**
   * Generate wheel slices and text dynamically
   */
  const slices = VALUES.map((value, i) => {
    const startAngle = i * SLICE_ANGLE;
    const endAngle = startAngle + SLICE_ANGLE;
    const largeArc = SLICE_ANGLE > 180 ? 1 : 0;

    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);

    const pathD = `
      M0,0
      L${start.x},${start.y}
      A${RADIUS},${RADIUS} 0 ${largeArc},1 ${end.x},${end.y}
      Z
    `;

    const midAngle = startAngle + SLICE_ANGLE / 2;
    const textPos = polarToCartesian(midAngle);

    if (i === 0) {
      console.log(`Slice 0: startAngle=${startAngle}, SLICE_ANGLE=${SLICE_ANGLE}, midAngle=${midAngle}`);
    }

    return {
      id: i,
      pathD,
      fill: COLORS[i],
      textX: 0,//textPos.x * 0.6,
      textY: -25,//textPos.y * 0.6,
      textRotate: midAngle,
      value
    };
  });

  /**
   * Spin the wheel to a target value
   * Triggers when reward changes (detects new spin result from server)
   */
  useEffect(() => {
    // Only spin if reward is not null and different from last spin
    if (reward === null || reward === lastReward) return;

    // Find the index of the winning value
    const winnerIndex = VALUES.indexOf(reward);
    if (winnerIndex === -1) {
      console.warn(`Reward value ${reward} not found in wheel values`);
      return;
    }

    console.log(`🎡 Spinning wheel to land on ${reward}`);

    // Calculate target angle
    // The pointer is at the top (0 degrees), so we rotate to align the winning slice center with it
    const spins = 5; // Full rotations for visual effect
    const targetAngle =
      360 * spins +
      (360 - (winnerIndex * SLICE_ANGLE + SLICE_ANGLE / 2));

    const newRotation = currentRotation + targetAngle;
    setCurrentRotation(newRotation);

    // Apply animation
    if (wheelGroupRef.current) {
      wheelGroupRef.current.style.transition = "transform 3s cubic-bezier(.17,.67,.83,.67)";
      wheelGroupRef.current.style.transform = `rotate(${newRotation}deg)`;
      console.log(`Rotating from ${currentRotation}° to ${newRotation}° (target: ${targetAngle}°)`);
    }

    // Update lastReward to track this spin
    setLastReward(reward);

    // Call onSpinComplete after animation finishes
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    animationTimeoutRef.current = setTimeout(() => {
      if (onSpinComplete) {
        onSpinComplete(reward);
      }
    }, 3000);

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [reward, currentRotation, lastReward]);

  return (
    <div className="prize-wheel" aria-hidden>
      <div className="wheel-visual">
        <svg width="200" height="200" viewBox="-50 -50 100 100" preserveAspectRatio="xMidYMid meet">
          <g ref={wheelGroupRef} >
            {/* Render wheel slices */}
            {slices.map((slice) => (
              <g key={slice.id} className="wheel-slice" transform="rotate(72)">
                <path d={slice.pathD} fill={slice.fill} />
                <text
                  x={slice.textX}
                  y={slice.textY}
                  transform={`rotate(${slice.textRotate})`}
                  className="wheel-text"
                >
                  {slice.value}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div className={`reward-display${!!reward ? "" : " hidden"}`}>
        Reward: {reward}
      </div>
    </div>
  );
}