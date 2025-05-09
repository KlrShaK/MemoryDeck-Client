"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Row,
  Col,
  Avatar,
  Dropdown,
  Spin,
  message,
} from "antd";
import { EllipsisOutlined, UserOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";
import { Deck } from "@/types/deck";
import useLocalStorage from "@/hooks/useLocalStorage";

const primaryColor = "#2E8049";
const backgroundColor = "#aef5c4";
const sidebarBackground = "#cffadd";
const contentBackground = "#d4ffdd";
const cardShadow = "0 8px 16px rgba(0, 0, 0, 0.12)";
const fontFamily = "'Poppins', sans-serif";

type GroupedDecks = Record<string, { title: string; flashcards: Flashcard[] }>;
interface Flashcard {
  id: number;
  question: string;
  answer: string;
  questionImageUrl?: string;
  answerImageUrl?: string;
  deckId: number;
  deckTitle: string;
}

const DeckPage = () => {
  const router = useRouter();
  const apiService = useApi();
  const { value: userId } = useLocalStorage<string>("userId", "");
  const [decks, setDecks] = useState<GroupedDecks | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchGroupedDecks = useCallback(async () => {
    if (!userId) return;

    try {
      const deckList = await apiService.get<Deck[]>(`/decks?userId=${userId}`);
      const grouped: GroupedDecks = {};
      for (const deck of deckList) {
        grouped[String(deck.id)] = {
          title: deck.title ?? "Untitled",
          flashcards: [],
        };
        const flashcards = await apiService
          .get<Flashcard[]>(`/decks/${deck.id}/flashcards`)
          .catch((err) => {
            if (err instanceof Error && err.message.includes("404")) {
              return [];
            }
            throw err;
          });
        grouped[String(deck.id)].flashcards = flashcards;
      }
      setDecks(grouped);
    } catch (error) {
      message.error("Failed to load decks.");
      setDecks({});
    }
  }, [userId, apiService]);



    useEffect(() => {
        if (!userId) {
            return;
        }

        (async () => {
            await fetchGroupedDecks();
        })();
    }, [userId, fetchGroupedDecks]);

  const handleDeckClick = (deckId: number) => router.push(`/decks/${deckId}/edit/flashcards`);
  const handleEditDeck = (deckId: number) => router.push(`/decks/${deckId}/edit`);
  const handleDeleteDeck = async (deckId: number) => {
    try {
      await apiService.delete(`/decks/${deckId}`);
      message.success(`Deleted deck #${deckId}`);
      fetchGroupedDecks();
    } catch {
      message.error("Failed to delete deck.");
    }
  };

  const handleCreateClick = () => router.push("/decks/create");
  const handlePerformanceClick = () => {};
  const handleSetReminderClick = () => {};
  const handleQuizClick = () => router.push("/decks/quiz/select-decks");
  const handleVersusClick = () => router.push("/quiz-play");
  const handleTutorialClick = () => router.push("/tutorials");
  const handleProfileClick = () => {
    if (userId) {
      router.push(`/users/${userId}`);
    } else {
      console.warn("User ID not found.");
    }
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchGroupedDecks().finally(() => setLoading(false));
  }, [userId, fetchGroupedDecks]);

  return (
    <div style={{ backgroundColor, minHeight: "100vh", fontFamily }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 24px" }}>
        <Avatar
          size={42}
          icon={<UserOutlined />}
          style={{
            backgroundColor: "#ffffff",
            color: "#666",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
          onClick={handleProfileClick}
        />
      </div>

      <div style={{ display: "flex", padding: "0 20px 40px" }}>
        <div
          style={{
            width: "220px",
            marginRight: "24px",
            backgroundColor: sidebarBackground,
            padding: "16px",
            borderRadius: "16px",
          }}
        >
          <Button
            onClick={handleCreateClick}
            style={{
              width: "100%",
              marginBottom: "24px",
              height: "48px",
              backgroundColor: primaryColor,
              border: "none",
              borderRadius: "24px",
              fontWeight: 600,
              fontSize: "18px",
              color: "white",
            }}
          >
            Create
          </Button>

          <div style={{ borderTop: "1px solid #999", marginBottom: "20px" }}></div>

          <Button onClick={handlePerformanceClick} style={sidebarBtnStyle}>Performance</Button>
          <Button onClick={handleSetReminderClick} style={sidebarBtnStyle}>Set Reminder</Button>

          <div style={{ borderTop: "1px solid #999", marginBottom: "20px" }}></div>

          <h3 style={{ margin: "20px 0", color: "#215F46", fontSize: "18px" }}>Gamemodes</h3>

          <Button onClick={handleQuizClick} style={sidebarBtnStyleFilled}>Start a quiz together!</Button>
          <Button onClick={handleVersusClick} style={sidebarBtnStyleFilled}>Versus Mode</Button>

          <div style={{ position: "fixed", bottom: "20px" }}>
            <Button onClick={handleTutorialClick} style={tutorialBtnStyle}>Tutorial and FAQs</Button>
          </div>
        </div>

        <div style={{ flex: 1, backgroundColor: contentBackground, padding: "24px", borderRadius: "16px" }}>
          <h2 style={{ marginBottom: "28px", color: "#215F46", fontWeight: 700, fontSize: "28px" }}>
            Your Flashcards
          </h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Spin size="large" />
              <p style={{ marginTop: "16px", fontSize: "16px", color: "#555" }}>Loading decks...</p>
            </div>
          ) : decks === null ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ fontSize: "16px", color: "#555" }}>Failed to load decks. Please try again later.</p>
            </div>
          ) : Object.keys(decks).length > 0 ? (
            <Row gutter={[24, 24]}>
              {Object.entries(decks).map(([deckIdStr, { title }]) => {
                const deckId = parseInt(deckIdStr);
                return (
                  <Col xs={24} sm={12} md={8} key={deckId}>
                    <Card
                      style={{
                        height: "150px",
                        borderRadius: "16px",
                        cursor: "pointer",
                        boxShadow: cardShadow,
                        border: "none",
                        transition: "transform 0.2s ease-in-out",
                        fontFamily,
                        backgroundColor: "white",
                      }}
                      onClick={() => handleDeckClick(deckId)}
                      hoverable
                    >
                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                        <div style={{ fontWeight: 600, fontSize: "16px", color: "#222" }}>{title}</div>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <Dropdown
                            menu={{
                              items: [
                                { key: "edit", label: <span style={{ color: "#333" }}>Edit</span> },
                                { key: "delete", label: <span style={{ color: "#333" }}>Delete</span> },
                              ],
                              onClick: (e) => {
                                e.domEvent.stopPropagation();
                                if (e.key === "edit") handleEditDeck(deckId);
                                else if (e.key === "delete") handleDeleteDeck(deckId);
                              },
                            }}
                            trigger={["click"]}
                            placement="bottomRight"
                          >
                            <Button
                              type="text"
                              icon={<EllipsisOutlined style={{ fontSize: "30px", color: "black" }} />}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Dropdown>
                        </div>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <div style={{ textAlign: "center", padding: "160px", color: "#ff0000", fontWeight: 700 }}>
              You have no saved decks yet. To get started, please create decks from the menu.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const sidebarBtnStyle: React.CSSProperties = {
  width: "100%",
  height: "42px",
  marginBottom: "12px",
  backgroundColor: "#f8f8f8",
  border: "none",
  borderRadius: "20px",
  fontWeight: 500,
  fontSize: "15px",
};

const sidebarBtnStyleFilled: React.CSSProperties = {
  ...sidebarBtnStyle,
  backgroundColor: primaryColor,
  color: "white",
};

const tutorialBtnStyle: React.CSSProperties = {
  backgroundColor: "white",
  border: "none",
  fontWeight: "bold",
  borderRadius: "12px",
  padding: "8px 16px",
};

export default DeckPage;
