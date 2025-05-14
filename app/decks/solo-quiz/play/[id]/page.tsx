"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Radio, message as antdMessage } from "antd";
import { useApi } from "@/hooks/useApi";
import { getApiDomain } from "@/utils/domain";
import ProgressBar from "@/components/ProgressBar";
import ScorePanel from "@/components/ScorePanel";
import Image from "next/image";

export const dynamic = "force-dynamic";

/* ────────── DTOs from backend ────────── */
interface FlashcardDTO {
    id: number;
    description: string;
    answer: string;
    wrongAnswers: string[];
    imageUrl: string;
}

interface AnswerResponseDTO {
    wasCorrect: boolean;
    finished: boolean;
    nextQuestion: FlashcardDTO | null;
}

/* score entry returned by GET /quiz/status/{id} */
interface ScoreDTO {
    id: number;   
    userId: number;         
    correctQuestions: number;
    totalQuestions: number;
}

interface QuizStatusDTO {
    quizStatus: "WAITING" | "IN_PROGRESS" | "COMPLETED";
    timeLimit: number;
    scores: ScoreDTO[];
}

/* row we display in the table */
interface ScoreRow {
    userId: number;
    name: string;
    correct: number;
    total: number;
}

/* ────────── Component ────────── */
const QuizSessionPage: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const domain = getApiDomain();
    const { id } = useParams();
    const quizId = id;
    // const [quizId, setQuizId] = useState<number | null>(null);

    /* question state */
    const [currentQuestion, setCurrentQuestion] = useState<FlashcardDTO | null>(null);
    const [options, setOptions] = useState<string[]>([]);
    const [selectedOption, setSelectedOption] = useState<string>("");

    /* flags */
    const [iAmFinished, setIAmFinished] = useState(false);

    /* timer */
    const [elapsedSec, setElapsedSec] = useState(0);
    const totalSecondsRef = useRef<number | null>(null);

    /* scoreboard */
    const [rows, setRows] = useState<ScoreRow[]>([]);

    /* simple username cache */
    const nameCache = useRef<Record<number, string>>({});
    
    const uid = Number(localStorage.getItem("userId"));

    const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5);
    const err     = (e: unknown) => (e instanceof Error ? e : new Error(String(e)));

    /* ───────────────────── fetch first question ───────────────────── */
    async function loadCurrentQuestion() {
        if (!quizId) return;
        try {
            const q = await apiService.get<FlashcardDTO>(`/quiz/${quizId}/currentQuestion?userId=${uid}`);

            setCurrentQuestion(q);
            setOptions(shuffle([q.answer, ...q.wrongAnswers]));
            setSelectedOption("");
            setIAmFinished(false);
        } catch (e) {
            const m = err(e).message;
            if (m.includes("already finished")) setIAmFinished(true);
            else antdMessage.error(m);
        }
    }
    useEffect(() => {
        if (quizId) loadCurrentQuestion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quizId, apiService]);

    /* ───────────────────── poll quiz status every 1 s ───────────────────── */
    useEffect(() => {
        if (!quizId) return;

        async function poll() {
            try {
                const st = await apiService.get<QuizStatusDTO>(`/quiz/status/${quizId}`);

                /* set timer once */
                if (totalSecondsRef.current === null && st.timeLimit > 0)
                    totalSecondsRef.current = st.timeLimit + 1;  // One additional second for safety

                /* transform scores → table rows */
                const r: ScoreRow[] = await Promise.all(
                    st.scores.map(async (sc) => {
                        if (!nameCache.current[sc.userId]) {
                            try {
                                const uRes = await fetch(`${domain}/users/${sc.userId}`);
                                if (uRes.ok) {
                                    const u = await uRes.json();
                                    nameCache.current[sc.userId] = u.username;
                                }
                            } catch {/* ignore */}
                        }
                        return {
                            userId:  sc.userId,
                            name:    sc.userId === uid ? "YOU" : nameCache.current[sc.userId] ?? sc.userId.toString(),
                            correct: sc.correctQuestions,
                            total:   sc.totalQuestions
                        };
                    })
                );
                setRows(r);

                if (st.quizStatus === "COMPLETED") setIAmFinished(true);
            } catch { /* ignore */ }
        }

        poll();
        const id = setInterval(poll, 1000);
        return () => clearInterval(id);
    }, [quizId, uid, apiService, domain]);

    /* timer tick */
    useEffect(() => {
        const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
        return () => clearInterval(id);
    }, []);

    /* redirect when done or time expired */
    useEffect(() => {
        const timeUp =
            totalSecondsRef.current !== null &&
            elapsedSec >= totalSecondsRef.current;

        if (timeUp && !iAmFinished) {
            // tell backend we’re done because of time-out
            sendTimeoutAnswer().then(() => setIAmFinished(true));
        }
        if ((iAmFinished || timeUp) && quizId) {
            router.push(`/decks/solo-quiz/finish/${quizId}`);
        }
    }, [iAmFinished, elapsedSec, quizId, router]);

    /* ───────────────────── submit answer ───────────────────── */
    async function handleSubmitAnswer() { 
        if (!currentQuestion) return antdMessage.error("No question.");
        if (!selectedOption)  return antdMessage.error("Pick an option.");

        try {
            const payload = {
                quizId:quizId,
                flashcardId: currentQuestion.id,
                selectedAnswer: selectedOption,
                userId: uid
            };

            const dto = await apiService.post<AnswerResponseDTO>(`/quiz/answer`,payload);
            if (!dto) throw err("");

            if (dto.wasCorrect){
                antdMessage.success("Correct!");
            } else{
                antdMessage.error("Wrong!");
            }
            
            if (dto.finished) {
                setIAmFinished(true);
                antdMessage.info("You finished! Waiting for opponent…");
            }
            if (dto.nextQuestion) {
                setCurrentQuestion(dto.nextQuestion);
                setOptions(shuffle([
                    dto.nextQuestion.answer,
                    ...dto.nextQuestion.wrongAnswers
                ]));
                setSelectedOption("");
            }
        } catch (e) {
            antdMessage.error(err(e).message);
        }
    }

    /* ───────────────────── UI ───────────────────── */
    // const timerPercent =
    //     totalSecondsRef.current != null
    //         ? (elapsedSec / totalSecondsRef.current) * 100
    //         : 0;

    async function sendTimeoutAnswer() {
        if (!quizId || !currentQuestion) return;
        const payload = {
            quizId: quizId,
            flashcardId: currentQuestion.id, // still tell the server which Q we were on
            selectedAnswer: null,            // <-- timeout flag
            userId: uid
        };

        await apiService.post<AnswerResponseDTO>(`/quiz/answer`,payload).catch(() => {});

    }

    const handleCancelQuiz = async () => {
        if (!quizId || !currentQuestion) return;
        
        await apiService.delete(`/quiz/quit/${quizId}`).catch(() => {});
        
    }

    const player = rows.find((row) => row.userId === uid);

    return (
        <div style={{ maxWidth: 600, margin: "100px auto", padding: 20, textAlign: "center" }}>
            <h1>Single-Player Quiz</h1>

            {totalSecondsRef.current !== null && (
                <ProgressBar timeLeft={totalSecondsRef.current-elapsedSec} duration={totalSecondsRef.current} />
            )}

            {currentQuestion ? (
                <>
                    <p style={{ marginTop: 16, fontSize: "1.2rem" }}>

                        {currentQuestion.imageUrl && (
                        <div style={{ marginTop: "20px",marginBottom: "20px", maxWidth: "100%", textAlign: "center" }}>
                        <Image
                        src = {`${domain}/flashcards/image?imageUrl=${encodeURIComponent(currentQuestion.imageUrl)}`}
                        alt="Flashcard image"
                        width={250}
                        height={170}
                        style={{ objectFit: "contain", maxHeight: "200px", borderRadius: "8px" }}
                        unoptimized
                        />
                        </div>
                        )}

                        {currentQuestion.description}

                    </p>
                    <Radio.Group
                        onChange={(e) => setSelectedOption(e.target.value)}
                        value={selectedOption}
                    >
                        {options.map((o, i) => (
                            <Radio key={i} value={o} style={{ display: "block" }}>
                                {o}
                            </Radio>
                        ))}
                    </Radio.Group>
                </>
            ) : (
                <p>Loading question…</p>
            )}

            <div style={{ marginTop: 24 }}>
            <Button type="primary" onClick={handleSubmitAnswer} style={{ marginTop: 16 }}>
                        Submit
            </Button>
            </div>
            
            <div style={{ marginTop: 24 }}>
                {/* Score panel for the current user */}
                {player && (
                <ScorePanel score={player.correct} total={player.total} />
                )}
            </div>
            <Button onClick={handleCancelQuiz} style={{ marginTop: 20 }}>
                Finish Quiz Early
            </Button>
        </div>
    );
};

export default QuizSessionPage;