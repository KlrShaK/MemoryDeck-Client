"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";

type DeckFormValues = {
  title: string;
  deckCategory: string;
  isPublic?: boolean;
  isAiGenerated?: boolean;
  aiPrompt?: string;
  numberOfAICards?: number;
};

const AddDeckPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { value: userId } = useLocalStorage<string>("userId", "");
  const [userIdAsNumber, setUserIdAsNumber] = useState<number | null>(null);

  const [form, setForm] = useState<DeckFormValues>({
    title: "",
    deckCategory: "",
    isPublic: false,
    isAiGenerated: false,
    aiPrompt: "",
    numberOfAICards: 5,
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      const parsed = Number(userId);
      if (!isNaN(parsed)) setUserIdAsNumber(parsed);
      else router.push("/login");
    }
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title || !form.deckCategory) {
      setError("Title and category are required.");
      return;
    }

    if (form.isAiGenerated && (!form.aiPrompt || !form.numberOfAICards)) {
      setError("AI prompt and card count are required when using AI.");
      return;
    }

    try {
      const deckDTO = {
        title: form.title,
        deckCategory: form.deckCategory,
        isPublic: form.isPublic ?? false,
        isAiGenerated: form.isAiGenerated ?? false,
        aiPrompt: form.aiPrompt ?? "",
        numberOfAICards: form.numberOfAICards ?? null,
      };

      await apiService.post(`/decks/addDeck?userId=${userIdAsNumber}`, deckDTO);
      router.push("/decks");
    } catch (err) {
      setError("Failed to add deck.");
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#b3edbc",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Poppins', sans-serif",
        padding: "60px 20px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "48px",
          borderRadius: "24px",
          boxShadow: "0 8px 18px rgba(0,0,0,0.15)",
          width: "100%",
          maxWidth: "560px",
        }}
      >
        <h1
          style={{
            fontSize: "36px",
            fontWeight: 700,
            marginBottom: "40px",
            color: "#215F46",
          }}
        >
          Create a New Deck
        </h1>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={inputStyle}
            required
          />

          <label style={labelStyle}>Deck Category</label>
          <select
            value={form.deckCategory}
            onChange={(e) => setForm({ ...form, deckCategory: e.target.value })}
            style={inputStyle}
            required
          >
            <option value="">Select a category</option>
            {[
              "MOMENTS", "SPORTS", "ANIMALS", "PLACES", "FOODS", "SCIENCE",
              "MATH", "HISTORY", "LANGUAGE", "TECHNOLOGY", "OTHERS", "MIXED",
            ].map((cat) => (
              <option key={cat} value={cat}>
                {cat[0] + cat.slice(1).toLowerCase()}
              </option>
            ))}
          </select>

          <div style={checkboxGroupStyle}>
            <label>
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
              />
              <span style={checkboxLabelStyle}> Public</span>
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.isAiGenerated}
                onChange={(e) =>
                  setForm({ ...form, isAiGenerated: e.target.checked })
                }
              />
              <span style={checkboxLabelStyle}> Generate with AI</span>
            </label>
          </div>

          {form.isAiGenerated && (
            <>
              <label style={labelStyle}>AI Prompt</label>
              <textarea
                value={form.aiPrompt}
                onChange={(e) => setForm({ ...form, aiPrompt: e.target.value })}
                placeholder="Enter prompt for AI to generate cards"
                style={{ ...inputStyle, height: "100px" }}
              />

              <label style={labelStyle}>Number of Cards</label>
              <input
                type="number"
                min={1}
                value={form.numberOfAICards}
                onChange={(e) =>
                  setForm({
                    ...form,
                    numberOfAICards: Number(e.target.value),
                  })
                }
                style={inputStyle}
              />
            </>
          )}

          {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}

          <div style={{ marginTop: "40px", display: "flex", gap: "16px" }}>
            <button type="submit" style={buttonStyle}>
              Save Deck
            </button>
            <button
              type="button"
              onClick={() => router.push("/decks")}
              style={{ ...buttonStyle, backgroundColor: "#ccc", color: "#222" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "500",
  color: "#333",
  marginBottom: "8px",
  display: "block",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  marginBottom: "24px",
  borderRadius: "10px",
  border: "1.5px solid #ccc",
  fontSize: "18px",
  color: "#222", // fix: readable text
  backgroundColor: "#f9f9f9",
  outline: "none",
};

const checkboxGroupStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "24px",
  fontSize: "16px",
};

const checkboxLabelStyle: React.CSSProperties = {
  fontSize: "16px",
  color: "#215F46",
};

const buttonStyle: React.CSSProperties = {
  padding: "14px 28px",
  backgroundColor: "#2E8049",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "18px",
};

export default AddDeckPage;
