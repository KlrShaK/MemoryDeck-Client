//actual quiz play page with questions

"use client";

import React, { useEffect, useState } from "react";
import { Button, Space } from "antd";
import { useTimer } from "@/hooks/useTimer";
import ProgressBar from "@/components/ProgressBar";
import ScorePanel from "@/components/ScorePanel";
import OpponentProgress from "@/components/OpponentProgress";
import { useRouter } from "next/navigation";


const mockQuiz = {
    quizId: 999,
    userId: 123,
    flashcards: [
        {
            id: 1,
            question: "What is the capital of Italy?",
            correctAnswer: "Rome",
            options: ["Milan", "Florence", "Rome", "Venice"],
        },
        {
            id: 2,
            question: "What is 5 * 6?",
            correctAnswer: "30",
            options: ["11", "25", "30", "45"],
        },
        {
            id: 3,
            question: "What is the shape of the Earth",
            correctAnswer: "Round",
            options: ["Flat", "Round", "Heart-Shaped", "Wavy"],
        },
    ],
    opponent: {
        name: "QuizBuddy",
        score: 2,
        totalAnswered: 3,
    },
};

const QuizPlayPage: React.FC = () => {
    const duration = 0.25 * 60;
    const { timeLeft, start, isRunning } = useTimer(duration);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userScore, setUserScore] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    const router = useRouter();
    const currentFlashcard = mockQuiz.flashcards[currentIndex];

    const handleAnswer = (answer: string) => {
        if (isFinished) return; // prevent scoring after finish

        const correct = currentFlashcard.correctAnswer === answer;
        setAnswers([...answers, answer]);
        if (correct) setUserScore((prev) => prev + 1);

        if (currentIndex < mockQuiz.flashcards.length - 1) {
            setCurrentIndex((i) => i + 1);
        } else {
            setIsFinished(true);
            console.log("Quiz finished!");
        }
    };

    useEffect(() => {
        if (timeLeft === 0 && isRunning) {
            console.log("Time’s up! Ending quiz...");
            setIsFinished(true);
        }
    }, [timeLeft, isRunning]);

    useEffect(() => {
        start();
    }, []);

    return (
        <div style={{ maxWidth: 600, margin: "60px auto", padding: 20, textAlign: "center" }}>
            <h2>Quiz Play</h2>

            {!isFinished && currentFlashcard ? (
                <>
                    <ProgressBar timeLeft={timeLeft} duration={duration} />
                    <p style={{ marginTop: 16, fontSize: "1.2rem" }}>{currentFlashcard.question}</p>

                    <Space style={{ marginTop: 16 }} direction="vertical">
                        {currentFlashcard.options.map((option) => (
                            <Button
                                key={option}
                                onClick={() => handleAnswer(option)}
                                disabled={isFinished}
                            >
                                {option}
                            </Button>
                        ))}
                    </Space>

                    <ScorePanel score={userScore} total={answers.length} />

                    <div style={{ marginTop: 32 }}>
                        <OpponentProgress
                            name={mockQuiz.opponent.name}
                            score={mockQuiz.opponent.score}
                            total={mockQuiz.opponent.totalAnswered}
                        />
                    </div>

                    <Button
                        type="primary"
                        onClick={() => setIsFinished(true)}
                        style={{ marginTop: 24 }}
                    >
                        Finish Quiz Early
                    </Button>
                </>
            ) : (
                <div>
                <h3>You’ve completed the quiz!</h3>
                <p>Your score: {userScore} / {mockQuiz.flashcards.length}</p>
                <Space style={{ marginTop: 20 }}>
                    <Button type="primary" onClick={() => window.location.reload()}>
                        Rematch
                    </Button>
                    <Button onClick={() => router.push("/decks")}>
                        Return Home
                    </Button>
                </Space>
                </div>

            )}
        </div>
    );
};

export default QuizPlayPage;
