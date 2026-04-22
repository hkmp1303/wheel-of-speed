import React, { useEffect, useRef, useState } from "react";
import css from "./PrizeWheel.module.css";

const VALUES = [100, 200, 300, 400, 500];

const RADIUS = 45;
const SLICE_ANGLE = 360 / VALUES.length;

// Starting position: pointer at top (0°) should point to the center of middle slice (index 2, value 300)
// This creates a balanced initial appearance
// Slice 2 center is at: 2 * SLICE_ANGLE + SLICE_ANGLE/2 = 2 * 72 + 36 = 180°
// To align slice 2 center with pointer at 0°, we need to rotate backwards by 180°
const INITIAL_ROTATION = -180;

// Consistent rotation speed: degrees per second
// This ensures the wheel always rotates at the same speed regardless of distance
const ROTATION_SPEED_DEG_PER_SEC = 540; // 540°/s = 1080° in 2 seconds minimum spin

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

export default function PrizeWheel({ spinPending = false, reward = null, onSpinComplete = null }) {
  const wheelGroupRef = useRef(null);
  const [currentRotation, setCurrentRotation] = useState(INITIAL_ROTATION);
  const [lastReward, setLastReward] = useState(null);
  const [landedSliceIndex, setLandedSliceIndex] = useState(null);
  const [showTextGlow, setShowTextGlow] = useState(false);
  const [showRewardDisplay, setShowRewardDisplay] = useState(false);
  const animationTimeoutRef = useRef(null);
  const textGlowTimeoutRef = useRef(null);

  /**
   * Initialize wheel to starting position
   */
  useEffect(() => {
    if (wheelGroupRef.current) {
      wheelGroupRef.current.style.transition = "none"; // No animation for initial positioning
      wheelGroupRef.current.style.transform = `rotate(${INITIAL_ROTATION}deg)`;
      console.log(`🎡 Wheel initialized to starting position: ${INITIAL_ROTATION}°`);
    }
  }, []);

  /**
   * Clear reward display when reward becomes null (next round starts)
   */
  useEffect(() => {
    if (reward === null) {
      setShowRewardDisplay(false);
      setShowTextGlow(false);
      setLandedSliceIndex(null);
    }
  }, [reward]);

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
      fill: "var(--slice-" + (i + 1) + ")",
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
    //if (reward === null || reward === undefined || reward === lastReward) return;

    // Find the index of the winning value
    const winnerIndex = VALUES.indexOf(reward);
    if (winnerIndex === -1) {
      console.error(`Reward value ${reward} not found in wheel values [${VALUES.join(', ')}]. Backend returned unknown value!`);
      return;
    }

    console.log(`🎡 Spinning wheel to land on ${reward} (index ${winnerIndex})`);
    console.log(`VALUES array: [${VALUES.join(', ')}]`);
    console.log(`SLICE_ANGLE: ${SLICE_ANGLE}°`);
    console.log(`Current rotation before spin: ${currentRotation}°`);

    // Calculate target angle
    // The pointer is at the top (0 degrees in CSS coordinates)
    // Slices are defined in the SVG's local coordinate system where slice i's center is at: i * SLICE_ANGLE + SLICE_ANGLE/2
    // When we rotate the wheel, we're rotating this local coordinate system
    // To align slice center with the pointer at top, we need to rotate the wheel such that:
    // final_rotation ≡ -(slice_center_angle) (mod 360)
    // The negative is because rotating the wheel clockwise moves slice positions counter-clockwise relative to the fixed pointer

    const sliceCenterInWheelCoords = winnerIndex * SLICE_ANGLE + SLICE_ANGLE / 2;
    const sliceCenterAngle = -sliceCenterInWheelCoords; // Invert because we rotate the wheel, not the pointer

    // Normalize current rotation to 0-360 to get the true current position
    const normalizedCurrent = ((currentRotation % 360) + 360) % 360;
    console.log(`Normalized current rotation: ${normalizedCurrent}°`);

    // Debug: log what each slice's target rotation should be
    for (let i = 0; i < VALUES.length; i++) {
      const centerInWheelCoords = i * SLICE_ANGLE + SLICE_ANGLE / 2;
      const targetRotation = -centerInWheelCoords;
      const normalizedTarget = ((targetRotation % 360) + 360) % 360;
      console.log(`  Slice ${i} (value ${VALUES[i]}): center at ${centerInWheelCoords}°, target rotation ${targetRotation}° (normalized: ${normalizedTarget}°)`);
    }

    // Ensure at least 2 full revolutions (720°) plus the target landing position
    const minSpins = 2; // At least 2 full rotations
    const minRotation = 360 * minSpins; // 720°

    // Calculate how much we need to rotate from current position
    // Normalize target to 0-360 range first
    const normalizedTarget = ((sliceCenterAngle % 360) + 360) % 360;

    // Calculate the shortest distance to the target, then add full rotations
    let delta = normalizedTarget - normalizedCurrent;

    // If delta is negative, add 360 to go the positive direction
    if (delta < 0) {
      delta += 360;
    }

    // Ensure delta is at least minRotation (minimum 2 full spins)
    while (delta < minRotation) {
      delta += 360;
    }

    const newRotation = currentRotation + delta;

    // Calculate animation duration based on rotation distance to maintain consistent speed
    // speed = delta / duration, so duration = delta / speed
    const animationDurationSec = delta / ROTATION_SPEED_DEG_PER_SEC;

    console.log(`Target slice center angle: ${sliceCenterAngle}°`);
    console.log(`Normalized current: ${normalizedCurrent}°, normalized target: ${normalizedTarget}°`);
    console.log(`Delta to add: ${delta}°, Min required: ${minRotation}°`);
    console.log(`Animation duration: ${animationDurationSec.toFixed(2)}s at ${ROTATION_SPEED_DEG_PER_SEC}°/s`);
    console.log(`Rotating from ${currentRotation}° to ${newRotation}°`);
    console.log(`🎯 Animation start - Total degree of rotation: ${delta}°`);

    setCurrentRotation(newRotation);

    // Apply animation with duration based on rotation distance
    if (wheelGroupRef.current) {
      wheelGroupRef.current.style.transition = `transform ${animationDurationSec}s cubic-bezier(.42,0,.58,1)`;
      wheelGroupRef.current.style.transform = `rotate(${newRotation}deg)`;
    }

    // Update lastReward to track this spin
    setLastReward(reward);

    // Track which slice landed (for glow effect)
    // winnerIndex corresponds to VALUES[winnerIndex], and the wheel rotates so this slice ends up at the pointer
    setLandedSliceIndex(winnerIndex);
    setShowTextGlow(false); // Reset text glow
    setShowRewardDisplay(false); // Hide reward display during animation
    console.log(`✨ Setting glow on slice index ${winnerIndex} (value ${VALUES[winnerIndex]})`);

    // Show text glow immediately after animation completes
    if (textGlowTimeoutRef.current) {
      clearTimeout(textGlowTimeoutRef.current);
    }
    textGlowTimeoutRef.current = setTimeout(() => {
      setShowTextGlow(true);
      setShowRewardDisplay(true); // Show reward display after animation
    }, animationDurationSec * 1000);

    // Call onSpinComplete after animation finishes (use same duration as animation)
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    animationTimeoutRef.current = setTimeout(() => {
      if (onSpinComplete) {
        onSpinComplete(reward);
      }
    }, animationDurationSec * 1000);

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (textGlowTimeoutRef.current) {
        clearTimeout(textGlowTimeoutRef.current);
      }
    };
  }, [reward, lastReward]);

  return (
    <div className={css.prizeWheel} aria-hidden>
      <div className={css.wheelVisual}>
        <svg width="200" height="200" viewBox="-50 -50 100 100" preserveAspectRatio="xMidYMid meet">
          <circle className={css.wheelOutline} r="45" cx="0" cy="0" />
            <g ref={wheelGroupRef} id="wheelGroup">
            {/* Render wheel slices */}
            {slices.map((slice) => (
              <g
                key={slice.id}
                className={`${css.wheelSlice} ${landedSliceIndex === slice.id ? css.landed : ''}`}
                data-landed={landedSliceIndex === slice.id}
              >
                <path
                  d={slice.pathD}
                  fill={slice.fill}
                  className={landedSliceIndex === slice.id && !showTextGlow ? css.landedPath : ''}
                />
                <text
                  x={slice.textX}
                  y={slice.textY}
                  transform={`rotate(${slice.textRotate})`}
                  className={`${css.wheelText} ${landedSliceIndex === slice.id && showTextGlow ? css.textGlow : ''}`}
                  data-text-glow={landedSliceIndex === slice.id && showTextGlow}
                >
                  {slice.value}
                </text>
              </g>
            ))}
            </g>

        </svg>
      </div>

      <div className={`${css.rewardDisplay} ${showRewardDisplay ? "" : css.hidden}`}>
        Reward: {reward}
      </div>
    </div>
  );
}