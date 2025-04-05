"use client";

import React from 'react';
import Link from 'next/link';
import './styles/globals.css'; // Importing global CSS
import { useRouter } from 'next/navigation';

const LandingPage = () => {
  const router = useRouter();

  return (
    <div className="container">
      <header className="header">
        <button className="loginButton button" onClick={() => router.push('/login')}>Log in</button>
      </header>
      <h1 className="title">Memory Deck</h1>
      <p className="description">
        Helping elderly individuals and those with memory loss retain valuable information through interactive flashcards
      </p>
      <div className="buttonContainer">
        <button className="button" onClick={() => router.push('/register')}>Get Started</button>
        <button className="button registerButton" onClick={() => router.push('/register')}>Register</button>
      </div>
      <div className="featureCards">
        <div className="flashcard">
          <h3>Easy to Use</h3>
          <p>Simple and accessible flashcards designed with seniors in mind.</p>
        </div>
        <div className="flashcard">
          <h3>Personalized Content</h3>
          <p>Upload personal memories or important facts to create custom decks.</p>
        </div>
        <div className="flashcard">
          <h3>Engaging & Fun</h3>
          <p>Interactive quizzes and gamified elements to aid memory retention.</p>
        </div>
      </div>
      <footer className="footer">
        <p>&copy; 2025 Memory Deck. All rights reserved.</p>
        <p>
          <a href="/privacy">Privacy Policy</a> |{" "}
          <a href="/terms">Terms of Service</a>
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;


