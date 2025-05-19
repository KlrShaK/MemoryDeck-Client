"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Card, Typography, Progress, Divider } from "antd";
import { TrophyOutlined, ClockCircleOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";

const { Title, Text } = Typography;

/* ----- Styling constants ----- */
const TOKENS = {
  primary: '#2E8049',
  secondary: '#215F46',
  bgLight: '#c3fad4',
  bgMedium: '#aef5c4',
  bgDark: '#d4ffdd',
  radius: 20,
  shadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
};

/* ----- DTO returned by /statistics/quiz/{id} ----- */
interface StatsDTO {
  userId: number;
  username: string;
  quizId: number;
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
  const maxCorrect = Math.max(...list.map((r) => r.correctQuestions));
  const minAtt = Math.min(...list.map((r) => r.numberOfAttempts));
  const maxAtt = Math.max(...list.map((r) => r.numberOfAttempts));
  const minTime = Math.min(...list.map((r) => r.timeTakenSeconds));
  const maxTime = Math.max(...list.map((r) => r.timeTakenSeconds));

  const norm = (v: number, lo: number, hi: number, lowerBetter = false) =>
    hi === lo ? 1 : lowerBetter ? (hi - v) / (hi - lo) : (v - lo) / (hi - lo);

  return list
    .map((r) => {
      const nCorrect = maxCorrect === 0 ? 0 : r.correctQuestions / maxCorrect;
      const nAtt = norm(r.numberOfAttempts, minAtt, maxAtt, true);
      const nTime = norm(r.timeTakenSeconds, minTime, maxTime, true);

      const composite = Math.round(1000 * (0.5 * nCorrect + 0.3 * nAtt + 0.2 * nTime));
      return { ...r, composite };
    })
    .sort((a, b) => b.composite - a.composite);    // best first
}

/* ---------------- React page ---------------- */
const FinishPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { id } = useParams<{ id: string }>();
  const qid = Number(id);
  const currentUid = Number(localStorage.getItem("userId"));
  const [rows, setRows] = useState<Row[]>([]);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [userQuitted, setUserQuitted] = useState<string | null>(null);

  useEffect(() => {
    const val = localStorage.getItem("user_quitted");
    setUserQuitted(val);
  }, []);

  /* 1️⃣ ─ Fetch raw stats once */
  useEffect(() => {
    if (!qid) return;
    (async () => {
      const raw = await apiService.get<StatsDTO[]>(`/statistics/quiz/${qid}`);
      raw.forEach((r) => {
        if (r.userId === currentUid) r.username = "YOU";
      });
      setRows(computeScores(raw));
    })();
  }, [qid, currentUid, apiService]);

  /* 2️⃣ ─ After rows ready mark winner/draw */
  useEffect(() => {
    if (rows.length === 0 || !qid) return;

    if (userQuitted) {
      const winner = rows.find((r) => r.userId !== Number(userQuitted))?.userId;
      setWinnerId(-1);
      apiService.put(`/statistics/quiz/${qid}`, { winnerUserId: winner }).catch(() => {/* ignore */});
    } else {
      const winner =
        rows.length > 1 && rows[0].composite === rows[1].composite ? null : rows[0].userId;
      setWinnerId(winner);
      apiService.put(`/statistics/quiz/${qid}`, { winnerUserId: winner }).catch(() => {/* ignore */});
    }

    localStorage.removeItem("user_quitted");
  }, [rows, qid, userQuitted, apiService]);

  const currentUser = rows.find((row) => row.userId === currentUid);
  const opponents = rows.filter((row) => row.userId !== currentUid);

  return (
    <div style={{ backgroundColor: TOKENS.bgLight, minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ 
        maxWidth: 900, 
        margin: "0 auto", 
        backgroundColor: TOKENS.bgMedium, 
        padding: 32, 
        borderRadius: TOKENS.radius, 
        boxShadow: TOKENS.shadow 
      }}>
        <Title level={2} style={{ textAlign: "center", color: TOKENS.secondary, marginBottom: 24 }}>
          Memory Challenge - Quiz Results
        </Title>

        {/* Result Banner */}
        <div 
          style={{ 
            textAlign: "center", 
            padding: "20px", 
            backgroundColor: "white",
            borderRadius: 16,
            marginBottom: 32,
            boxShadow: "0 4px 8px rgba(0,0,0,0.08)"
          }}
        >
          {winnerId === -1 || !winnerId ? (
            <>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🤝</div>
              <Title level={3} style={{ color: "black", margin: 0 }}>It&apos;s a tie!</Title>
              <Text style={{ color: "black", fontSize: 16, display: "block" }}>
                Both players performed equally well
              </Text>
            </>
          ) : winnerId === currentUid ? (
            <>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
              <Title level={3} style={{ color: TOKENS.primary, margin: 0 }}>Congratulations, You Won!</Title>
              <Text style={{ color: "black", fontSize: 16, display: "block" }}>
                Great job on your victory
              </Text>
            </>
          ) : (
            <>
              <div style={{ fontSize: 64, marginBottom: 16 }}>👏</div>
              <Title level={3} style={{ color: "black", margin: 0 }}>Good effort!</Title>
              <Text style={{ color: "black", fontSize: 16, display: "block" }}>
                Keep practicing and you&apos;ll improve
              </Text>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {/* Your performance card */}
          <Card 
            title={<span style={{ color: "white" }}>Your Performance</span>}
            headStyle={{ backgroundColor: TOKENS.secondary, color: "white" }}
            bodyStyle={{ backgroundColor: "white", color: "white", padding: "24px" }}
            style={{ 
              flex: 1, 
              minWidth: 300, 
              borderRadius: 16, 
              marginBottom: 24,
              boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
              overflow: "hidden"
            }}
          >
                          {currentUser ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <QuestionCircleOutlined style={{ fontSize: 24, color: "#4caf50", marginRight: 12 }} />
                    <div>
                      <Text style={{ color: "black", display: "block", fontSize: 16 }}>Score</Text>
                      <Text strong style={{ color: "black", fontSize: 24 }}>
                        {currentUser.correctQuestions} / {currentUser.numberOfAttempts}
                      </Text>
                    </div>
                  </div>
                  <div>
                    <Progress
                      type="circle" 
                      percent={Math.round((currentUser.correctQuestions / Math.max(1, currentUser.numberOfAttempts)) * 100)} 
                      width={80}
                      strokeColor={"#4caf50"}
                       format={(percent) => (
    <span style={{ color: 'black' }}>{percent}%</span>
  )}
                    />
                  </div>
                </div>

                <Divider style={{ margin: "12px 0", borderColor: "#333" }} />

                <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                  <ClockCircleOutlined style={{ fontSize: 24, color: "#4caf50", marginRight: 12 }} />
                  <div>
                    <Text style={{ color: "black", display: "block" }}>Time Taken</Text>
                    <Text strong style={{ color: "black" }}>
                      {currentUser.timeTakenSeconds.toFixed(1)} seconds
                    </Text>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                  <TrophyOutlined style={{ fontSize: 24, color: "#4caf50", marginRight: 12 }} />
                  <div>
                    <Text style={{ color: "black", display: "block" }}>Composite Score</Text>
                    <Text strong style={{ color: "black" }}>
                      {currentUser.composite} points
                    </Text>
                  </div>
                </div>
              </>
            ) : (
              <Text style={{ color: "white" }}>No data available</Text>
            )}
          </Card>

          {/* Opponents performance */}
          {opponents.length > 0 && (
            <Card 
              title={<span style={{ color: "white" }}>Opponent Results</span>}
              headStyle={{ backgroundColor: TOKENS.secondary, color: "white" }}
              bodyStyle={{ backgroundColor: "white", color: "white", padding: "24px" }}
              style={{ 
                flex: 1, 
                minWidth: 300, 
                borderRadius: 16, 
                marginBottom: 24,
                boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
                overflow: "hidden",
                backgroundColor: "white"
              }}
            >
              {opponents.map((opponent) => (
                <div key={opponent.userId} style={{ 
                  padding: "16px", 
                  border: "1px solid #333", 
                  borderRadius: "12px", 
                  marginBottom: "16px",
                  backgroundColor: "white"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Text strong style={{ color: "black", fontSize: 16 }}>
                      {opponent.username}
                      {opponent.userId === winnerId && (
                        <TrophyOutlined style={{ color: "#f39c12", marginLeft: 8 }} />
                      )}
                    </Text>
                    <Text style={{ color: opponent.correctQuestions === 0 ? "#e74c3c" : "black" }}>
                      {opponent.correctQuestions === 0 && opponent.numberOfAttempts === 0 
                        ? "NaN%" 
                        : (100 * opponent.correctQuestions / Math.max(1, opponent.numberOfAttempts)).toFixed(0) + "%"}
                    </Text>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={{ color: "black" }}>Score: {opponent.correctQuestions}/{opponent.numberOfAttempts}</Text>
                    <Text style={{ color: "#e67e22" }}>Time: {opponent.timeTakenSeconds.toFixed(1)}s</Text>
                  </div>
                  
                  <div style={{ height: "8px", background: "#f0f0f0", borderRadius: "4px" }}>
                    <div
                      style={{
                        width: `${(opponent.correctQuestions / Math.max(1, opponent.numberOfAttempts)) * 100}%`,
                        height: "100%",
                        background: "#4caf50",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* Ranking section for multiple players */}
        {rows.length > 1 && (
          <Card 
            title={<span style={{ color: "white" }}>Final Ranking</span>}
            headStyle={{ backgroundColor: TOKENS.secondary, color: "white" }}
            bodyStyle={{ backgroundColor: "white", color: "white", padding: "0" }}
            style={{ 
              borderRadius: 16, 
              marginBottom: 24,
              boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
              overflow: "hidden"
            }}
          >
            {rows.map((row, index) => (
              <div key={row.userId} style={{ 
                display: "flex", 
                padding: "12px", 
                borderBottom: index < rows.length - 1 ? "1px solid #333" : "none",
                backgroundColor: row.userId === currentUid ? "#f9f9f9" : "white"
              }}>
                <div style={{ width: 40 }}>
                  <Text strong style={{ color: "black", fontSize: 18 }}>#{index + 1}</Text>
                </div>
                <div style={{ flex: 1 }}>
                  <Text style={{ color: "black", fontWeight: row.userId === currentUid ? "bold" : "normal" }}>
                    {row.username}
                    {row.userId === winnerId && (
                      <TrophyOutlined style={{ color: "#f39c12", marginLeft: 8 }} />
                    )}
                  </Text>
                </div>
                <div style={{ width: 120, textAlign: "center" }}>
                  <Text style={{ color: "black" }}>{row.correctQuestions}/{row.numberOfAttempts}</Text>
                </div>
                <div style={{ width: 120, textAlign: "center" }}>
                  <Text style={{ color: "black" }}>{row.timeTakenSeconds.toFixed(1)}s</Text>
                </div>
                <div style={{ width: 100, textAlign: "right" }}>
                  <Text strong style={{ color: "black" }}>{row.composite}</Text>
                </div>
              </div>
            ))}
          </Card>
        )}

        <div style={{ textAlign: "center" }}>
          <Button 
            type="primary" 
            onClick={() => router.push("/decks")}
            style={{
              backgroundColor: TOKENS.primary,
              borderColor: TOKENS.primary,
              height: 40,
              fontWeight: 500,
              fontSize: 16,
              padding: "0 32px"
            }}
          >
            Back to Decks
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FinishPage;