// "use client";

// import React, { useEffect, useState, useCallback } from "react";
// import { Button, Space, Card, Spin, message, Progress, Row, Col, Typography, Radio } from "antd";
// import { useRouter, useParams } from "next/navigation";
// import { useApi } from "@/hooks/useApi";
// import useLocalStorage from "@/hooks/useLocalStorage";
// import { useTimer } from "@/hooks/useTimer";
// import ProgressBar from "@/components/ProgressBar";
// //import ScorePanel from "@/components/ScorePanel";
// import OpponentProgress from "@/components/OpponentProgress";
// import Image from "next/image";
// import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

// const { Title, Text } = Typography;

// interface Quiz {
//   id: string;
//   timeLimit: number;
//   quizStatus: string;
//   scores?: Array<{
//     user: {
//       id: string;
//       username?: string;
//     };
//     correctQuestions?: number;
//     totalQuestions?: number;
//   }>;
//   decks?: Array<{
//     id: string;
//   }>;
// }

// interface Flashcard {
//   id: string;
//   description: string;
//   answer: string;
//   wrongAnswers: string[];
//   imageUrl?: string | null;
// }

// interface Opponent {
//   id: string;
//   username: string;
//   score: number;
//   totalAnswered: number;
// }

// const QuizPlayPage: React.FC = () => {
//   const router = useRouter();
//   const { id } = useParams();
//   const quizId = id as string;
//   const apiService = useApi();
//   const { value: userId } = useLocalStorage<string>("userId", "");
  
//   const [loading, setLoading] = useState(true);
//   const [, setQuiz] = useState<Quiz | null>(null);
//   const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
//   const [currentCardIndex, setCurrentCardIndex] = useState(0);
//   const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
//   const [answerSubmitted, setAnswerSubmitted] = useState(false);
//   const [isCorrect, setIsCorrect] = useState(false);
//   const [score, setScore] = useState(0);
//   const [totalAnswered, setTotalAnswered] = useState(0);
//   const [quizCompleted, setQuizCompleted] = useState(false);
//   const [opponent, setOpponent] = useState<Opponent | null>(null);
  
//   // Timer functionality
//   const [timeLimit, setTimeLimit] = useState(60);
//   const { timeLeft, start, reset } = useTimer(timeLimit);
  
//   useEffect(() => {
//     if (!quizId || !userId) {
//       message.error("Missing quiz information");
//       router.push("/decks");
//       return;
//     }

//     const loadQuiz = async () => {
//       try {
//         // 1. Fetch quiz details
//         const quizData = await apiService.get<Quiz>(`/quiz/status?quizId=${quizId}`);
//         setQuiz(quizData);
//         setTimeLimit(quizData.timeLimit || 60);

//         // 2. Fetch all flashcards for the decks in this quiz
//         const allFlashcards: Flashcard[] = [];
        
//         // We need to get deck IDs from the quiz
//         if (quizData.decks && quizData.decks.length > 0) {
//           for (const deck of quizData.decks) {
//             try {
//               const deckFlashcards = await apiService.get<Flashcard[]>(`/decks/${deck.id}/flashcards`);
//               allFlashcards.push(...deckFlashcards);
//             } catch (err) {
//               console.error(`Failed to load flashcards for deck ${deck.id}`, err);
//             }
//           }
//         } else {
//           // Fallback if we don't have decks - this shouldn't happen in a real scenario
//           message.warning("No flashcards found for this quiz");
//         }
        
//         // Shuffle the flashcards to make the quiz more interesting
//         setFlashcards(shuffleArray(allFlashcards));
        
//         // 3. Get opponent information
//         if (quizData.scores && quizData.scores.length > 0) {
//           const opponentScore = quizData.scores.find(s => s.user.id !== userId);
//           if (opponentScore) {
//             setOpponent({
//               id: opponentScore.user.id,
//               username: opponentScore.user.username || "Opponent",
//               score: opponentScore.correctQuestions || 0,
//               totalAnswered: opponentScore.totalQuestions || 0
//             });
//           }
//         }
        
//         setLoading(false);
//         start(); // Start the timer once everything is loaded
        
//       } catch (error) {
//         console.error("Failed to load quiz:", error);
//         message.error("Failed to load quiz data");
//         router.push("/decks");
//       }
//     };

//     loadQuiz();
    
