"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "antd";
import { useApi } from "@/hooks/useApi";

/* ----- DTO returned by /statistics/quiz/{id} ----- */
interface StatsDTO {
    userId:           number;
    username:         string;
    quizId:           number;
    correctQuestions: number;
    numberOfAttempts: number;
    timeTakenSeconds: number;   // seconds, already final
    isWinner: boolean;
}

/* row with composite score */
interface Row extends StatsDTO {
    composite: number;
}

/* ---------- composite scoring 0-1000 ---------- */
function computeScores(list: StatsDTO[]): Row[] {
    const maxCorrect = Math.max(...list.map(r => r.correctQuestions));
    const minAtt     = Math.min(...list.map(r => r.numberOfAttempts));
    const maxAtt     = Math.max(...list.map(r => r.numberOfAttempts));
    const minTime    = Math.min(...list.map(r => r.timeTakenSeconds));
    const maxTime    = Math.max(...list.map(r => r.timeTakenSeconds));

    const norm = (v: number, lo: number, hi: number, lowerBetter = false) =>
        hi === lo ? 1 : lowerBetter ? (hi - v) / (hi - lo) : (v - lo) / (hi - lo);

    return list
        .map(r => {
            const nCorrect = maxCorrect === 0 ? 0 : r.correctQuestions / maxCorrect;
            const nAtt     = norm(r.numberOfAttempts, minAtt, maxAtt, true);
            const nTime    = norm(r.timeTakenSeconds,  minTime, maxTime, true);

            const composite = Math.round(
                1000 * (0.5 * nCorrect + 0.3 * nAtt + 0.2 * nTime)
            );
            return { ...r, composite };
        })
        .sort((a, b) => b.composite - a.composite);      // best first
}

/* ---------------- React page ---------------- */
const FinishPage: React.FC = () => {
    const router              = useRouter();
    const apiService          = useApi();
    const { id }          = useParams<{ id: string }>();
    const qid                 = Number(id);
    const currentUid          = Number(localStorage.getItem("userId"));
    const [rows, setRows]     = useState<Row[]>([]);
    // const [winnerId, setWinnerId]     = useState<Number | null>(null);
    // const [userQuitted, setUserQuitted] = useState<string | null>(null);

    // useEffect(() => {
    //     const val = localStorage.getItem("user_quitted");
    //     setUserQuitted(val);
    // }, []);

    /* 1️⃣ ─ Fetch raw stats once */
    useEffect(() => {
        if (!qid) return;
        (async () => {
            const raw = await apiService.get<StatsDTO[]>(`/statistics/quiz/${qid}`);

            raw.forEach(r => {
                if (r.userId === currentUid) r.username = "YOU";
            });
            setRows(computeScores(raw));
        })();
    }, [qid, currentUid, apiService]);

    // /* 2️⃣ ─ After rows ready mark winner/draw */
    // useEffect(() => {
    //     if (rows.length === 0 || !qid) return;

    //     if (userQuitted){
    //         const winner = rows.find((r) => r.userId !== Number(userQuitted))?.userId;
    //         setWinnerId(-1);
    //         apiService.put(`/statistics/quiz/${qid}`,{ winnerUserId: winner }).catch(() => {/* ignore */});
    //     } else{
    //         const winner = rows.length > 1 && rows[0].composite === rows[1].composite
    //                         ? null
    //                         : rows[0].userId;
    //         setWinnerId(winner);
            
    //         apiService.put(`/statistics/quiz/${qid}`,{ winnerUserId: winner }).catch(() => {/* ignore */});
    //     }

    //     localStorage.removeItem("user_quitted"); 
    // }, [rows, qid, userQuitted]);

    const currentUser = rows.find((row) => row.userId === currentUid);
    return (
        // <div style={{ padding: 24, maxWidth: 720 }}>
        //     <h1>Final results for quiz #{qid}</h1>
        <div style={{ maxWidth: 600, margin: "100px auto", padding: 20, textAlign: "center" }}>
            <h3 >You have completed the quiz!</h3>
            { currentUser &&
            <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                Your score: {currentUser.correctQuestions} / {currentUser.numberOfAttempts}
            </p>}
            { currentUser &&
            <p style={{ fontSize: "1.3rem", color: "#555" }}>
                Performance Summary: {(100*currentUser?.correctQuestions/currentUser?.numberOfAttempts).toFixed(2)}%
            </p>}

            <Button style={{ marginTop: 24 }} onClick={() => router.push("/decks")}>
                Back to Decks
            </Button>
        </div>
    );
};

export default FinishPage;
