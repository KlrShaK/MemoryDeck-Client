"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Spin, message, Button, Typography,Modal,Input, App } from 'antd';
import { useApi } from '@/hooks/useApi';
import { Deck } from '@/types/deck';
import { Flashcard } from '@/types/flashcard';

const { Title, Text } = Typography;

const TOKENS = {
  primary: '#2E8049',
  bg: '#c3fad4',
  cardBg: '#ffffff',
  shadow: '0 4px 12px rgba(0,0,0,0.08)',
  radius: 16,
};

interface QuizDTO {
    id: number,
    timeLimit: number;
}

const DeckSelectionPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  // const { value: id } = useLocalStorage<string>('userId', '');
  const [userId, setUserId] = useState<string | null>(null)
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [timeLimit, setTimeLimit] = useState(30); // Default time limit in seconds
  const [numberOfQuestions, setNumberOfQuestions] = useState(1); // Default nr of questions
  const [deckSize, setDeckSize] = useState(20); // Default nr of questions
  const { message: antMessage } = App.useApp(); // Use the App context instead of direct message use
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchDecks = async () => {
      const cleanUserId = userId.replace(/^"|"$/g, '');
      if (!cleanUserId) {
        message.error("You must be logged in to access this page");
        router.push("/login");
        return;
      }

      try {
        // const deckList = await apiService.get<Deck[]>(`/decks?userId=${cleanUserId}`);
        const deckList = await apiService.get<Deck[]>(`/decks?userId=${userId}`);
        const decksWithFlashcards = await Promise.all(
          deckList.map(async (deck) => {
            try {
              const flashcards = await apiService.get<Flashcard[]>(`/decks/${deck.id}/flashcards`);
              return { ...deck, flashcards };
            } catch {
              return { ...deck, flashcards: [] };
            }
          })
        );
        setDecks(decksWithFlashcards);
      } catch {
        message.error('Failed to load decks.');
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, [userId, apiService, router]);

  const handleDeckSelect = (deckId: string) => {
    setSelectedDeckId(deckId);
  };

  const handleContinue = async () => {
    if (!selectedDeckId) return message.warning('Please select a deck first');
    const selectedDeck = await apiService.get<Deck>(`/decks/${selectedDeckId}`);
    if (selectedDeck.flashcards && selectedDeck.flashcards?.length > 0){
        setDeckSize(selectedDeck.flashcards.length);
    }
    setQuizModalVisible(true);
  };

  const handleStartQuiz = async () => {
    if (!selectedDeckId) {
      antMessage.error('Missing required information');
      return;
    }
    if (!userId) {
        antMessage.error('Invalid user information');
        return;
      }

    try {
      
      // Make sure to convert types to match what backend expects
      const quizStartRequestData = {
        isMultiple: false,
        numberOfQuestions: numberOfQuestions,
        deckId: selectedDeckId,
        timeLimit: timeLimit
      };
      
      const response = await apiService.post<QuizDTO>('/quiz/start', quizStartRequestData);

      
      router.push(`/decks/solo-quiz/play/${response.id}`);
      setQuizModalVisible(false);
      
    } catch (error) {
      console.error('Failed to start quiz:', error);
      antMessage.error('Failed to start quiz. Please try again.');
    } 
  };

  const handleCancel = () => {
    router.push('/decks');
  };

  return (
    <div style={{ background: TOKENS.bg, minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={3} style={{ color: '#215F46', marginBottom: 24 }}>Select a Deck for Quiz</Title>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : decks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#ff0000', fontWeight: 700 }}>
            You have no saved decks yet. Please create one first.
          </div>
        ) : (
          <>
            <Row gutter={[20, 20]}>
              {decks.map((deck) => (
                <Col xs={24} sm={12} md={8} key={deck.id}>
                  <Card
                    hoverable
                    onClick={() => handleDeckSelect(deck.id)}
                    style={{
                      height: 160,
                      borderRadius: TOKENS.radius,
                      boxShadow: TOKENS.shadow,
                      background: TOKENS.cardBg,
                      border: selectedDeckId === deck.id ? `2px solid ${TOKENS.primary}` : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                      <Text strong style={{ fontSize: 16, color: 'black' }}>{deck.title}</Text>
                      <Text type="secondary">Category: {deck.deckCategory}</Text>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {deck.flashcards?.length ? `${deck.flashcards.length} flashcards` : 'No flashcards'}
                      </Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            <div style={{ marginTop: 40, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button
                type="primary"
                onClick={handleContinue}
                disabled={!selectedDeckId}
                style={{ backgroundColor: TOKENS.primary, borderColor: TOKENS.primary }}
              >
                Continue
              </Button>
            </div>

            <Modal
                title="Quiz Settings"
                open={quizModalVisible}
                onOk={handleStartQuiz}
                onCancel={() => setQuizModalVisible(false)}
                okText="Start Quiz"
                // confirmLoading={sendingInvitation}
                okButtonProps={{ 
                style: { backgroundColor: '#285c28', borderColor: '#285c28' }
                }}
            >
                <p style={{ color: "black" }}>Set your solo quiz settings</p>
                <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: "black" }}>
                    Time limit per question (seconds):
                </label>
                <Input
                    type="number"
                    value={timeLimit}
                    onChange={e => setTimeLimit(Number(e.target.value))}
                    min={10}
                    max={120}
                />

                <label style={{ display: 'block', marginTop: '8px', marginBottom: '8px', color: "black" }}>
                    Number of Questions (max. number of flashcards in deck):
                </label>
                <Input
                    type="number"
                    value={numberOfQuestions}
                    onChange={e => setNumberOfQuestions(Number(e.target.value))}
                    min={1}
                    max={deckSize}
                />
                </div>
            </Modal>
          </>
        )}
      </div>
    </div>
  );
};

export default DeckSelectionPage;
