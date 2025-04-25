import React from "react";

interface Props {
    timeLeft: number;
    duration: number;
}

const ProgressBar: React.FC<Props> = ({ timeLeft, duration }) => {
    const percentage = ((duration - timeLeft) / duration) * 100;

    return (
        <div style={{ width: "100%", background: "#eee", height: "10px", borderRadius: "8px" }}>
            <div
                style={{
                    width: `${percentage}%`,
                    height: "100%",
                    background: "#1677ff",
                    borderRadius: "8px",
                    transition: "width 0.5s ease",
                }}
            />
        </div>
    );
};

export default ProgressBar;
