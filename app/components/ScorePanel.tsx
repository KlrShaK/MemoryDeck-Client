import React from "react";

interface ScorePanelProps {
    score: number;
    total: number;
}

const ScorePanel: React.FC<ScorePanelProps> = ({ score, total }) => {
    return (
        <div style={{ textAlign: "center", marginTop: 24 }}>
            <p><strong>Score:</strong> {score} / {total}</p>
        </div>
    );
};

export default ScorePanel;
