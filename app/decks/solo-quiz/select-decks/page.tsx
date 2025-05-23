"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Spin, Button, Typography, Modal, Input, App, Alert } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, PlayCircleOutlined, WarningOutlined } from '@ant-design/icons';
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

interface QuizDTO {
  id: number;
  timeLimit: number;
}

const DeckSelectionPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [userId, setUserId] = useState<string | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [timeLimit, setTimeLimit] = useState(30);
  const [numberOfQuestions, setNumberOfQuestions] = useState(1);
  const [deckSize, setDeckSize] = useState(20);
  const { message: antMessage } = App.useApp();

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
        antMessage.error("You must be logged in to access this page");
        router.push("/login");
        return;
      }

      try {
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
        antMessage.error('Failed to load decks.');
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, [userId, apiService, router, antMessage]);

  const handleDeckSelect = (deckId: string) => {
    const selectedDeck = decks.find(deck => deck.id === deckId);
    
    // Check if deck has flashcards before allowing selection
    if (!selectedDeck?.flashcards || selectedDeck.flashcards.length === 0) {
      antMessage.warning('This deck is empty. Please add flashcards before starting a quiz.');
      return;
    }
    
    setSelectedDeckId(deckId);
  };

  const handleContinue = async () => {
    if (!selectedDeckId) return antMessage.warning('Please select a deck first');
    
    try {
      const selectedDeck = await apiService.get<Deck>(`/decks/${selectedDeckId}`);
      
      // Double-check that deck has flashcards
      if (!selectedDeck.flashcards || selectedDeck.flashcards.length === 0) {
        antMessage.error('Cannot start quiz: This deck has no flashcards. Please add some flashcards first.');
        setSelectedDeckId(null); // Deselect the deck
        return;
      }
      
      setDeckSize(selectedDeck.flashcards.length);
      setNumberOfQuestions(Math.min(numberOfQuestions, selectedDeck.flashcards.length));
      setQuizModalVisible(true);
    } catch {
      antMessage.error('Failed to load deck details.');
    }
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

    // Final validation before starting quiz
    const selectedDeck = decks.find(deck => deck.id === selectedDeckId);
    if (!selectedDeck?.flashcards || selectedDeck.flashcards.length === 0) {
      antMessage.error('Cannot start quiz: Selected deck has no flashcards.');
      setQuizModalVisible(false);
      setSelectedDeckId(null);
      return;
    }

    if (numberOfQuestions > selectedDeck.flashcards.length) {
      antMessage.error('Number of questions cannot exceed the number of flashcards in the deck.');
      return;
    }

    try {
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

  // Filter decks to show which ones have flashcards
  const decksWithCards = decks.filter(deck => deck.flashcards && deck.flashcards.length > 0);
  const emptyDecks = decks.filter(deck => !deck.flashcards || deck.flashcards.length === 0);

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
            Select a Deck for Solo Quiz
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
            Choose from your personal flashcard decks to start practicing
          </Text>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Spin size="large" />
              <p style={{ marginTop: 16, fontSize: 16, color: '#555' }}>
                Loading your decks...
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
                No Decks Available
              </Title>
              <Text style={{ fontSize: 16, color: '#666' }}>
                You don&apos;t have any saved decks yet. Create your first deck to start practicing with solo quizzes.
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
                  Create Your First Deck
                </Button>
              </div>
            </Card>
          ) : decksWithCards.length === 0 ? (
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
              <WarningOutlined style={{ fontSize: 48, color: '#fa8c16', marginBottom: 16 }} />
              <Title level={4} style={{ color: '#fa8c16', marginBottom: 16 }}>
                No Quiz-Ready Decks
              </Title>
              <Text style={{ fontSize: 16, color: '#666', marginBottom: 16 }}>
                All your decks are empty. You need to add flashcards to your decks before starting a quiz.
              </Text>
              <Alert
                message="Tip"
                description="Each deck needs at least one flashcard to be used for quizzes. Go to your deck editor and add some flashcards!"
                type="info"
                showIcon
                style={{ marginBottom: 24, textAlign: 'left' }}
              />
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                <Button 
                  onClick={() => router.push('/decks')}
                  style={{
                    height: '48px',
                    padding: '0 32px',
                    borderRadius: '24px',
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                >
                  Go to My Decks
                </Button>
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
                  Create New Deck
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {/* Show warning if there are empty decks */}
              {emptyDecks.length > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  closable
                  style={{ marginBottom: 24 }}  
                  message={
                    <span style={{ color: '#000' }}>
                      Some decks are empty
                    </span>
                  }
                  description={
                    <span style={{ color: '#000' }}>
                      {`${emptyDecks.length} of your decks have no flashcards and cannot be used for quizzes. Only decks with flashcards are shown below.`}
                    </span>
                  }
                />
              )}

              <Row gutter={[24, 24]}>
                {decksWithCards.map((deck) => (
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
                          <span style={{ color: '#52c41a', fontWeight: 600 }}>
                            📚 {deck.flashcards?.length || 0} cards
                          </span>
                          <span style={{ color: deck.isPublic ? '#52c41a' : '#1890ff', fontWeight: 600 }}>
                            {deck.isPublic ? 'Public' : 'Private'}
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
                  icon={<PlayCircleOutlined />}
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
                  Start Solo Quiz
                </Button>
              </div>

              {/* Quiz Settings Modal */}
              <Modal
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PlayCircleOutlined style={{ color: TOKENS.primary }} />
                    <span style={{ color: '#215F46' }}>Solo Quiz Settings</span>
                  </div>
                }
                open={quizModalVisible}
                onOk={handleStartQuiz}
                onCancel={() => setQuizModalVisible(false)}
                okText="Start Quiz"
                cancelText="Cancel"
                okButtonProps={{ 
                  style: { 
                    backgroundColor: TOKENS.primary, 
                    borderColor: TOKENS.primary,
                    height: '40px',
                    borderRadius: '8px',
                    fontWeight: 600
                  }
                }}
                cancelButtonProps={{
                  style: {
                    height: '40px',
                    borderRadius: '8px'
                  }
                }}
                width={500}
                styles={{
                  mask: { backgroundColor: 'rgba(0, 0, 0, 0.45)' },
                  content: { backgroundColor: '#ffffff' },
                  header: { backgroundColor: '#ffffff' },
                  body: { backgroundColor: '#ffffff' },
                }}
              >
                <div style={{ padding: '16px 0' }}>
                  <Text style={{ color: '#000', fontSize: 16, display: 'block', marginBottom: 24 }}>
                    Configure your solo quiz settings before starting
                  </Text>
                  
                  <div style={{ marginBottom: '24px' }}>
                    <Text style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: '#215F46', 
                      fontWeight: 600,
                      fontSize: 15
                    }}>
                      Total quiz time limit (seconds):
                    </Text>
                    <Input
                      type="number"
                      value={timeLimit}
                      onChange={e => setTimeLimit(Number(e.target.value))}
                      min={10}
                      max={300}
                      size="large"
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        border: '1px solid #d9d9d9',
                        borderRadius: '8px'
                      }}
                    />
                    <Text style={{ 
                      display: 'block', 
                      marginTop: '6px', 
                      color: '#666', 
                      fontSize: 12 
                    }}>
                      Total time for the entire quiz (10-300 seconds)
                    </Text>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <Text style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: '#215F46', 
                      fontWeight: 600,
                      fontSize: 15
                    }}>
                      Number of questions:
                    </Text>
                    <Input
                      type="number"
                      value={numberOfQuestions}
                      onChange={e => setNumberOfQuestions(Math.min(Number(e.target.value), deckSize))}
                      min={1}
                      max={deckSize}
                      size="large"
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        border: '1px solid #d9d9d9',
                        borderRadius: '8px'
                      }}
                    />
                    <Text style={{ 
                      display: 'block', 
                      marginTop: '6px', 
                      color: '#666', 
                      fontSize: 12 
                    }}>
                      Maximum available: {deckSize} questions from this deck
                    </Text>
                  </div>

                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: 16, 
                    borderRadius: 8, 
                    border: '1px solid #e9ecef',
                    marginTop: 16
                  }}>
                    <Text style={{ color: '#666', fontSize: 14 }}>
                      <strong>Quiz Summary:</strong> You&apos;ll answer {numberOfQuestions} question{numberOfQuestions !== 1 ? 's' : ''} 
                      within {timeLimit} seconds. Total estimated time per question: {Math.ceil(timeLimit / numberOfQuestions)} seconds.
                    </Text>
                  </div>
                </div>
              </Modal>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeckSelectionPage;