"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Spin, message, Button } from 'antd';
import { useApi } from '@/hooks/useApi';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Deck } from '@/types/deck';
import { Flashcard } from '@/types/flashcard';

// Sample decks for fallback if API fails
const sampleDecks = [
  {
    id: "1",
    title: "Memory Basics",
    deckCategory: "SCIENCE",
    isPublic: true,
    flashcards: Array(5).fill(null).map((_, i) => ({ 
      id: `f${i+1}`, 
      description: `Sample flashcard ${i+1}`,
      answer: `Answer ${i+1}`
    }))
  },
  {
    id: "2",
    title: "Family Photos",
    deckCategory: "MOMENTS",
    isPublic: false,
    flashcards: Array(3).fill(null).map((_, i) => ({ 
      id: `f${i+10}`, 
      description: `Family memory ${i+1}`,
      answer: `Description ${i+1}`
    }))
  },
  {
    id: "3",
    title: "Historical Events",
    deckCategory: "HISTORY",
    isPublic: true,
    flashcards: [] // Empty flashcards array to test "No flashcards" display
  },
  {
    id: "4",
    title: "Medical Terms",
    deckCategory: "SCIENCE",
    isPublic: true,
    flashcards: Array(8).fill(null).map((_, i) => ({ 
      id: `f${i+20}`, 
      description: `Medical term ${i+1}`,
      answer: `Definition ${i+1}`
    }))
  }
];

const DeckSelectionPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  // Fix: Use 'userId' as the key to match other components
  const { value: userId } = useLocalStorage<string>('userId', '');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchDecks = async () => {
      const cleanUserId = userId.replace(/^"|"$/g, '');
      console.log("Cleaned userId:", cleanUserId);

      if (!cleanUserId) {
        message.error("You must be logged in to access this page");
        router.push("/login");
        return;
      }
      try {
        // First, fetch all decks
        const deckList = await apiService.get<Deck[]>(`/decks?userId=${cleanUserId}`);
        
        // Create a copy to avoid mutating the response directly
        const decksWithFlashcards = [...deckList];
        
        // Then, fetch flashcards for each deck
        for (let i = 0; i < decksWithFlashcards.length; i++) {
          try {
            const flashcards = await apiService.get<Flashcard[]>(`/decks/${decksWithFlashcards[i].id}/flashcards`);
            decksWithFlashcards[i].flashcards = flashcards;
          } catch (error) {
            console.error(`Failed to fetch flashcards for deck ${decksWithFlashcards[i].id}:`, error);
            decksWithFlashcards[i].flashcards = [];
          }
        }
        
        setDecks(decksWithFlashcards);
      } catch (error) {
        console.error('Failed to fetch decks:', error);
        message.error('Failed to load decks.');
        setDecks(sampleDecks as unknown as Deck[]);
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
    if (!selectedDeckId) {
      message.warning('Please select a deck first');
      return;
    }
    
    // Store the selected deck ID in localStorage to access it on the next page
    localStorage.setItem('selected_quiz_deck_id', selectedDeckId);
    
    // Navigate to the user selection page
    router.push('/decks/quiz/overview');
  };

  const handleCancel = () => {
    router.push('/decks');
  };

  return (
    <div style={{ backgroundColor: '#ccf0cc', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Select a Deck for Quiz</h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : decks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#ff0000', fontWeight: 700 }}>
            You have no saved decks yet. Please create decks first before starting a quiz.
          </div>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {decks.map((deck) => (
                <Col xs={24} sm={12} md={8} key={deck.id}>
                  <Card
                    style={{
                      height: '150px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      borderColor: selectedDeckId === deck.id ? '#285c28' : undefined,
                      borderWidth: selectedDeckId === deck.id ? '2px' : '1px',
                    }}
                    onClick={() => handleDeckSelect(deck.id)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{deck.title}</div>
                      <div style={{ color: '#666' }}>Category: {deck.deckCategory}</div>
                      <div style={{ color: '#888', fontSize: '14px' }}>
                        {deck.flashcards && deck.flashcards.length > 0 
                          ? `${deck.flashcards.length} flashcards` 
                          : 'No flashcards'}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
            
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                onClick={handleContinue} 
                disabled={!selectedDeckId}
                style={{
                  backgroundColor: '#285c28',
                  borderColor: '#285c28',
                }}
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