"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Spin, message, Button, Typography } from 'antd';
import { useApi } from '@/hooks/useApi';
import useLocalStorage from '@/hooks/useLocalStorage';
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

const DeckSelectionPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { value: userId } = useLocalStorage<string>('userId', '');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

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
        const deckList = await apiService.get<Deck[]>(`/decks?userId=${cleanUserId}`);
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

  const handleContinue = () => {
    if (!selectedDeckId) return message.warning('Please select a deck first');
    localStorage.setItem('selected_quiz_deck_id', selectedDeckId);
    router.push('/decks/quiz/overview');
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
                Continue to Select Players
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeckSelectionPage;
