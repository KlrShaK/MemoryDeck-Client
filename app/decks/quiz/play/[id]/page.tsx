"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Radio, message, Card, Typography, Progress, Spin } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import Image from "next/image";
import { useApi } from "@/hooks/useApi";
import { getApiDomain } from "@/utils/domain";
import ProgressBar from "@/components/ProgressBar";

export const dynamic = "force-dynamic";

const { Title, Text } = Typography;

// Define interfaces
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

interface ScoreRow {
  userId: number;
  name: string;
  correct: number;
  total: number;
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

const QuizSessionPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const domain = getApiDomain();
  const { id } = useParams();
  const quizId = id as string;

  // State
  const [currentQuestion, setCurrentQuestion] = useState<FlashcardDTO | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [iAmFinished, setIAmFinished] = useState(false);
  const [quizFinishedForAll, setQuizFinishedForAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [rows, setRows] = useState<ScoreRow[]>([]);
  
  const totalSecondsRef = useRef<number | null>(null);
  const nameCache = useRef<Record<number, string>>({});

  const uid = Number(localStorage.getItem("userId"));
  
  // Helper functions
  const shuffle = (arr: string[]): string[] => [...arr].sort(() => Math.random() - 0.5);
  const err = (e: unknown): Error => (e instanceof Error ? e : new Error(String(e)));

  // Load question
  async function loadCurrentQuestion() {
    if (!quizId) return;
    setLoading(true);
    try {
      const q = await apiService.get<FlashcardDTO>(`/quiz/${quizId}/currentQuestion?userId=${uid}`);
      setCurrentQuestion(q);
      setOptions(shuffle([q.answer, ...q.wrongAnswers]));
      setSelectedOption("");
      setAnswerSubmitted(false);
      setLastAnswerCorrect(null);
      setIAmFinished(false);
    } catch (e) {
      const m = err(e).message;
      if (m.includes("already finished")) {
        setIAmFinished(true);
      } else {
        message.error(m);
      }
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    if (quizId) loadCurrentQuestion();
  }, [quizId]);

  // Poll for updates
  useEffect(() => {
    if (!quizId) return;

    async function poll() {
      try {
        const st = await apiService.get<QuizStatusDTO>(`/quiz/status/${quizId}`);

        // Set timer once
        if (totalSecondsRef.current === null && st.timeLimit > 0) {
          totalSecondsRef.current = st.timeLimit + 1;
        }

        // Transform scores to rows
        const scoreRows: ScoreRow[] = [];
        
        for (const sc of st.scores) {
          let name = sc.userId === uid ? "YOU" : String(sc.userId);
          
          if (!nameCache.current[sc.userId]) {
            try {
              const uRes = await fetch(`${domain}/users/${sc.userId}`);
              if (uRes.ok) {
                const u = await uRes.json();
                nameCache.current[sc.userId] = u.username;
              }
            } catch {/* ignore */}
          }
          
          if (nameCache.current[sc.userId]) {
            name = sc.userId === uid ? "YOU" : nameCache.current[sc.userId];
          }
          
          scoreRows.push({
            userId: sc.userId,
            name,
            correct: sc.correctQuestions,
            total: sc.totalQuestions
          });
        }
        
        setRows(scoreRows);

        if (st.quizStatus === "COMPLETED") {
          setQuizFinishedForAll(true);
        }
      } catch {
        // Ignore polling errors
      }
    }

    poll();
    const id = setInterval(poll, 1000);
    return () => clearInterval(id);
  }, [quizId, uid, apiService, domain]);

  // Timer tick
  useEffect(() => {
    const id = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Handle timeout and quiz completion
  useEffect(() => {
    const timeUp = totalSecondsRef.current !== null &&
      elapsedSec >= totalSecondsRef.current;

    if (timeUp && !iAmFinished) {
      sendTimeoutAnswer().then(() => setIAmFinished(true));
    }
    
    if ((quizFinishedForAll || timeUp) && quizId) {
      router.push(`/decks/quiz/finish/${quizId}`);
    }
  }, [quizFinishedForAll, elapsedSec, quizId, router, iAmFinished]);

  // Submit answer
  async function handleSubmitAnswer() {
    if (!currentQuestion) {
      return message.error("No question available.");
    }
    
    if (!selectedOption) {
      return message.error("Please select an answer.");
    }

    setAnswerSubmitted(true);

    try {
      const payload = {
        quizId,
        flashcardId: currentQuestion.id,
        selectedAnswer: selectedOption,
        userId: uid
      };

      const dto = await apiService.post<AnswerResponseDTO>(`/quiz/answer`, payload);
      
      if (!dto) throw err("");

      setLastAnswerCorrect(dto.wasCorrect);

      if (dto.finished) {
        setIAmFinished(true);
        message.info("You finished! Waiting for opponent…");
      } else {
        // Wait before moving to next question
        setTimeout(() => {
          if (dto.nextQuestion) {
            setCurrentQuestion(dto.nextQuestion);
            setOptions(shuffle([
              dto.nextQuestion.answer,
              ...dto.nextQuestion.wrongAnswers
            ]));
            setSelectedOption("");
            setAnswerSubmitted(false);
            setLastAnswerCorrect(null);
          }
        }, 1500);
      }
    } catch (e) {
      message.error(err(e).message);
      setAnswerSubmitted(false);
    }
  }

  // Send timeout
  async function sendTimeoutAnswer() {
    if (!quizId || !currentQuestion) return;
    
    const payload = {
      quizId,
      flashcardId: currentQuestion.id,
      selectedAnswer: null,
      userId: uid
    };

    await apiService.post<AnswerResponseDTO>(`/quiz/answer`, payload).catch(() => {});
  }

  // Cancel quiz
  const handleCancelQuiz = async () => {
    if (!quizId) return;
    
    message.info("Finishing quiz early...");
    
    if (!localStorage.getItem("user_quitted")) {
      localStorage.setItem("user_quitted", String(uid));
    }

    try {
      await apiService.delete(`/quiz/quit/${quizId}`);
      router.push("/decks");
    } catch {
      message.error("Failed to cancel quiz. Redirecting to decks.");
      router.push("/decks");
    }
  };

  const currentUser = rows.find(row => row.userId === uid);
  const opponents = rows.filter(row => row.userId !== uid);

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
          Memory Challenge - Multiplayer Quiz
        </Title>

        {totalSecondsRef.current !== null && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Text strong style={{ color: "black" }}>Time Remaining:</Text>
              <Text strong style={{ color: totalSecondsRef.current - elapsedSec < 10 ? "#ff4d4f" : "black" }}>
                {Math.max(0, totalSecondsRef.current - elapsedSec)} seconds
              </Text>
            </div>
            <ProgressBar 
              timeLeft={Math.max(0, totalSecondsRef.current - elapsedSec)} 
              duration={totalSecondsRef.current} 
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {/* Scoreboard column */}
          <div style={{ width: 250 }}>
            <Card 
              title={<span style={{ color: "black" }}>Scores</span>}
              style={{ 
                marginBottom: 24, 
                borderRadius: 16, 
                backgroundColor: "white",
                boxShadow: "0 4px 8px rgba(0,0,0,0.08)" 
              }}
            >
              {/* Current user score */}
              {currentUser && (
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ color: "black" }}>Your score: </Text>
                  <Text style={{ color: "black" }}>{currentUser.correct} / {currentUser.total}</Text>
                  <Progress 
                    percent={Math.round((currentUser.correct / Math.max(1, currentUser.total)) * 100)} 
                    status="active"
                    strokeColor={TOKENS.primary}
                  />
                </div>
              )}
              
              {/* Opponent progress */}
              {opponents.length > 0 && (
                <>
                  <Text strong style={{ color: "black", display: "block", marginBottom: 8 }}>
                    Opponent Progress:
                  </Text>
                  {opponents.map((opponent) => (
                    <div key={opponent.userId} style={{ 
                      padding: "10px", 
                      border: "1px solid #ccc", 
                      borderRadius: "8px", 
                      marginBottom: "8px" 
                    }}>
                      <Text strong style={{ color: "black", display: "block" }}>
                        {opponent.name}
                      </Text>
                      <Text style={{ color: "black" }}>
                        Answered: {opponent.correct}/{opponent.total}
                      </Text>
                      <div style={{ 
                        height: "6px", 
                        background: "#ddd", 
                        borderRadius: "4px", 
                        marginTop: "4px" 
                      }}>
                        <div style={{
                          width: `${(opponent.correct / Math.max(1, opponent.total)) * 100}%`,
                          height: "100%",
                          background: "#3d801e",
                          borderRadius: "4px",
                        }} />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </Card>
            
            <Button 
              danger 
              onClick={handleCancelQuiz} 
              style={{ width: "100%", marginTop: 16 }}
            >
              Finish Quiz Early
            </Button>
          </div>

          {/* Main quiz area */}
          <div style={{ flex: 1, minWidth: 300 }}>
            <Card style={{ 
              marginBottom: 24, 
              borderRadius: 16, 
              backgroundColor: "white",
              boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
              minHeight: 400
            }}>
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
                  <Spin size="large" />
                </div>
              ) : iAmFinished ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <Title level={3} style={{ color: "black" }}>Well Done!</Title>
                  <Text style={{ fontSize: 16, display: "block", marginBottom: 24, color: "black" }}>
                    You have completed all questions!
                  </Text>
                  <Text style={{ color: "black" }}>Waiting for your opponent to finish...</Text>
                </div>
              ) : currentQuestion ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    <Title level={4} style={{ color: "black", margin: 0 }}>Question</Title>
                    {currentUser && (
                      <Text style={{ color: "black" }}>
                        Question {currentUser.total} of {rows[0]?.total || "?"}
                      </Text>
                    )}
                  </div>

                  {currentQuestion.imageUrl && (
                    <div style={{ marginBottom: 20, textAlign: "center" }}>
                      <Image
                        src={`${domain}/flashcards/image?imageUrl=${encodeURIComponent(currentQuestion.imageUrl)}`}
                        alt="Flashcard image"
                        width={300}
                        height={200}
                        style={{ objectFit: "contain", maxHeight: 240, borderRadius: 8 }}
                        unoptimized
                      />
                    </div>
                  )}

                  <div style={{ 
                    fontSize: "18px", 
                    fontWeight: 500, 
                    marginBottom: 24,
                    backgroundColor: TOKENS.bgDark,
                    padding: 16,
                    borderRadius: 12,
                    color: "black"
                  }}>
                    {currentQuestion.description}
                  </div>

                  <Radio.Group
                    onChange={(e) => !answerSubmitted && setSelectedOption(e.target.value)}
                    value={selectedOption}
                    style={{ width: "100%" }}
                    disabled={answerSubmitted}
                  >
                    {options.map((option, index) => (
                      <Radio 
                        key={index} 
                        value={option}
                        style={{
                          width: "100%",
                          display: "block",
                          padding: "12px",
                          border: "1px solid #d9d9d9",
                          borderRadius: "8px",
                          marginBottom: "8px",
                          backgroundColor: answerSubmitted && option === currentQuestion.answer && lastAnswerCorrect
                            ? "#f6ffed" // Only show correct answer background when correctly answered
                            : "white",
                          color: "black"
                        }}
                      >
                        <div style={{ display: "flex" }}>
                          <span style={{ color: "black" }}>{option}</span>
                          {answerSubmitted && option === currentQuestion.answer && lastAnswerCorrect && (
                            <CheckCircleOutlined style={{ color: "#52c41a", marginLeft: 8 }} />
                          )}
                        </div>
                      </Radio>
                    ))}
                  </Radio.Group>

                  {/* Error message for wrong answers */}
                  {answerSubmitted && !lastAnswerCorrect && (
                    <div style={{
                      marginTop: "16px",
                      padding: "12px",
                      backgroundColor: "#fff2f0",
                      border: "1px solid #ffccc7",
                      borderRadius: "8px"
                    }}>
                      <Text strong style={{ color: "#ff4d4f" }}>
                        Wrong answer, try again
                      </Text>
                    </div>
                  )}

                  <Button
                    type="primary"
                    onClick={handleSubmitAnswer}
                    disabled={!selectedOption || answerSubmitted}
                    style={{
                      marginTop: 24,
                      backgroundColor: TOKENS.primary,
                      borderColor: TOKENS.primary,
                      width: "100%",
                      height: 40
                    }}
                  >
                    {answerSubmitted ? "Next question loading..." : "Submit Answer"}
                  </Button>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <Text style={{ color: "black" }}>No questions available for this quiz.</Text>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSessionPage;