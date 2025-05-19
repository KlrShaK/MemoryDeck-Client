// "use client";

// import React, { useEffect, useState, useRef } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { Button, Radio, message as antdMessage } from "antd";
// import { useApi } from "@/hooks/useApi";
// import { getApiDomain } from "@/utils/domain";
// import ProgressBar from "@/components/ProgressBar";
// import ScorePanel from "@/components/ScorePanel";
// import Image from "next/image";

// export const dynamic = "force-dynamic";

// /* ────────── DTOs from backend ────────── */
// interface FlashcardDTO {
//     id: number;
//     description: string;
//     answer: string;
//     wrongAnswers: string[];
//     imageUrl: string;
// }

// interface AnswerResponseDTO {
//     wasCorrect: boolean;
//     finished: boolean;
//     nextQuestion: FlashcardDTO | null;
// }

// /* score entry returned by GET /quiz/status/{id} */
// interface ScoreDTO {
//     id: number;   
//     userId: number;         
//     correctQuestions: number;
//     totalQuestions: number;
// }

// interface QuizStatusDTO {
//     quizStatus: "WAITING" | "IN_PROGRESS" | "COMPLETED";
//     timeLimit: number;
//     scores: ScoreDTO[];
// }

// /* row we display in the table */
// interface ScoreRow {
//     userId: number;
//     name: string;
//     correct: number;
//     total: number;
// }

// /* ────────── Component ────────── */
// const QuizSessionPage: React.FC = () => {
//     const router = useRouter();
//     const apiService = useApi();
//     const domain = getApiDomain();
//     const { id } = useParams();
//     const quizId = id;
//     // const [quizId, setQuizId] = useState<number | null>(null);

//     /* question state */
//     const [currentQuestion, setCurrentQuestion] = useState<FlashcardDTO | null>(null);
//     const [options, setOptions] = useState<string[]>([]);
//     const [selectedOption, setSelectedOption] = useState<string>("");

//     /* flags */
//     const [iAmFinished, setIAmFinished] = useState(false);

//     /* timer */
//     const [elapsedSec, setElapsedSec] = useState(0);
//     const totalSecondsRef = useRef<number | null>(null);

//     /* scoreboard */
//     const [rows, setRows] = useState<ScoreRow[]>([]);

//     /* simple username cache */
//     const nameCache = useRef<Record<number, string>>({});
    
//     const uid = Number(localStorage.getItem("userId"));

//     const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5);
//     const err     = (e: unknown) => (e instanceof Error ? e : new Error(String(e)));

//     /* ───────────────────── fetch first question ───────────────────── */
//     async function loadCurrentQuestion() {
//         if (!quizId) return;
//         try {
//             const q = await apiService.get<FlashcardDTO>(`/quiz/${quizId}/currentQuestion?userId=${uid}`);

//             setCurrentQuestion(q);
//             setOptions(shuffle([q.answer, ...q.wrongAnswers]));
//             setSelectedOption("");
//             setIAmFinished(false);
//         } catch (e) {
//             const m = err(e).message;
//             if (m.includes("already finished")) setIAmFinished(true);
//             else antdMessage.error(m);
//         }
//     }
//     useEffect(() => {
//         if (quizId) loadCurrentQuestion();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [quizId, apiService]);

//     /* ───────────────────── poll quiz status every 1 s ───────────────────── */
//     useEffect(() => {
//         if (!quizId) return;

//         async function poll() {
//             try {
//                 const st = await apiService.get<QuizStatusDTO>(`/quiz/status/${quizId}`);

//                 /* set timer once */
//                 if (totalSecondsRef.current === null && st.timeLimit > 0)
//                     totalSecondsRef.current = st.timeLimit + 1;  // One additional second for safety

//                 /* transform scores → table rows */
//                 const r: ScoreRow[] = await Promise.all(
//                     st.scores.map(async (sc) => {
//                         if (!nameCache.current[sc.userId]) {
//                             try {
//                                 const uRes = await fetch(`${domain}/users/${sc.userId}`);
//                                 if (uRes.ok) {
//                                     const u = await uRes.json();
//                                     nameCache.current[sc.userId] = u.username;
//                                 }
//                             } catch {/* ignore */}
//                         }
//                         return {
//                             userId:  sc.userId,
//                             name:    sc.userId === uid ? "YOU" : nameCache.current[sc.userId] ?? sc.userId.toString(),
//                             correct: sc.correctQuestions,
//                             total:   sc.totalQuestions
//                         };
//                     })
//                 );
//                 setRows(r);

//                 if (st.quizStatus === "COMPLETED") setIAmFinished(true);
//             } catch { /* ignore */ }
//         }

//         poll();
//         const id = setInterval(poll, 1000);
//         return () => clearInterval(id);
//     }, [quizId, uid, apiService, domain]);

//     /* timer tick */
//     useEffect(() => {
//         const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
//         return () => clearInterval(id);
//     }, []);

//     /* redirect when done or time expired */
//     useEffect(() => {
//         const timeUp =
//             totalSecondsRef.current !== null &&
//             elapsedSec >= totalSecondsRef.current;

//         if (timeUp && !iAmFinished) {
//             // tell backend we’re done because of time-out
//             sendTimeoutAnswer().then(() => setIAmFinished(true));
//         }
//         if ((iAmFinished || timeUp) && quizId) {
//             router.push(`/decks/solo-quiz/finish/${quizId}`);
//         }
//     }, [iAmFinished, elapsedSec, quizId, router]);

//     /* ───────────────────── submit answer ───────────────────── */
//     async function handleSubmitAnswer() { 
//         if (!currentQuestion) return antdMessage.error("No question.");
//         if (!selectedOption)  return antdMessage.error("Pick an option.");

//         try {
//             const payload = {
//                 quizId:quizId,
//                 flashcardId: currentQuestion.id,
//                 selectedAnswer: selectedOption,
//                 userId: uid
//             };

//             const dto = await apiService.post<AnswerResponseDTO>(`/quiz/answer`,payload);
//             if (!dto) throw err("");

//             if (dto.wasCorrect){
//                 antdMessage.success("Correct!");
//             } else{
//                 antdMessage.error("Wrong!");
//             }
            
//             if (dto.finished) {
//                 setIAmFinished(true);
//                 antdMessage.info("You finished! Waiting for opponent…");
//             }
//             if (dto.nextQuestion) {
//                 setCurrentQuestion(dto.nextQuestion);
//                 setOptions(shuffle([
//                     dto.nextQuestion.answer,
//                     ...dto.nextQuestion.wrongAnswers
//                 ]));
//                 setSelectedOption("");
//             }
//         } catch (e) {
//             antdMessage.error(err(e).message);
//         }
//     }

//     /* ───────────────────── UI ───────────────────── */
//     // const timerPercent =
//     //     totalSecondsRef.current != null
//     //         ? (elapsedSec / totalSecondsRef.current) * 100
//     //         : 0;

//     async function sendTimeoutAnswer() {
//         if (!quizId || !currentQuestion) return;
//         const payload = {
//             quizId: quizId,
//             flashcardId: currentQuestion.id, // still tell the server which Q we were on
//             selectedAnswer: null,            // <-- timeout flag
//             userId: uid
//         };

//         await apiService.post<AnswerResponseDTO>(`/quiz/answer`,payload).catch(() => {});

//     }

//     const handleCancelQuiz = async () => {
//         if (!quizId || !currentQuestion) return;
        
//         await apiService.delete(`/quiz/quit/${quizId}`).catch(() => {});
        
//     }

//     const player = rows.find((row) => row.userId === uid);

//     return (
//         <div style={{ maxWidth: 600, margin: "100px auto", padding: 20, textAlign: "center" }}>
//             <h1>Single-Player Quiz</h1>

//             {totalSecondsRef.current !== null && (
//                 <ProgressBar timeLeft={totalSecondsRef.current-elapsedSec} duration={totalSecondsRef.current} />
//             )}

//             {currentQuestion ? (
//                 <>
//                     <p style={{ marginTop: 16, fontSize: "1.2rem" }}>

