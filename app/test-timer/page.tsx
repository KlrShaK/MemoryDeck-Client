"use client";

import React, { useEffect } from "react";
import { Button } from "antd";
import { useTimer } from "@/hooks/useTimer";
import ProgressBar from "@/components/ProgressBar";
import { useApi } from "@/hooks/useApi";

const TimerPage = () => {
    const duration = 60;
    const { timeLeft, isRunning, start, reset } = useTimer(duration);
    const api = useApi();

    const quizId = 1; // temporary mock
    const userId = 123; // replace with your logged-in user ID
    const flashcardId = 999; // example flashcard
    const answer = "Skipped";

    useEffect(() => {
        if (timeLeft === 0 && isRunning) {
            console.log("Time’s up! Submitting...");

            api
                .post<boolean>("/quiz/submit-answer", {
                    quizId,
                    userId,
                    flashcardId,
                    answer,
                })
                .then((res) => {
                    console.log("Answer submitted!", res);
                })
                .catch((err) => {
                    console.error("Error submitting answer", err);
                });
        }
    }, [timeLeft, isRunning]);

    return (
        <div style={{ maxWidth: 500, margin: "100px auto", textAlign: "center" }}>
            <h2>Countdown Timer</h2>
            <ProgressBar timeLeft={timeLeft} duration={duration} />
            <p>{timeLeft} seconds left</p>
            <Button onClick={start} type="primary" style={{ marginRight: "8px" }}>
                Start
            </Button>
            <Button onClick={reset}>Reset</Button>
        </div>
    );
};

export default TimerPage;
