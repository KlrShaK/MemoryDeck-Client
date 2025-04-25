import React from "react";

interface Props {
    name: string;
    score: number;
    total: number;
}

const OpponentProgress: React.FC<Props> = ({ name, score, total }) => {
    return (
        <div style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "10px", width: "200px" }}>
            <h4>{name}</h4>
            <p>Answered: {score}/{total}</p>
            <div style={{ height: "6px", background: "#ddd", borderRadius: "4px" }}>
                <div
                    style={{
                        width: `${(score / total) * 100}%`,
                        height: "100%",
                        background: "#52c41a",
                        borderRadius: "4px",
                    }}
                />
            </div>
        </div>
    );
};

export default OpponentProgress;