//                         {currentQuestion.imageUrl && (
//                         <div style={{ marginTop: "20px",marginBottom: "20px", maxWidth: "100%", textAlign: "center" }}>
//                         <Image
//                         src = {`${domain}/flashcards/image?imageUrl=${encodeURIComponent(currentQuestion.imageUrl)}`}
//                         alt="Flashcard image"
//                         width={250}
//                         height={170}
//                         style={{ objectFit: "contain", maxHeight: "200px", borderRadius: "8px" }}
//                         unoptimized
//                         />
//                         </div>
//                         )}

//                         {currentQuestion.description}

//                     </p>
//                     <Radio.Group
//                         onChange={(e) => setSelectedOption(e.target.value)}
//                         value={selectedOption}
//                     >
//                         {options.map((o, i) => (
//                             <Radio key={i} value={o} style={{ display: "block" }}>
//                                 {o}
//                             </Radio>
//                         ))}
//                     </Radio.Group>
//                 </>
//             ) : (
//                 <p>Loading question…</p>
//             )}

//             <div style={{ marginTop: 24 }}>
//             <Button type="primary" onClick={handleSubmitAnswer} style={{ marginTop: 16 }}>
//                         Submit
//             </Button>
//             </div>
            
//             <div style={{ marginTop: 24 }}>
//                 {/* Score panel for the current user */}
//                 {player && (
//                 <ScorePanel score={player.correct} total={player.total} />
//                 )}
//             </div>
//             <Button onClick={handleCancelQuiz} style={{ marginTop: 20 }}>
//                 Finish Quiz Early
//             </Button>
//         </div>
//     );
// };

// export default QuizSessionPage;


"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Radio, message, Card, Typography, Progress, Spin } from "antd";
import { useApi } from "@/hooks/useApi";
import { getApiDomain } from "@/utils/domain";
import ProgressBar from "@/components/ProgressBar";
import Image from "next/image";

export const dynamic = "force-dynamic";

