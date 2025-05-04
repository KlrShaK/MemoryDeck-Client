// FlashcardsPage - Displays flashcards for the specific deck

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { Flashcard } from "@/types/flashcard";
import { Button } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
// import { getApiDomain } from "@/utils/domain";
//import Image from "next/image";
import { Deck } from "@/types/deck";

const FlashcardsPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { id } = useParams();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deck, setDeck] = useState<Deck | null>(null);

  //const apiUrl = getApiDomain();
  const [deckIdAsNumber, setDeckIdAsNumber] = useState<number | null>(null);

  // Parse deck ID from params
  useEffect(() => {
    if (id) {
      const parsedDeckId = Number(id);
      if (!isNaN(parsedDeckId)) {
        setDeckIdAsNumber(parsedDeckId);
      }
    }
  }, [id]);

  // Check if userId is valid
  useEffect(() => {
    const userId = localStorage.getItem("userId")?.replace(/"/g, "");
    if (!userId || isNaN(Number(userId)) || Number(userId) <= 0) {
      router.push("/login");
    }
  }, [router]);

  // Fetch flashcards and deck data
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const userId = localStorage.getItem("userId")?.replace(/"/g, "");
        if (!userId || isNaN(Number(userId))) {
          router.push("/login");
          return;
        }

        const allFlashcards = await apiService.get<Flashcard[]>(`/decks/${deckIdAsNumber}/flashcards`);
        if (!Array.isArray(allFlashcards)) {
          console.error("Invalid response for flashcards");
          setFlashcards([]);
          return;
        }
        setFlashcards(allFlashcards);
      } catch (error) {
        console.error("Error fetching flashcards:", error);
        setFlashcards([]);
      }      
    };

    const fetchDeck = async () => {
      try {
        const fetchedDeck = await apiService.get<Deck>(`/decks/${deckIdAsNumber}`);
        setDeck(fetchedDeck);
      } catch (error) {
        console.error("Error fetching deck", error);
      }      
    };

    if (deckIdAsNumber !== null) {
      fetchCards();
      fetchDeck();
    }
  }, [apiService, deckIdAsNumber, router]);

  const handleEdit = (flashcardId: string | null) => {
    router.push(`/decks/${deckIdAsNumber}/edit/flashcards/${flashcardId}`);
  };

  const handleDelete = async (flashcardId: string) => {
    try {
      await apiService.delete(`/decks/${deckIdAsNumber}/flashcards/${flashcardId}`);
      setFlashcards((prev) => prev.filter((f) => f.id !== flashcardId));
    } catch (error) {
      console.error("Error deleting flashcard:", error);
    }    
  };

  const toggleFlip = (index: number) => {
    setFlippedIndex(flippedIndex === index ? null : index);
  };

  const goToNextFlashcard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlippedIndex(null);
    }
  };

  const goToPreviousFlashcard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlippedIndex(null);
    }
  };

  return (
    <div className="flashcard-container">
      {/* Deck Info Header */}
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#005B33" }}>
          Deck {deck?.id}{deck?.title ? `: ${deck.title}` : ""}
        </h1>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#005B33", marginTop: "10px" }}>
          Category: {deck?.deckCategory}
        </h2>
      </div>

      {/* Flashcard Viewer with Nav Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "40px",
        }}
      >
        <Button onClick={goToPreviousFlashcard} disabled={currentIndex === 0 || flashcards.length === 0}>
          &lt; Previous
        </Button>

        <div
          style={{
            width: "800px",
            height: "550px",
            backgroundColor: "white",
            border: "2px dashed #005B33",
            borderRadius: "15px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "0 20px",
            padding: "20px",
            position: "relative",
            cursor: "pointer"
          }}
          tabIndex={0}
          onClick={() => {
            if (flashcards.length > 0) {
              toggleFlip(currentIndex);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (flashcards.length > 0) {
                toggleFlip(currentIndex);
              }
            }
          }}
        >
          {flashcards.length > 0 ? (
            <>
              {/* Edit + Delete */}
              <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: "10px" }}>
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(flashcards[currentIndex].id);
                  }}
                />
                <Button
                  type="link"
                  icon={<DeleteOutlined />}
                  style={{ color: "#ff4000" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(flashcards[currentIndex].id);
                  }}
                />
              </div>

              {/* Flashcard Front / Back */}
              <div style={{ width: "100%", textAlign: "center", color: "#005B33", marginTop: "30px" }}>
                <h2 style={{ fontSize: "2rem", marginBottom: "5px" }}>
                  {flippedIndex === currentIndex ? "Answer" : "Question"}
                </h2>
                <h3 style={{ fontSize: "1rem", fontWeight: "normal", color: "#005B33" }}>
                  Flashcard {currentIndex + 1} of {flashcards.length}
                </h3>
              </div>

              <div
                style={{
                  textAlign: "center",
                  color: "#005B33",
                  flexGrow: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p style={{ fontSize: "1.2rem", marginBottom: "30px" }}>
                  {flippedIndex === currentIndex
                    ? flashcards[currentIndex].answer
                    : flashcards[currentIndex].description}
                </p>
              </div>
            </>
          ) : (
            <p style={{ color: "#005B33", fontWeight: "bold" }}>No flashcards available</p>
          )}
        </div>

        <Button
          onClick={goToNextFlashcard}
          disabled={currentIndex === flashcards.length - 1 || flashcards.length === 0}
        >
          Next &gt;
        </Button>
      </div>

      {/* Bottom Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        <Button
          type="primary"
          onClick={() => router.push(`/decks/${deckIdAsNumber}/edit/flashcards/createFlashcard`)}
        >
          Add New Flashcard
        </Button>

        <Button type="primary" onClick={() => router.push(`/decks`)}>
          Back to Decks
        </Button>
      </div>
    </div>
  );
};

export default FlashcardsPage;




