"use client";

import React, { useEffect } from "react";
import { Button } from "antd";
import ProgressBar from "@/components/ProgressBar";
import ScorePanel from "@/components/ScorePanel";
import { useTimer } from "@/hooks/useTimer";
import OpponentProgress from "@/components/OpponentProgress";

const TimerPage = () => {
    const duration = 60;
    const { timeLeft, isRunning, start, reset } = useTimer(duration);

    useEffect(() => {
        if (timeLeft === 0 && isRunning) {
            console.log("⏱ Time's up! Would trigger backend now.");
        }
    }, [timeLeft, isRunning]);

    return (
        <div style={{ maxWidth: 500, margin: "100px auto", textAlign: "center" }}>
            <h2>Testing Timer + ScorePanel</h2>

            <ProgressBar timeLeft={timeLeft} duration={duration} />
            <p>{timeLeft} seconds left</p>

            <Button onClick={start} type="primary" style={{ marginRight: "8px" }}>
                Start Timer
            </Button>
            <Button onClick={reset}>Reset Timer</Button>

            <OpponentProgress name="Opponent A" score={3} total={5} />

            <hr style={{ margin: "24px 0" }} />

            <ScorePanel score={0} total={0} />
        </div>
    );
};

export default TimerPage;

