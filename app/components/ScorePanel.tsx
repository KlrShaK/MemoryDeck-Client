import React, { useState } from "react";
import { Button } from "antd";

const ScorePanel = () => {
    const [correct, setCorrect] = useState(0);
    const [total, setTotal] = useState(0);

    const handleAnswer = (isCorrect: boolean) => {
        setTotal((t) => t + 1);
        if (isCorrect) setCorrect((c) => c + 1);
    };

    return (
        <div style={{ textAlign: "center", marginTop: "32px" }}>
            <p>Score: {correct}/{total}</p>
            <Button onClick={() => handleAnswer(true)} type="primary" style={{ marginRight: "8px" }}>
                Correct
            </Button>
            <Button onClick={() => handleAnswer(false)} danger>
                Incorrect
            </Button>
        </div>
    );
};

export default ScorePanel;
