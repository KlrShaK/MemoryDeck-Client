// PLAY 



// "use client";

// import React, { useEffect, useState, useRef } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { Button, Radio, message as antdMessage } from "antd";
// import Image from "next/image";
// import { useApi } from "@/hooks/useApi";
// import { getApiDomain } from "@/utils/domain";
// import ProgressBar from "@/components/ProgressBar";
// import ScorePanel from "@/components/ScorePanel";
// import OpponentProgress from "@/components/OpponentProgress";

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

// // Styling constants
// const TOKENS = {
//     primary: '#2E8049',
//     secondary: '#215F46',
//     bgLight: '#c3fad4',
//     bgMedium: '#aef5c4',
//     bgDark: '#d4ffdd',
//     radius: 20,
//     shadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
//   };
  

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
//     const [quizFinishedForAll, setQuizFinishedForAll] = useState(false);

//     /* timer */
//     const [elapsedSec, setElapsedSec] = useState(0);
//     const totalSecondsRef = useRef<number | null>(null);

//     /* scoreboard */
//     const [rows, setRows] = useState<ScoreRow[]>([]);

//     /* simple username cache */
//     const nameCache = useRef<Record<number, string>>({});

//     const uid = Number(localStorage.getItem("userId"));
//     // const { value: userId } = useLocalStorage<string>('userId', '');
//     // const uid = Number(userId);
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

//                 if (st.quizStatus === "COMPLETED") setQuizFinishedForAll(true);
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
//         if ((quizFinishedForAll || timeUp) && quizId) {
//             router.push(`/decks/quiz/finish/${quizId}`);
//         }
//     }, [quizFinishedForAll, elapsedSec, quizId, router, iAmFinished]);

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
//         if (!localStorage.getItem("user_quitted")) {
//             localStorage.setItem("user_quitted", String(uid));
//           }   
        
//         await apiService.delete(`/quiz/quit/${quizId}`).catch(() => {});
        
//     }

//     const currentUser = rows.find((row) => row.userId === uid);
//     const opponents = rows.filter((row) => row.userId !== uid);


//     return (
//         <div style={{ maxWidth: 600, margin: "100px auto", padding: 20, textAlign: "center" }}>
//             <h1>Multi-Player Quiz</h1>

//             {totalSecondsRef.current !== null && (
//                 <ProgressBar timeLeft={totalSecondsRef.current-elapsedSec} duration={totalSecondsRef.current} />

//             )}

//             {iAmFinished ? (
//                 <p>You’re done! Waiting for your opponent…</p>
//             ) : currentQuestion ? (
//                 <>
//                     <p style={{ marginTop: 16, fontSize: "1.2rem" }}>

//                     {currentQuestion.imageUrl && (
//                   <div style={{ marginTop: "20px",marginBottom: "20px", maxWidth: "100%", textAlign: "center" }}>
//                     <Image
//                       // src={flashcards[currentIndex].imageUrl}
//                       src = {`${domain}/flashcards/image?imageUrl=${encodeURIComponent(currentQuestion.imageUrl)}`}
//                       alt="Flashcard image"
//                       width={250}
//                       height={170}
//                       style={{ objectFit: "contain", maxHeight: "200px", borderRadius: "8px" }}
//                       unoptimized
//                     />
//                   </div>
//                 )}

//                     {currentQuestion.description}
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

//             {/* {rows.length > 0 && (
//                 <Table<ScoreRow>
//                     style={{ marginTop: 24 }}
//                     size="small"
//                     pagination={false}
//                     dataSource={rows}
//                     rowKey="userId"
//                     columns={[
//                         { title: "Player",   dataIndex: "name",    key: "p" },
//                         { title: "Progress", render: (_,_r)=>`${_r.correct}/${_r.total}`, key: "pr" }
//                     ]}
//                 />
//             )} */}
//             <div style={{ marginTop: 24 }}>
//             <Button type="primary" onClick={handleSubmitAnswer} style={{ marginTop: 16 }}>
//                         Submit
//             </Button>
//             </div>

//             <div style={{ marginTop: 24 }}>
//                 {/* Score panel for the current user */}
//                 {currentUser && (
//                 <ScorePanel score={currentUser.correct} total={currentUser.total} />
//                 )}

//                 {/* Opponent progress cards */}
//                 {opponents.length > 0 && (
//                 <div style={{ marginTop: 32 }}>
//                     <h3 style={{ marginBottom: 16 }}>Opponent Progress</h3>
//                     <div
//                     style={{
//                         display: "flex",
//                         gap: "16px",
//                         flexWrap: "wrap",
//                     }}
//                     >
//                     {opponents.map((opponent) => (
//                         <OpponentProgress
//                         key={opponent.userId}
//                         name={opponent.name}
//                         score={opponent.correct}
//                         total={opponent.total}
//                         />
//                     ))}
//                     </div>
//                 </div>
//                 )}
//             </div>

//             {/* <Button onClick={() => router.push("/decks")} style={{ marginTop: 20 }}>
//                 Back to Decks
//             </Button> */}
//             <Button onClick={handleCancelQuiz} style={{ marginTop: 20 }}>
//                 Finish Quiz Early
//             </Button>
//         </div>
//     );
// };

// export default QuizSessionPage;



// FINISH


// "use client";

// import React, { useEffect, useState } from "react";
// import { useRouter, useParams } from "next/navigation";
// import { Button } from "antd";
// import { useApi } from "@/hooks/useApi";
// import OpponentProgress from "@/components/OpponentProgress";

// /* ----- DTO returned by /statistics/quiz/{id} ----- */
// interface StatsDTO {
//     userId:           number;
//     username:         string;
//     quizId:           number;
//     correctQuestions: number;
//     numberOfAttempts: number;
//     timeTakenSeconds: number;   // seconds, already final
//     isWinner: boolean;
// }

// /* row with composite score */
// interface Row extends StatsDTO {
//     composite: number;
// }

// /* ---------- composite scoring 0-1000 ---------- */
// function computeScores(list: StatsDTO[]): Row[] {
//     const maxCorrect = Math.max(...list.map(r => r.correctQuestions));
//     const minAtt     = Math.min(...list.map(r => r.numberOfAttempts));
//     const maxAtt     = Math.max(...list.map(r => r.numberOfAttempts));
//     const minTime    = Math.min(...list.map(r => r.timeTakenSeconds));
//     const maxTime    = Math.max(...list.map(r => r.timeTakenSeconds));

//     const norm = (v: number, lo: number, hi: number, lowerBetter = false) =>
//         hi === lo ? 1 : lowerBetter ? (hi - v) / (hi - lo) : (v - lo) / (hi - lo);

//     return list
//         .map(r => {
//             const nCorrect = maxCorrect === 0 ? 0 : r.correctQuestions / maxCorrect;
//             const nAtt     = norm(r.numberOfAttempts, minAtt, maxAtt, true);
//             const nTime    = norm(r.timeTakenSeconds,  minTime, maxTime, true);

//             const composite = Math.round(
//                 1000 * (0.5 * nCorrect + 0.3 * nAtt + 0.2 * nTime)
//             );
//             return { ...r, composite };
//         })
//         .sort((a, b) => b.composite - a.composite);      // best first
// }

// /* ---------------- React page ---------------- */
// const FinishPage: React.FC = () => {
//     const router              = useRouter();
//     const apiService          = useApi();
//     const { id }          = useParams<{ id: string }>();
//     const qid                 = Number(id);
//     const currentUid          = Number(localStorage.getItem("userId"));
//     const [rows, setRows]     = useState<Row[]>([]);
//     const [winnerId, setWinnerId]     = useState<number | null>(null);
//     const [userQuitted, setUserQuitted] = useState<string | null>(null);

//     useEffect(() => {
//         const val = localStorage.getItem("user_quitted");
//         setUserQuitted(val);
//     }, []);

