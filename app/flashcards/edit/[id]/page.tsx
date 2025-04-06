// app/flashcards/edit/[id]/page.tsx

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
}
