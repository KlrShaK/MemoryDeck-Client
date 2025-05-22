"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Spin, message, Button, Typography } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useApi } from '@/hooks/useApi';
import { Deck } from '@/types/deck';
import { Flashcard } from '@/types/flashcard';

const { Title, Text } = Typography;

const TOKENS = {
  primary: '#2E8049',
  pageBg: '#aef5c4',
  contentBg: '#d4ffdd',
  cardBg: '#ffffff',
  shadow: '0 8px 16px rgba(0,0,0,0.12)',
  radius: 24,
  fontFamily: "'Poppins', sans-serif",
};

const DeckSelectionPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [userId, setUserId] = useState<string | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

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
        const deckList = await apiService.get<Deck[]>(`/decks/public`);
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
        message.error('Failed to load public decks.');
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
    <div 
      style={{ 
        background: TOKENS.pageBg, 
        minHeight: '100vh', 
        fontFamily: TOKENS.fontFamily 
      }}
    >
      {/* Back button */}
      <div style={{ padding: '20px 24px 0' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleCancel}
          style={{
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 16px',
            boxShadow: TOKENS.shadow,
          }}
        >
          Back to Decks
        </Button>
      </div>

      {/* Main content */}
      <div 
        style={{ 
          background: TOKENS.contentBg, 
          maxWidth: 1200,
          margin: '20px auto',
          borderRadius: TOKENS.radius,
          padding: '40px 20px',
          boxShadow: TOKENS.shadow,
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Title 
            level={2} 
            style={{ 
              color: '#215F46', 
              marginBottom: 32, 
              textAlign: 'center',
              fontSize: '32px',
              fontWeight: 700
            }}
          >
            Select a Public Deck for Quiz
          </Title>

          <Text 
            style={{ 
              display: 'block',
              textAlign: 'center', 
              fontSize: '18px', 
              color: '#425349',
              marginBottom: 40 
            }}
          >
            Choose from our collection of public flashcard decks to start your quiz
          </Text>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Spin size="large" />
              <p style={{ marginTop: 16, fontSize: 16, color: '#555' }}>
                Loading public decks...
              </p>
            </div>
          ) : decks.length === 0 ? (
            <Card
              style={{
                textAlign: 'center',
                padding: '60px 40px',
                borderRadius: TOKENS.radius,
                boxShadow: TOKENS.shadow,
                background: TOKENS.cardBg,
                maxWidth: 600,
                margin: '0 auto'
              }}
            >
              <Title level={4} style={{ color: '#ff6b6b', marginBottom: 16 }}>
                No Public Decks Available
              </Title>
              <Text style={{ fontSize: 16, color: '#666' }}>
                There are currently no public decks available for quizzes. 
                Please check back later or create your own deck.
              </Text>
              <div style={{ marginTop: 24 }}>
                <Button 
                  type="primary" 
                  onClick={() => router.push('/decks/create')}
                  style={{
                    backgroundColor: TOKENS.primary,
                    borderColor: TOKENS.primary,
                    height: '48px',
                    padding: '0 32px',
                    borderRadius: '24px',
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                >
                  Create Your Own Deck
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <Row gutter={[24, 24]}>
                {decks.map((deck) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={deck.id}>
                    <Card
                      hoverable
                      onClick={() => handleDeckSelect(deck.id)}
                      style={{
                        height: 200,
                        borderRadius: TOKENS.radius,
                        boxShadow: TOKENS.shadow,
                        background: TOKENS.cardBg,
                        border: selectedDeckId === deck.id 
                          ? `3px solid ${TOKENS.primary}` 
                          : '2px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      bodyStyle={{ 
                        padding: '20px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      {/* Selection indicator */}
                      {selectedDeckId === deck.id && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            backgroundColor: TOKENS.primary,
                            borderRadius: '50%',
                            width: 28,
                            height: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1
                          }}
                        >
                          <CheckCircleOutlined style={{ color: 'white', fontSize: 16 }} />
                        </div>
                      )}

                      <div>
                        <Text 
                          strong 
                          style={{ 
                            fontSize: 18, 
                            color: '#215F46',
                            display: 'block',
                            marginBottom: 8,
                            lineHeight: '1.3'
                          }}
                        >
                          {deck.title}
                        </Text>
                        
                        <div
                          style={{
                            backgroundColor: '#f0f8f4',
                            padding: '6px 12px',
                            borderRadius: '12px',
                            display: 'inline-block',
                            marginBottom: 8
                          }}
                        >
                          <Text 
                            style={{ 
                              fontSize: 13, 
                              color: TOKENS.primary,
                              fontWeight: 600
                            }}
                          >
                            {deck.deckCategory}
                          </Text>
                        </div>
                      </div>

                      <div>
                        <Text 
                          style={{ 
                            fontSize: 14, 
                            color: '#666',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <span>
                            📚 {deck.flashcards?.length || 0} cards
                          </span>
                          <span style={{ color: '#52c41a', fontWeight: 600 }}>
                            Public
                          </span>
                        </Text>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Action buttons */}
              <div 
                style={{ 
                  marginTop: 48, 
                  display: 'flex', 
                  justifyContent: 'center',
                  gap: 16 
                }}
              >
                <Button 
                  onClick={handleCancel}
                  style={{
                    height: '48px',
                    padding: '0 32px',
                    borderRadius: '24px',
                    fontSize: '16px',
                    fontWeight: 600,
                    backgroundColor: 'white',
                    borderColor: '#ccc',
                    color: '#666'
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={handleContinue}
                  disabled={!selectedDeckId}
                  style={{ 
                    backgroundColor: TOKENS.primary, 
                    borderColor: TOKENS.primary,
                    height: '48px',
                    padding: '0 32px',
                    borderRadius: '24px',
                    fontSize: '16px',
                    fontWeight: 600,
                    opacity: selectedDeckId ? 1 : 0.6,
                    cursor: selectedDeckId ? 'pointer' : 'not-allowed'
                  }}
                >
                  Continue to Select Players
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeckSelectionPage;