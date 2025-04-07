"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Input, Button, Spin } from 'antd';
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

  // Simulate loading flashcard data 
  useEffect(() => {
    const simulateFetchFlashcard = async () => {
      // Simulate a delay to mimic an API call
      setTimeout(() => {
        // Simulated flashcard data based on the ID
        const simulatedData: Flashcard = {
          id: Number(id),
          title: `Flashcard Title ${id}`,
          content: `Content for flashcard ${id}`
        };
        
        setFlashcard(simulatedData);
        setLoading(false);
      }, 500); // Simulated loading time
    };
  
    simulateFetchFlashcard();
  }, [id]);

  const handleSave = () => {
    console.log("Saving changes:", flashcard);
    // You can implement the API call here when ready
  };

  const handleDiscard = () => {
    console.log("Discarding changes");
    // Reset the state or navigate back
  };

  if (loading || !flashcard) {
    return <Spin />;
  }

  return (
    <div style={{ padding: 32 }}>
      <h2>Edit Flashcard</h2>
      <Input 
        style={{ marginBottom: 16 }} 
        value={flashcard.title} 
        onChange={e => setFlashcard({ ...flashcard, title: e.target.value })} 
        placeholder="e.g. What is your name?"
      />
      <Input.TextArea 
        rows={4} 
        value={flashcard.content} 
        onChange={e => setFlashcard({ ...flashcard, content: e.target.value })} 
        placeholder="e.g. My name is John Doe."
      />
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


/*// app/flashcards/edit/[id]/page.tsx

"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Input, Button, Spin } from 'antd';

interface Flashcard {
  id: number;
  title: string;
  content: string;
}

export default function EditFlashcardPage() {
  const { id } = useParams(); // Get flashcard ID from URL
  const [flashcard, setFlashcard] = useState<Flashcard | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulate loading flashcard data 
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

  if (loading || !flashcard) {
    return <Spin />;
  }

  return (
    <div style={{ padding: 32 }}>
      <h2>Edit Flashcard</h2>
      <Input 
        style={{ marginBottom: 16 }} 
        value={flashcard.title} 
        onChange={e => setFlashcard({ ...flashcard, title: e.target.value })} 
        placeholder="Title"
      />
      <Input.TextArea 
        rows={4} 
        value={flashcard.content} 
        onChange={e => setFlashcard({ ...flashcard, content: e.target.value })} 
        placeholder="Content"
      />
      <Button type="primary" onClick={handleSave} style={{ marginTop: 16 }}>
        Save
      </Button>
    </div>
  );
}*/
