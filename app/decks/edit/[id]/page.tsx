'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Input, Button, Spin } from 'antd';
import React from 'react';

interface Deck {
  id: number;
  title: string;
  content: string;
}

export default function EditDeckPage() {
  const { id } = useParams(); // Get deck ID from URL
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulate loading deck data
  useEffect(() => {
    const simulateFetchDeck = async () => {
      setTimeout(() => {
        const simulatedData: Deck = {
          id: Number(id),
          title: `Deck Title ${id}`,
          content: `Content for deck ${id}`
        };

        setDeck(simulatedData);
        setLoading(false);
      }, 500);
    };

    simulateFetchDeck();
  }, [id]);

  const handleSave = () => {
    console.log('Saving changes:', deck);
    // You can implement the API call here when ready
  };

  const handleDiscard = () => {
    console.log('Discarding changes');
    // Reset the state or navigate back
  };

  if (loading || !deck) {
    return <Spin />;
  }

  return (
    <div style={{ padding: 32 }}>
      <h2>Editing Deck {deck.title}</h2>
      <Input
        style={{ marginBottom: 16 }}
        value={deck.title}
        onChange={(e) => setDeck({ ...deck, title: e.target.value })}
        placeholder="e.g. French Verbs"
      />
      <Input.TextArea
        rows={4}
        value={deck.content}
        onChange={(e) => setDeck({ ...deck, content: e.target.value })}
        placeholder="e.g. List of common French verbs with translations."
      />
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '10px'
        }}
      >
        <Button type="primary" onClick={handleSave}>
          Save
        </Button>
        <Button type="default" onClick={handleDiscard}>
          Discard Changes
        </Button>
      </div>
    </div>
  );
}


/*
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Input, Button, Spin, Form } from 'antd';
import React from 'react';

interface Flashcard {
  id: number;
  title: string;
  content: string;
}

export default function EditFlashcardPage() {
  const { id } = useParams(); // Get flashcard ID from URL
  const [flashcard, setFlashcard] = useState<Flashcard | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the flashcard data when the component mounts
  useEffect(() => {
    const fetchFlashcard = async () => {
      try {
        const res = await fetch(`/api/flashcards/${id}`);
        if (!res.ok) throw new Error("Failed to load flashcard");
        const data = await res.json();
        setFlashcard(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchFlashcard();
  }, [id]);
  
  const handleSave = () => {
    console.log("Saving changes:", flashcard);
    // You'd send `flashcard` to your API here
  };

  const handleDiscard = () => {
    console.log("Discarding changes");
    // You can navigate back to the flashcard list or reset the state
  };

  if (loading || !flashcard) {
    return <Spin />;
  }

  return (
    <div style={{ padding: 32 }}>
      <h2>Edit Flashcard</h2>
      <Form layout="vertical" style={{ marginBottom: 100 }}>
        <Form.Item
          label={<span style={{ color: "#333", fontWeight: 600 }}>Title</span>}
        >
          <Input 
            style={{ marginBottom: 16 }} 
            value={flashcard.title} 
            onChange={e => setFlashcard({ ...flashcard, title: e.target.value })} 
            placeholder="e.g. What is your name?"
          />
        </Form.Item>
        
        <Form.Item
          label={<span style={{ color: "#333", fontWeight: 600 }}>Content</span>}
        >
          <Input.TextArea 
            rows={4} 
            value={flashcard.content} 
            onChange={e => setFlashcard({ ...flashcard, content: e.target.value })} 
            placeholder="e.g. My name is John Doe."
          />
        </Form.Item>
      </Form>

      <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px' }}>
        <Button type="primary" onClick={handleSave}>
          Save
        </Button>
        <Button type="default" onClick={handleDiscard}>
          Discard Changes
        </Button>
      </div>
    </div>
  );
}
*/

