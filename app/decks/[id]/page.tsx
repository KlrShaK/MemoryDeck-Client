// app/decks/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Card, Spin, message } from "antd";
import { useApi } from "@/hooks/useApi";
import { Flashcard } from "@/types/flashcard";
import Image from "next/image";

const QuizPage: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    // useParams() can return string | string[] | undefined
    const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
    const deckId = rawId ? parseInt(rawId, 10) : NaN;

    const apiService = useApi();

    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [loading, setLoading] = useState(true);

    // 1) Redirect if `id` is missing or invalid
    useEffect(() => {
        if (!rawId || isNaN(deckId)) {
            message.error("Invalid deck ID");
            router.push("/decks");
            return;
        }

        // 2) Fetch flashcards
        const fetchFlashcards = async () => {
            try {
                const data = await apiService.get<Flashcard[]>(
                    `/flashcards?deckId=${deckId}`
                );
                setFlashcards(data);
            } catch (err) {
                console.error("Failed to fetch flashcards", err);
                message.error("Failed to load flashcards.");
            } finally {
                setLoading(false);
            }
        };

        fetchFlashcards();
    }, [rawId, deckId, apiService, router]);

    // While redirecting, don’t render anything
    if (!rawId || isNaN(deckId)) {
        return null;
    }

    // 3) Answer handler
    const handleAnswer = (selectedAnswer: string) => {
        const current = flashcards[currentCardIndex];
        if (selectedAnswer === current.answer) {
            setScore((s) => s + 1);
        }
        if (currentCardIndex + 1 < flashcards.length) {
            setCurrentCardIndex((i) => i + 1);
        } else {
            setQuizCompleted(true);
        }
    };

    // 4) Retry
    const handleRetryQuiz = () => {
        setScore(0);
        setCurrentCardIndex(0);
        setQuizCompleted(false);
    };

    // 5) Loading state
    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: 40 }}>
                <Spin size="large" />
                <p style={{ marginTop: 16 }}>Loading quiz...</p>
            </div>
        );
    }

    // 6) Completed state
    if (quizCompleted) {
        const percentage = Math.round((score / flashcards.length) * 100);
        return (
            <div style={{ padding: 40, textAlign: "center" }}>
                <h2>Quiz Completed!</h2>
                <p>
                    Your score: {score} / {flashcards.length} ({percentage}%)
                </p>
                <Button onClick={handleRetryQuiz}>Retry Quiz</Button>
                <Button
                    style={{ marginLeft: 10 }}
                    onClick={() => router.push("/decks")}
                >
                    Back to Decks
                </Button>
            </div>
        );
    }

    // 7) Main quiz UI
    const currentFlashcard = flashcards[currentCardIndex];
    return (
        <div style={{ padding: 40, textAlign: "center" }}>
            <h2>
                Question {currentCardIndex + 1} / {flashcards.length}
            </h2>
            <Card
                style={{
                    marginBottom: 20,
                    padding: 20,
                    fontSize: 18,
                    textAlign: "center",
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
            >
                <div>{currentFlashcard.description}</div>
                <div>
                    <Button
                        type="primary"
                        style={{ marginTop: 20 }}
                        onClick={() => handleAnswer(currentFlashcard.answer)}
                    >
                        {currentFlashcard.answer}
                    </Button>
                    {currentFlashcard.imageUrl && (
                        <div>
                            <Image
                                src={currentFlashcard.imageUrl}
                                alt="Question image"
                                width={500}
                                height={300}
                                style={{ marginTop: 20, objectFit: "contain", maxWidth: "100%" }}
                                unoptimized
                            />
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default QuizPage;


// // Deck quiz view (take the quiz)
// "use client";
//
// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { Button, Card, Spin, message } from "antd";
// import { useApi } from "@/hooks/useApi";
// import { Flashcard } from "@/types/flashcard";
// import Image from "next/image";
//
// interface PageProps {
//     params: { id: string };
// }
//
// const QuizPage = ({ params }: PageProps) => {
//   const router = useRouter();
//   const apiService = useApi();
//   const deckId = parseInt(params.id);
//   const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
//   const [currentCardIndex, setCurrentCardIndex] = useState(0);
//   const [score, setScore] = useState(0);
//   const [quizCompleted, setQuizCompleted] = useState(false);
//   const [loading, setLoading] = useState(true);
//
//   // Fetch the flashcards for this specific deck
//     useEffect(() => {
//         const fetchFlashcards = async () => {
//             try {
//                 const response = await apiService.get<Flashcard[]>(`/flashcards?deckId=${deckId}`);
//                 setFlashcards(response);
//             } catch (error) {
//                 console.error("Failed to fetch flashcards", error);
//                 message.error("Failed to load flashcards.");
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         fetchFlashcards();
//     }, [deckId, apiService]);
//
//     // Handle answer selection
//   const handleAnswer = (selectedAnswer: string) => {
//     const currentFlashcard = flashcards[currentCardIndex];
//     const isCorrect = selectedAnswer === currentFlashcard.answer;
//
//     if (isCorrect) {
//       setScore(score + 1);
//     }
//
//     // Move to the next card
//     if (currentCardIndex + 1 < flashcards.length) {
//       setCurrentCardIndex(currentCardIndex + 1);
//     } else {
//       setQuizCompleted(true); // End quiz when all flashcards are answered
//     }
//   };
//
//   const handleRetryQuiz = () => {
//     setScore(0);
//     setCurrentCardIndex(0);
//     setQuizCompleted(false);
//   };
//
//   if (loading) {
//     return (
//       <div style={{ textAlign: "center", padding: "40px" }}>
//         <Spin size="large" />
//         <p style={{ marginTop: "16px" }}>Loading quiz...</p>
//       </div>
//     );
//   }
//
//   if (quizCompleted) {
//     const percentage = Math.round((score / flashcards.length) * 100);
//     return (
//       <div style={{ padding: "40px", textAlign: "center" }}>
//         <h2>Quiz Completed!</h2>
//         <p>
//           Your score: {score} / {flashcards.length} ({percentage}%)
//         </p>
//         <Button onClick={handleRetryQuiz}>Retry Quiz</Button>
//         <Button style={{ marginLeft: "10px" }} onClick={() => router.push("/decks")}>Back to Decks</Button>
//       </div>
//     );
//   }
//
//   const currentFlashcard = flashcards[currentCardIndex];
//
//   return (
//     <div style={{ padding: "40px", textAlign: "center" }}>
//       <h2>Question {currentCardIndex + 1} / {flashcards.length}</h2>
//       <Card
//         style={{
//           marginBottom: "20px",
//           padding: "20px",
//           fontSize: "18px",
//           textAlign: "center",
//           borderRadius: "12px",
//           boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//         }}
//       >
//         <div>{currentFlashcard.description}</div>
//         <div>
//           <Button
//             type="primary"
//             style={{ marginTop: "20px" }}
//             onClick={() => handleAnswer(currentFlashcard.answer)}
//           >
//             {currentFlashcard.answer}
//           </Button>
//             {currentFlashcard.imageUrl && (
//                 <div>
//                     <Image
//                         src={currentFlashcard.imageUrl}
//                         alt="Question image"
//                         width={500}
//                         height={300}
//                         style={{ marginTop: "20px", objectFit: "contain", maxWidth: "100%" }}
//                         unoptimized
//                     />
//                 </div>
//             )}
//
//         </div>
//       </Card>
//     </div>
//   );
// };
//
// export default QuizPage;