const { Title, Text } = Typography;

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

  /* question state */
  const [currentQuestion, setCurrentQuestion] = useState<FlashcardDTO | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  /* flags */
  const [iAmFinished, setIAmFinished] = useState(false);
  const [quizFinishedForAll, setQuizFinishedForAll] = useState(false);

  /* timer */
  const [elapsedSec, setElapsedSec] = useState(0);
  const totalSecondsRef = useRef<number | null>(null);

  /* scoreboard */
  const [rows, setRows] = useState<ScoreRow[]>([]);

  /* simple username cache */
  const nameCache = useRef<Record<number, string>>({});
  
  const uid = Number(localStorage.getItem("userId"));

  const shuffle = (arr: string[]): string[] => [...arr].sort(() => Math.random() - 0.5);
  const err = (e: unknown): Error => (e instanceof Error ? e : new Error(String(e)));

  /* ───────────────────── fetch first question ───────────────────── */
  async function loadCurrentQuestion() {
    if (!quizId) return;
    setLoading(true);
    try {
      const q = await apiService.get<FlashcardDTO>(`/quiz/${quizId}/currentQuestion?userId=${uid}`);
      setCurrentQuestion(q);
      setOptions(shuffle([q.answer, ...q.wrongAnswers]));
      setSelectedOption("");
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

  useEffect(() => {
    if (quizId) loadCurrentQuestion();
  }, [quizId]);

  /* ───────────────────── poll quiz status every 1 s ───────────────────── */
  useEffect(() => {
    if (!quizId) return;

    async function poll() {
      try {
        const st = await apiService.get<QuizStatusDTO>(`/quiz/status/${quizId}`);

        /* set timer once */
        if (totalSecondsRef.current === null && st.timeLimit > 0) {
          totalSecondsRef.current = st.timeLimit + 1;  // One additional second for safety
        }

        /* transform scores → table rows */
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

  /* timer tick */
  useEffect(() => {
    const id = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /* redirect when done or time expired */
  useEffect(() => {
    const timeUp = totalSecondsRef.current !== null &&
      elapsedSec >= totalSecondsRef.current;

    if (timeUp && !iAmFinished) {
      // tell backend we're done because of time-out
      sendTimeoutAnswer().then(() => setIAmFinished(true));
    }
    
    if ((quizFinishedForAll || timeUp) && quizId) {
      router.push(`/decks/solo-quiz/finish/${quizId}`);
    }
  }, [quizFinishedForAll, elapsedSec, quizId, router, iAmFinished]);

  /* ───────────────────── submit answer ───────────────────── */
  async function handleSubmitAnswer() {
    if (!currentQuestion) {
      return message.error("No question available.");
    }
    
    if (!selectedOption) {
      return message.error("Please select an answer.");
    }

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
      
      if (dto.wasCorrect) {
        // Move to next question immediately on correct answer
        message.success("Correct!");
        
        if (dto.finished) {
          setIAmFinished(true);
          message.info("You finished the quiz!");
        } else if (dto.nextQuestion) {
          setCurrentQuestion(dto.nextQuestion);
          setOptions(shuffle([
            dto.nextQuestion.answer,
            ...dto.nextQuestion.wrongAnswers
          ]));
          setSelectedOption("");
        }
      } else {
        // Just show error message for wrong answer, don't reveal correct answer
        message.error("Wrong answer, try again");
      }
    } catch (e) {
      message.error(err(e).message);
    }
  }

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

  const handleCancelQuiz = async () => {
    if (!quizId) return;
    
    message.info("Finishing quiz early...");
    
    try {
      await apiService.delete(`/quiz/quit/${quizId}`);
      router.push("/decks");
    } catch {
      message.error("Failed to cancel quiz. Redirecting to decks.");
      router.push("/decks");
    }
  };

  const currentUser = rows.find(row => row.userId === uid);

  return (
    <div style={{ backgroundColor: TOKENS.bgLight, minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ 
        maxWidth: 800, 
        margin: "0 auto", 
        backgroundColor: TOKENS.bgMedium, 
        padding: 32, 
        borderRadius: TOKENS.radius, 
        boxShadow: TOKENS.shadow 
      }}>
        <Title level={2} style={{ textAlign: "center", color: TOKENS.secondary, marginBottom: 24 }}>
          Single-Player Quiz
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
              <Text style={{ color: "black" }}>Redirecting to results page...</Text>
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
                onChange={(e) => setSelectedOption(e.target.value)}
                value={selectedOption}
                style={{ width: "100%" }}
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
                      backgroundColor: "white",
                      color: "black"
                    }}
                  >
                    <span style={{ color: "black" }}>{option}</span>
                  </Radio>
                ))}
              </Radio.Group>

              {/* Error message for wrong answers */}
              {lastAnswerCorrect === false && (
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
                disabled={!selectedOption}
                style={{
                  marginTop: 24,
                  backgroundColor: TOKENS.primary,
                  borderColor: TOKENS.primary,
                  width: "100%",
                  height: 40
                }}
              >
                Submit Answer
              </Button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Text style={{ color: "black" }}>No questions available for this quiz.</Text>
            </div>
          )}
        </Card>

        {/* Score card */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Card 
            style={{ 
              flex: 1,
              borderRadius: 16, 
              backgroundColor: "white",
              boxShadow: "0 4px 8px rgba(0,0,0,0.08)"
            }}
          >
            {currentUser ? (
              <div>
                <Text strong style={{ color: "black", display: "block", marginBottom: 8 }}>
                  Your Progress
                </Text>
                <Text style={{ color: "black", fontSize: 16 }}>
                  Score: {currentUser.correct} / {currentUser.total}
                </Text>
                <Progress 
                  percent={Math.round((currentUser.correct / Math.max(1, currentUser.total)) * 100)} 
                  status="active"
                  strokeColor={TOKENS.primary}
                  style={{ marginTop: 8 }}
                />
              </div>
            ) : (
              <Text style={{ color: "black" }}>Loading score...</Text>
            )}
          </Card>
          
          <Button 
            danger 
            onClick={handleCancelQuiz}
            style={{ marginLeft: 16 }}
          >
            Finish Quiz Early
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizSessionPage;