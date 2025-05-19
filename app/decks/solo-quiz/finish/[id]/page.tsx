"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Card, Typography, Progress, Spin } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";

const { Title, Text } = Typography;

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

// Styling constants
const TOKENS = {
  primary: '#2E8049',
  secondary: '#215F46', 
  bgLight: '#c3fad4',
  bgMedium: '#aef5c4',
  bgDark: '#d4ffdd',
  radius: 20,
  shadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
};

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
    const router = useRouter();
    const apiService = useApi();
    const { id } = useParams<{ id: string }>();
    const qid = Number(id);
    const currentUid = Number(localStorage.getItem("userId"));
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);

    /* 1️⃣ ─ Fetch raw stats once */
    useEffect(() => {
        if (!qid) return;
        (async () => {
            try {
                setLoading(true);
                const raw = await apiService.get<StatsDTO[]>(`/statistics/quiz/${qid}`);

                raw.forEach(r => {
                    if (r.userId === currentUid) r.username = "YOU";
                });
                setRows(computeScores(raw));
            } catch (error) {
                console.error("Failed to fetch quiz statistics:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, [qid, currentUid, apiService]);

    const currentUser = rows.find((row) => row.userId === currentUid);
    
    // Calculate percentage
    const percentage = currentUser && currentUser.numberOfAttempts > 0 
        ? Math.round((currentUser.correctQuestions / currentUser.numberOfAttempts) * 100) 
        : 0;
    
    // Determine status color based on score percentage
    const getStatusColor = (percent: number) => {
        if (percent >= 80) return "#52c41a"; // Green for great
        if (percent >= 60) return "#faad14"; // Yellow for good
        return "#ff4d4f"; // Red for needs improvement
    };
    
    return (
        <div style={{ 
            backgroundColor: TOKENS.bgLight, 
            minHeight: "100vh", 
            padding: "40px 20px" 
        }}>
            <div style={{ 
                maxWidth: 800, 
                margin: "0 auto", 
                backgroundColor: TOKENS.bgMedium, 
                padding: 32, 
                borderRadius: TOKENS.radius, 
                boxShadow: TOKENS.shadow 
            }}>
                <Title level={2} style={{ textAlign: "center", color: TOKENS.secondary, marginBottom: 24 }}>
                    Quiz Complete!
                </Title>
                
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <>
                        <Card
                            style={{
                                textAlign: "center",
                                marginBottom: 24,
                                borderRadius: 16,
                                boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
                                backgroundColor: "white"
                            }}
                        >
                            <TrophyOutlined style={{ fontSize: 48, color: "#faad14", marginBottom: 16 }} />
                            
                            {currentUser ? (
                                <>
                                    <Title level={3} style={{ color: TOKENS.secondary, margin: "16px 0" }}>
                                        Congratulations!
                                    </Title>
                                    
                                    <Text style={{ fontSize: "18px", display: "block", marginBottom: 8, color: "black" }}>
                                        Your Score
                                    </Text>
                                    
                                    <Title level={2} style={{ margin: "0 0 24px", color: "black" }}>
                                        {currentUser.correctQuestions} / {currentUser.numberOfAttempts}
                                    </Title>
                                    
                                    <div style={{ width: "80%", margin: "0 auto 24px" }}>
                                        <Progress 
                                            type="circle" 
                                            percent={percentage} 
                                            strokeColor={getStatusColor(percentage)}
                                            width={120}
                                             format={(percent) => (
    <span style={{ color: 'black' }}>{percent}%</span>
  )}
                                        />
                                    </div>
                                    
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong style={{ fontSize: 16, display: "block", marginBottom: 8, color: "black" }}>
                                            Performance Details
                                        </Text>
                                        <ul style={{ 
                                            listStyle: "none", 
                                            padding: 0, 
                                            margin: 0,
                                            textAlign: "left",
                                            display: "inline-block"
                                        }}>
                                            <li style={{ marginBottom: 8, color: "black" }}>
                                                <Text style={{ color: "black" }}>
                                                    <span style={{ fontWeight: "bold", marginRight: 8 }}>Correct Answers:</span> 
                                                    {currentUser.correctQuestions}
                                                </Text>
                                            </li>
                                            <li style={{ marginBottom: 8 }}>
                                                <Text style={{ color: "black" }}>
                                                    <span style={{ fontWeight: "bold", marginRight: 8 }}>Total Attempts:</span> 
                                                    {currentUser.numberOfAttempts}
                                                </Text>
                                            </li>
                                            <li style={{ marginBottom: 8 }}>
                                                <Text style={{ color: "black" }}>
                                                    <span style={{ fontWeight: "bold", marginRight: 8 }}>Time Taken:</span> 
                                                    {Math.floor(currentUser.timeTakenSeconds / 60)} min {currentUser.timeTakenSeconds % 60} sec
                                                </Text>
                                            </li>
                                            <li>
                                                <Text style={{ color: "black" }}>
                                                    <span style={{ fontWeight: "bold", marginRight: 8 }}>Accuracy:</span> 
                                                    {percentage}%
                                                </Text>
                                            </li>
                                        </ul>
                                    </div>
                                </>
                            ) : (
                                <Text style={{ color: "black", fontSize: 18 }}>
                                    Quiz results unavailable
                                </Text>
                            )}
                        </Card>
                        
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <Button 
                                type="primary" 
                                size="large"
                                onClick={() => router.push("/decks")}
                                style={{
                                    backgroundColor: TOKENS.primary,
                                    borderColor: TOKENS.primary,
                                    height: 48,
                                    padding: "0 32px",
                                    fontSize: 16
                                }}
                            >
                                Back to Decks
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FinishPage;