//     // Set up polling for opponent progress
//     const intervalId = setInterval(async () => {
//       if (quizCompleted) return;
      
//       try {
//         const updatedQuiz = await apiService.get<Quiz>(`/quiz/status?quizId=${quizId}`);
        
//         // Update opponent score if available
//         if (updatedQuiz.scores && updatedQuiz.scores.length > 0) {
//           const opponentScore = updatedQuiz.scores.find(s => s.user.id !== userId);
//           if (opponentScore) {
//             setOpponent(prev => prev ? {
//               ...prev,
//               score: opponentScore.correctQuestions || 0,
//               totalAnswered: opponentScore.totalQuestions || 0
//             } : null);
//           }
//         }
        
//         // Check if quiz is completed by the system
//         if (updatedQuiz.quizStatus === "COMPLETED") {
//           setQuizCompleted(true);
//         }
//       } catch (err) {
//         console.error("Failed to update opponent progress", err);
//       }
//     }, 3000);
    
//     return () => clearInterval(intervalId);
//   }, [quizId, userId, apiService, router, quizCompleted, start]);
  

  
//   // Shuffle array helper
//   const shuffleArray = <T,>(array: T[]): T[] => {
//     const shuffled = [...array];
//     for (let i = shuffled.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * (i + 1));
//       [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
//     }
//     return shuffled;
//   };
  
//   // Get all answer options and shuffle them
//   const getAnswerOptions = (flashcard: Flashcard): string[] => {
//     if (!flashcard) return [];
//     const options = [flashcard.answer, ...flashcard.wrongAnswers];
//     return shuffleArray(options);
//   };
  
//   const handleAnswerSelect = (answer: string) => {
//     if (!answerSubmitted) {
//       setSelectedAnswer(answer);
//     }
//   };

//   const finishQuiz = useCallback(async () => {
//     setQuizCompleted(true);
//     try {
//       const results = await apiService.get<Quiz>(`/quiz/status?quizId=${quizId}`);
//       setQuiz(results);
//       if (results.scores && results.scores.length > 0) {
//         const opponentScore = results.scores.find(s => s.user.id !== userId);
//         if (opponentScore && opponent) {
//           setOpponent({
//             ...opponent,
//             score: opponentScore.correctQuestions || 0,
//             totalAnswered: opponentScore.totalQuestions || 0
//           });
//         }
//       }
//     } catch (error) {
//       console.error("Failed to get quiz results:", error);
//     }
//   }, [apiService, quizId, setQuiz, userId, opponent]);


//   const handleSubmitAnswer = useCallback(async () => {
//     if (quizCompleted || !flashcards[currentCardIndex]) return;

//     const currentFlashcard = flashcards[currentCardIndex];
//     const answer = selectedAnswer || ""; // Submit empty string if no answer selected
//     const correct = answer === currentFlashcard.answer;

//     setAnswerSubmitted(true);
//     setIsCorrect(correct);
//     setTotalAnswered(prev => prev + 1);

//     if (correct) {
//       setScore(prev => prev + 1);
//     }

//     try {
//       await apiService.post("/quiz/submit-answer", {
//         quizId,
//         userId,
//         flashcardId: currentFlashcard.id,
//         answer,
//       });
//     } catch (error) {
//       console.error("Failed to submit answer:", error);
//       // Continue anyway - local score is updated
//     }

//     setTimeout(() => {
//       if (currentCardIndex < flashcards.length - 1) {
//         setCurrentCardIndex(prev => prev + 1);
//         setSelectedAnswer(null);
//         setAnswerSubmitted(false);
//         reset(); // Reset timer for next question
//       } else {
//         finishQuiz();
//       }
//     }, 2000);
//   }, [
//     quizCompleted,
//     flashcards,
//     currentCardIndex,
//     selectedAnswer,
//     apiService,
//     quizId,
//     userId,
//     reset,
//     finishQuiz
//   ]);

//   // Timer effect
//   useEffect(() => {
//     if (timeLeft === 0 && !answerSubmitted && !quizCompleted) {
//       handleSubmitAnswer();
//     }
//   }, [timeLeft, answerSubmitted, quizCompleted, handleSubmitAnswer]);


  
//   const handleLeaveQuiz = async () => {
//     try {
//       await apiService.post("/quiz/leave", {
//         quizId,
//         userId
//       });
//     } catch (error) {
//       console.error("Error leaving quiz:", error);
//     }
    
//     router.push("/decks");
//   };
  
//   const handleRematch = async () => {
//     // This would need to be implemented on the backend
//     message.info("Rematch functionality not yet implemented");
//   };
  
//   // If loading, show spinner
//   if (loading) {
//     return (
//       <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f0f2f5" }}>
//         <Spin size="large" />
//         <span style={{ marginLeft: 10 }}>Loading quiz...</span>
//       </div>
//     );
//   }
  
//   // If quiz completed, show results
//   if (quizCompleted) {
//     const userWon = score > (opponent?.score || 0);
//     const isTie = score === (opponent?.score || 0);
    
//     return (
//       <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
//         <Card style={{ marginBottom: "20px" }}>
//           <Title level={2} style={{ textAlign: "center" }}>Quiz Results</Title>
          
//           <div style={{ textAlign: "center", margin: "30px 0" }}>
//             {isTie ? (
//                 <Title level={3}>It&apos;s a tie!</Title>
//             ) : (
//               <Title level={3}>{userWon ? "You won!" : `${opponent?.username || "Opponent"} won!`}</Title>
//             )}
            
//             <Row gutter={16} style={{ marginTop: "30px" }}>
//               <Col span={12}>
//                 <Card title="Your Score" style={{ textAlign: "center" }}>
//                   <Title level={2}>{score}</Title>
//                   <Text>out of {flashcards.length}</Text>
//                   <Progress percent={Math.round((score / flashcards.length) * 100)} status="active" />
//                 </Card>
//               </Col>
              
//               <Col span={12}>
//                 <Card title={`${opponent?.username || "Opponent"}&apos;s Score`} style={{ textAlign: "center" }}>
//                   <Title level={2}>{opponent?.score || 0}</Title>
//                   <Text>out of {flashcards.length}</Text>
//                   <Progress percent={Math.round(((opponent?.score || 0) / flashcards.length) * 100)} status="active" />
//                 </Card>
//               </Col>
//             </Row>
//           </div>
          
//           <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
//             <Button onClick={handleRematch} type="primary" style={{ backgroundColor: "#285c28", borderColor: "#285c28" }}>
//               Rematch
//             </Button>
//             <Button onClick={handleLeaveQuiz}>
//               Return to Decks
//             </Button>
//           </div>
//         </Card>
//       </div>
//     );
//   }
  
//   // Get current flashcard
//   const currentFlashcard = flashcards[currentCardIndex];
//   if (!currentFlashcard) {
//     return (
//       <div style={{ textAlign: "center", padding: "40px" }}>
//         <Title level={3}>No flashcards available for this quiz</Title>
//         <Button onClick={handleLeaveQuiz}>Return to Decks</Button>
//       </div>
//     );
//   }
  
//   // Get answer options
//   const answerOptions = getAnswerOptions(currentFlashcard);
  
//   // Main quiz UI
//   return (
//     <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
//       <Row justify="space-between" align="middle" style={{ marginBottom: "20px" }}>
//         <Col>
//           <Title level={3}>Quiz</Title>
//         </Col>
//         <Col>
//           <Button onClick={handleLeaveQuiz}>Exit Quiz</Button>
//         </Col>
//       </Row>
      
//       {/* Progress and Timer */}
//       <Row gutter={16} style={{ marginBottom: "20px" }}>
//         <Col span={12}>
//           <div style={{ marginBottom: "8px" }}>
//             <Text>Question {currentCardIndex + 1} of {flashcards.length}</Text>
//           </div>
//           <Progress percent={Math.round(((currentCardIndex + 1) / flashcards.length) * 100)} status="active" />
//         </Col>
        
//         <Col span={12}>
//           <div style={{ marginBottom: "8px", textAlign: "right" }}>
//             <Text style={{ color: timeLeft < 10 ? "red" : undefined }}>
//               Time left: {timeLeft} seconds
//             </Text>
//           </div>
//           <ProgressBar timeLeft={timeLeft} duration={timeLimit} />
//         </Col>
//       </Row>
      
//       <Row gutter={16}>
//         {/* Scores Section */}
//         <Col xs={24} md={8}>
//           <Card title="Scores" style={{ marginBottom: "20px" }}>
//             <div style={{ marginBottom: "16px" }}>
//               <Text strong>Your score: </Text>
//               <Text>{score} / {totalAnswered}</Text>
//             </div>
            
