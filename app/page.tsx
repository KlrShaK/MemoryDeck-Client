"use client";

import React from "react";
import Link from "next/link";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"], 
});

const LandingPage = () => {
  return (
    <div
      className={poppins.className}
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#c3fad4", // top/bottom bar
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          backgroundColor: "#cffadd",
          padding: "20px 24px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Link href="/login">
          <button
            style={{
              backgroundColor: "#2E8049",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "20px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Log in
          </button>
        </Link>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#aef5c4",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "60px 20px 80px",
        }}
      >
        <div style={{ maxWidth: "1000px", width: "100%", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "68px",
              fontWeight: 600,
              color: "#215F46",
              marginBottom: "14px",
              fontFamily: "inherit", 
            }}
          >
            Memory Deck
          </h1>

          <p
            style={{
              maxWidth: "720px",
              margin: "0 auto 40px",
              fontSize: "20px",
              color: "#425349",
              lineHeight: "1.6",
            }}
          >
            Helping elderly individuals and those with memory loss retain valuable
            information through interactive flashcards.
          </p>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              marginBottom: "42px",
              flexWrap: "wrap",
            }}
          >
            <Link href="/register">
              <button
                style={{
                  backgroundColor: "#2E8049",
                  color: "white",
                  border: "none",
                  padding: "14px 28px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  borderRadius: "24px",
                  cursor: "pointer",
                }}
              >
                Get started
              </button>
            </Link>

            <Link href="/register">
              <button
                style={{
                  backgroundColor: "white",
                  border: "2px solid #2E8049",
                  color: "#2E8049",
                  padding: "14px 28px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  borderRadius: "24px",
                  cursor: "pointer",
                }}
              >
                Register
              </button>
            </Link>
          </div>

          {/* Features Section */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "32px",
            }}
          >
            <div style={featureCardStyle}>
              <h3 style={featureTitleStyle}>Easy to Use</h3>
              <p style={featureTextStyle}>
                Simple and accessible flashcards designed with seniors in mind.
              </p>
            </div>

            <div style={featureCardStyle}>
              <h3 style={featureTitleStyle}>Personalized Content</h3>
              <p style={featureTextStyle}>
                Upload personal memories or important facts to create custom decks.
              </p>
            </div>

            <div style={featureCardStyle}>
              <h3 style={featureTitleStyle}>Engaging & Fun</h3>
              <p style={featureTextStyle}>
                Interactive quizzes and gamified elements to aid memory retention.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          backgroundColor: "#cffadd",
          padding: "20px 24px",
          height: "60px",
        }}
      />
    </div>
  );
};

// Styles for feature cards
const featureCardStyle: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: "24px",
  padding: "32px 28px",
  width: "320px",
  boxShadow: "0 8px 16px rgba(0, 0, 0, 0.18)",
  textAlign: "center",
};

const featureTitleStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "bold",
  marginBottom: "12px",
  color: "#215F46",
};

const featureTextStyle: React.CSSProperties = {
  fontSize: "16px",
  color: "#3e3e3e",
  lineHeight: "1.5",
};

export default LandingPage;
