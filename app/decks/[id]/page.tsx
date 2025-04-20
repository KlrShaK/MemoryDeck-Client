// Deck quiz view (take the quiz)
/*"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Row, Col, Spin, message } from "antd";
import { useApi } from "@/hooks/useApi";
import { Flashcard } from "@/types/flashcard";

interface QuizPageProps {
  params: {
    id: string; // Deck ID from URL
  };
}

const QuizPage = ({ params }: QuizPageProps) => {
  const router = useRouter();
  const apiService = useApi();
  const deckId = parseInt(params.id);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch the flashcards for this specific deck
  const fetchFlashcards = async () => {
    try {
      const response = await apiService.get<Flashcard[]>(`/flashcards?deckId=${deckId}`);
      setFlashcards(response);
    } catch (error) {
      console.error("Failed to fetch flashcards", error);
      message.error("Failed to load flashcards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [deckId]);

  // Handle answer selection
  const handleAnswer = (selectedAnswer: string) => {
    const currentFlashcard = flashcards[currentCardIndex];
    const isCorrect = selectedAnswer === currentFlashcard.answer;

    if (isCorrect) {
      setScore(score + 1);
    }

    // Move to the next card
    if (currentCardIndex + 1 < flashcards.length) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setQuizCompleted(true); // End quiz when all flashcards are answered
    }
  };

  const handleRetryQuiz = () => {
    setScore(0);
    setCurrentCardIndex(0);
    setQuizCompleted(false);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <Spin size="large" />
        <p style={{ marginTop: "16px" }}>Loading quiz...</p>
      </div>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round((score / flashcards.length) * 100);
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Quiz Completed!</h2>
        <p>
          Your score: {score} / {flashcards.length} ({percentage}%)
        </p>
        <Button onClick={handleRetryQuiz}>Retry Quiz</Button>
        <Button style={{ marginLeft: "10px" }} onClick={() => router.push("/decks")}>Back to Decks</Button>
      </div>
    );
  }

  const currentFlashcard = flashcards[currentCardIndex];

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>Question {currentCardIndex + 1} / {flashcards.length}</h2>
      <Card
        style={{
          marginBottom: "20px",
          padding: "20px",
          fontSize: "18px",
          textAlign: "center",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <div>{currentFlashcard.description}</div>
        <div>
          <Button
            type="primary"
            style={{ marginTop: "20px" }}
            onClick={() => handleAnswer(currentFlashcard.answer)}
          >
            {currentFlashcard.answer}
          </Button>
          {currentFlashcard.imageUrl && (
            <div>
              <img
                src={currentFlashcard.imageUrl}
                alt="Question image"
                style={{ marginTop: "20px", maxWidth: "100%" }}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default QuizPage;*/