//             {opponent && (
//               <OpponentProgress
//                 name={opponent.username}
//                 score={opponent.score}
//                 total={opponent.totalAnswered}
//               />
//             )}
//           </Card>
//         </Col>
        
//         {/* Main Question Card */}
//         <Col xs={24} md={16}>
//           <Card 
//             title={
//               <div style={{ fontSize: "18px", wordBreak: "break-word" }}>
//                 {currentFlashcard.description}
//               </div>
//             }
//           >
//             {/* Image if available */}
//             {currentFlashcard.imageUrl && (
//               <div style={{ textAlign: "center", marginBottom: "20px" }}>
//                 <Image 
//                   src={currentFlashcard.imageUrl}
//                   alt="Question Image"
//                   width={300}
//                   height={200}
//                   style={{ objectFit: "contain" }}
//                   unoptimized={true}
//                 />
//               </div>
//             )}
            
//             {/* Answer options */}
//             <Radio.Group 
//               onChange={(e) => handleAnswerSelect(e.target.value)}
//               value={selectedAnswer}
//               style={{ width: "100%" }}
//               disabled={answerSubmitted}
//             >
//               <Space direction="vertical" style={{ width: "100%" }}>
//                 {answerOptions.map((answer, index) => (
//                   <Radio 
//                     key={index}
//                     value={answer}
//                     style={{
//                       width: "100%",
//                       padding: "12px",
//                       border: "1px solid #d9d9d9",
//                       borderRadius: "8px",
//                       marginBottom: "8px",
//                       backgroundColor: answerSubmitted
//                         ? answer === currentFlashcard.answer
//                           ? "#f6ffed" // Correct answer background
//                           : selectedAnswer === answer
//                             ? "#fff2f0" // Incorrect selected answer background
//                             : "white"
//                         : "white"
//                     }}
//                   >
//                     <Space>
//                       {answer}
//                       {answerSubmitted && answer === currentFlashcard.answer && (
//                         <CheckCircleOutlined style={{ color: "#52c41a" }} />
//                       )}
//                       {answerSubmitted && selectedAnswer === answer && answer !== currentFlashcard.answer && (
//                         <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
//                       )}
//                     </Space>
//                   </Radio>
//                 ))}
//               </Space>
//             </Radio.Group>
            
//             {/* Result message when answer submitted */}
//             {answerSubmitted && (
//               <div style={{
//                 marginTop: "16px",
//                 padding: "12px",
//                 backgroundColor: isCorrect ? "#f6ffed" : "#fff2f0",
//                 border: `1px solid ${isCorrect ? "#b7eb8f" : "#ffccc7"}`,
//                 borderRadius: "8px"
//               }}>
//                 <Text strong style={{ color: isCorrect ? "#52c41a" : "#ff4d4f" }}>
//                   {isCorrect ? "Correct! " : "Incorrect. "}
//                 </Text>
//                 <Text>
//                   {isCorrect 
//                     ? "Great job!" 
//                     : `The correct answer is: ${currentFlashcard.answer}`
//                   }
//                 </Text>

//               </div>
//             )}
            
//             {/* Submit button */}
//             {!answerSubmitted && (
//               <Button
//                 type="primary"
//                 onClick={handleSubmitAnswer}
//                 disabled={!selectedAnswer}
//                 style={{
//                   width: "100%",
//                   marginTop: "16px",
//                   backgroundColor: "#285c28",
//                   borderColor: "#285c28"
//                 }}
//               >
//                 Submit Answer
//               </Button>
//             )}
//           </Card>
//         </Col>
//       </Row>
//     </div>
//   );
// };

// export default QuizPlayPage;



// "use client";

// import React, { useEffect, useState, useRef } from "react";
// import { useParams, useRouter } from "next/navigation";
// import {
//   Button,
//   Radio,
//   message as antdMessage,
//   Table,
//   Progress,
//   Card,
//   Typography,
//   Space,
// } from "antd";
// import { ApiService } from "@/api/apiService";
// import { useApi } from "@/hooks/useApi";
// import { getApiDomain } from "@/utils/domain";
// import useLocalStorage from "@/hooks/useLocalStorage";

// const { Title, Paragraph } = Typography;

// interface FlashcardDTO {
//   id: number;
//   description: string;
//   answer: string;
//   wrongAnswers: string[];
// }

