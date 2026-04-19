import React, { useEffect, useRef } from "react";

export default function PrizeWheel({ spinPending = false, reward = null }) {
    const animRef = useRef(null);

    useEffect(() => {
        if (!animRef.current) return;
        if (spinPending) {
            animRef.current.classList.add("spinning");
        } else {
            animRef.current.classList.remove("spinning");
        }
    }, [spinPending]);

    return (
        <div className="prize-wheel" aria-hidden>
            <div ref={animRef} className={"wheel-visual" + (spinPending ? " spinning" : "") }>
                <svg width="150" height="150" viewBox="0 0 100 100" role="img" aria-label="Prize wheel">
                    <circle cx="50" cy="50" r="45" stroke="#333" strokeWidth="2" fill="#fafafa" />
                    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="10">
                        {spinPending ? "…" : (reward ?? "Spin")}
                    </text>
                </svg>
            </div>

            {reward != null && <div className="reward-display">Reward: {reward}</div>}
        </div>
    );
}