import { useEffect, useState } from "react";

export const useTimer = (durationInSec: number) => {
    const [timeLeft, setTimeLeft] = useState(durationInSec);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        if (!isRunning || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const start = () => setIsRunning(true);
    const reset = () => {
        setIsRunning(false);
        setTimeLeft(durationInSec);
    };

    return { timeLeft, isRunning, start, reset };
};