// interface AnswerResponseDTO {
//   wasCorrect: boolean;
//   finished: boolean;
//   nextQuestion: FlashcardDTO | null;
// }

// interface ScoreDTO {
//   id: number;
//   userId: number;
//   correctQuestions: number;
//   totalQuestions: number;
// }

// interface QuizStatusDTO {
//   quizStatus: "WAITING" | "IN_PROGRESS" | "COMPLETED";
//   timeLimit: number;
//   scores: ScoreDTO[];
// }

// interface ScoreRow {
//   userId: number;
//   name: string;
//   correct: number;
//   total: number;
// }

// const QuizPlayPage: React.FC = () => {
//   const router = useRouter();
//   const apiService = useApi();
//   const apiDomain = getApiDomain();
//   const { id } = useParams();
//   const quizId = id as string;
//   const [currentQuestion, setCurrentQuestion] = useState<FlashcardDTO | null>(null);
//   const [options, setOptions] = useState<string[]>([]);
//   const [selectedOption, setSelectedOption] = useState<string>("");
//   const [iAmFinished, setIAmFinished] = useState(false);
//   const [quizFinishedForAll, setQuizFinishedForAll] = useState(false);
//   const [elapsedSec, setElapsedSec] = useState(0);
//   const totalSecondsRef = useRef<number | null>(null);
//   const [rows, setRows] = useState<ScoreRow[]>([]);
//   const nameCache = useRef<Record<number, string>>({});
//   const { value: userId } = useLocalStorage<string>('userId', '');
//   const uid = Number(userId);

//   const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5);
//   const err = (e: unknown) => (e instanceof Error ? e : new Error(String(e)));

//   async function loadCurrentQuestion() {
//     if (!quizId) return;
//     try {
//       const q = await apiService.get<FlashcardDTO>(
//         `/quiz/${Number(quizId)}/currentQuestion?userId=${uid}`
//       );
//       setCurrentQuestion(q);
//       setOptions(shuffle([q.answer, ...q.wrongAnswers]));
//       setSelectedOption("");
//       setIAmFinished(false);
//     } catch (e) {
//       const m = err(e).message;
//       if (m.includes("already finished")) setIAmFinished(true);
//       else antdMessage.error(m);
//     }
//   }

//   useEffect(() => {
//     if (quizId) loadCurrentQuestion();
//   }, [quizId]);

//   useEffect(() => {
//     if (!quizId) return;

//     async function poll() {
//       try {
//         const st = await apiService.get<QuizStatusDTO>(
//           `/quiz/status/${Number(quizId)}`
//         );

//         if (totalSecondsRef.current === null && st.timeLimit > 0)
//           totalSecondsRef.current = st.timeLimit + 1;

//         const r: ScoreRow[] = await Promise.all(
//           st.scores.map(async (sc) => {
//             if (!nameCache.current[sc.userId]) {
//               try {
//                 const uRes = await fetch(`${apiDomain}/users/${sc.userId}`);
//                 if (uRes.ok) {
//                   const u = await uRes.json();
//                   nameCache.current[sc.userId] = u.username;
//                 }
//               } catch {}
//             }
//             return {
//               userId: sc.userId,
//               name:
//                 sc.userId === uid
//                   ? "YOU"
//                   : nameCache.current[sc.userId] ?? sc.userId.toString(),
//               correct: sc.correctQuestions,
//               total: sc.totalQuestions,
//             };
//           })
//         );
//         setRows(r);

//         if (st.quizStatus === "COMPLETED") setQuizFinishedForAll(true);
//       } catch {}
//     }

//     poll();
//     const id = setInterval(poll, 1000);
//     return () => clearInterval(id);
//   }, [quizId, uid]);

//   useEffect(() => {
//     const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
//     return () => clearInterval(id);
//   }, []);

//   useEffect(() => {
//     const timeUp =
//       totalSecondsRef.current !== null &&
//       elapsedSec >= totalSecondsRef.current;

//     if (timeUp && !iAmFinished) {
//       sendTimeoutAnswer().then(() => setIAmFinished(true));
//     }
//     if ((quizFinishedForAll || timeUp) && quizId) {
//       router.push(`/quiz/finish/${Number(quizId)}`);
//     }
//   }, [quizFinishedForAll, elapsedSec, quizId, router]);