//     /* 1️⃣ ─ Fetch raw stats once */
//     useEffect(() => {
//         if (!qid) return;
//         (async () => {
//             const raw = await apiService.get<StatsDTO[]>(`/statistics/quiz/${qid}`);

//             raw.forEach(r => {
//                 if (r.userId === currentUid) r.username = "YOU";
//             });
//             setRows(computeScores(raw));
//         })();
//     }, [qid, currentUid, apiService]);

//     /* 2️⃣ ─ After rows ready mark winner/draw */
//     useEffect(() => {
//         if (rows.length === 0 || !qid) return;

//         if (userQuitted){
//             const winner = rows.find((r) => r.userId !== Number(userQuitted))?.userId;
//             setWinnerId(-1);
//             apiService.put(`/statistics/quiz/${qid}`,{ winnerUserId: winner }).catch(() => {/* ignore */});
//         } else{
//             const winner = rows.length > 1 && rows[0].composite === rows[1].composite
//                             ? null
//                             : rows[0].userId;
//             setWinnerId(winner);
            
//             apiService.put(`/statistics/quiz/${qid}`,{ winnerUserId: winner }).catch(() => {/* ignore */});
//         }

//         localStorage.removeItem("user_quitted"); 
//     }, [rows, qid, userQuitted, apiService]);

//     const currentUser = rows.find((row) => row.userId === currentUid);
//     const opponents = rows.filter((row) => row.userId !== currentUid);
//     console.error(winnerId);
//     return (
//         // <div style={{ padding: 24, maxWidth: 720 }}>
//         //     <h1>Final results for quiz #{qid}</h1>
//         <div style={{ maxWidth: 600, margin: "100px auto", padding: 20, textAlign: "center" }}>
//             { winnerId== -1 || !winnerId ?
//              <h3 color="yellow">No winners!</h3> :
//              winnerId == currentUid ?
//              <h3 color="green">You have won. Congratulations!</h3> :
//              <h3 color="red">You were unlucky this time. Keep up the Good Work!</h3>
//         }
//             { currentUser &&
//             <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
//                 Your score: {currentUser.correctQuestions} / {currentUser.numberOfAttempts}
//             </p>}
//             { currentUser &&
//             <p style={{ fontSize: "1.3rem", color: "#555" }}>
//                 Performance Summary: {(100*currentUser?.correctQuestions/currentUser?.numberOfAttempts).toFixed(2)}%
//             </p>}

//             {opponents.length > 0 && (
//                 <div style={{ marginTop: 32 }}>
//                     <h3 style={{ marginBottom: 16 }}>Opponent Progress</h3>
//                     <div
//                     style={{
//                         display: "flex",
//                         gap: "16px",
//                         flexWrap: "wrap",
//                     }}
//                     >
//                     {opponents.map((opponent) => (
//                         <OpponentProgress
//                         key={opponent.userId}
//                         name={opponent.username}
//                         score={opponent.correctQuestions}
//                         total={opponent.numberOfAttempts}
//                         />
//                     ))}
//                     </div>
//                 </div>
//                 )}
//             {/* <Table<Row>
//                 rowKey="userId"
//                 pagination={false}
//                 dataSource={rows}
//                 columns={[
//                     { title: "Rank",        render: (_ , __ , i) => i + 1,            key: "rk" },
//                     { title: "Player",      dataIndex: "username",                    key: "pl" },
//                     { title: "Score (raw)", dataIndex: "correctQuestions",            key: "raw" },
//                     { title: "Attempts",    dataIndex: "numberOfAttempts",            key: "att" },
//                     { title: "Time (s)",    render: (_, r) => r.timeTakenSeconds.toFixed(1), key: "tm" },
//                     { title: "Composite",   dataIndex: "composite",                   key: "cmp" }
//                 ]}
//             /> */}

//             <Button style={{ marginTop: 24 }} onClick={() => router.push("/decks")}>
//                 Back to Decks
//             </Button>
//         </div>
//     );
// };

// export default FinishPage;