//   async function handleSubmitAnswer() {
//     if (!currentQuestion) return antdMessage.error("No question.");
//     if (!selectedOption) return antdMessage.error("Pick an option.");

//     try {
//       const payload = {
//         quizId: quizId,
//         flashcardId: currentQuestion.id,
//         selectedAnswer: selectedOption,
//         userId: uid,
//       };

//       const dto = await apiService.post<AnswerResponseDTO>(
//         `/quiz/answer`,
//         payload
//       );
//       if (!dto) throw err("");

//       dto.wasCorrect
//         ? antdMessage.success("Correct!")
//         : antdMessage.error("Wrong!");
//       if (dto.finished) {
//         setIAmFinished(true);
//         antdMessage.info("You finished! Waiting for opponent…");
//       }
//       if (dto.nextQuestion) {
//         setCurrentQuestion(dto.nextQuestion);
//         setOptions(shuffle([dto.nextQuestion.answer, ...dto.nextQuestion.wrongAnswers]));
//         setSelectedOption("");
//       }
//     } catch (e) {
//       antdMessage.error(err(e).message);
//     }
//   }

//   const timerPercent =
//     totalSecondsRef.current != null
//       ? (elapsedSec / totalSecondsRef.current) * 100
//       : 0;

//   async function sendTimeoutAnswer() {
//     if (!quizId || !currentQuestion) return;
//     const payload = {
//       quizId: quizId,
//       flashcardId: currentQuestion.id,
//       selectedAnswer: null,
//       userId: uid,
//     };
//     await apiService.post<AnswerResponseDTO>(`/quiz/answer`, payload).catch(() => {});
//   }

//   const handleCancelQuiz = async () => {
//     if (!quizId || !currentQuestion) return;
//     if (!localStorage.getItem("user_quitted")) {
//       localStorage.setItem("user_quitted", String(uid));
//     }
//     await apiService.delete(`/quiz/quit/${Number(quizId)}`).catch(() => {});
//   };

//   return (
//     <div style={{ padding: 24, display: "flex", justifyContent: "center" }}>
//       <Card style={{ maxWidth: 700, width: "100%" }} bordered>
//         <Title level={2}>Quiz </Title>

//         {totalSecondsRef.current !== null && (
//           <Progress
//             percent={Math.min(100, timerPercent)}
//             status={
//               elapsedSec >= (totalSecondsRef.current ?? 0)
//                 ? "exception"
//                 : "active"
//             }
//             showInfo={false}
//           />
//         )}

//         {iAmFinished ? (
//           <Paragraph style={{ marginTop: 24 }}>
//             You’re done! Waiting for your opponent…
//           </Paragraph>
//         ) : currentQuestion ? (
//           <div style={{ marginTop: 24 }}>
//             <Title level={4}>{currentQuestion.description}</Title>
//             <Radio.Group
//               onChange={(e) => setSelectedOption(e.target.value)}
//               value={selectedOption}
//               style={{ display: "flex", flexDirection: "column", gap: 8 }}
//             >
//               {options.map((o, i) => (
//                 <Radio.Button key={i} value={o} style={{ textAlign: "left" }}>
//                   {o}
//                 </Radio.Button>
//               ))}
//             </Radio.Group>
//             <Button
//               type="primary"
//               onClick={handleSubmitAnswer}
//               style={{ marginTop: 20 }}
//               block
//             >
//               Submit Answer
//             </Button>
//           </div>
//         ) : (
//           <Paragraph>Loading question…</Paragraph>
//         )}

//         {rows.length > 0 && (
//           <Table<ScoreRow>
//             style={{ marginTop: 32 }}
//             size="small"
//             pagination={false}
//             dataSource={rows}
//             rowKey="userId"
//             columns={[
//               { title: "Player", dataIndex: "name", key: "p" },
//               {
//                 title: "Progress",
//                 render: (_, r) => `${r.correct}/${r.total}`,
//                 key: "pr",
//               },
//             ]}
//           />
//         )}

//         <Space direction="vertical" style={{ marginTop: 24, width: "100%" }}>
//           <Button onClick={() => router.push("/decks")} block>
//             Back to Decks
//           </Button>
//           <Button onClick={handleCancelQuiz} danger block>
//             Quit the Game
//           </Button>
//         </Space>
//       </Card>
//     </div>
//   );
// };

// export default QuizPlayPage;