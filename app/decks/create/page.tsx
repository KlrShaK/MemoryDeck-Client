/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";

/**
 * Constraints
 *  - AI prompt must be provided when `isAiGenerated` is checked and must have at least 10 chars
 *  - `numberOfAICards` must be between 1‑20 (inclusive)
 *  - Save button is disabled and shows a loading state while the API request is in flight
 */

const MAX_AI_CARDS = 20;

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
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<DeckFormValues>({
    title: "",
    deckCategory: "",
    isPublic: false,
    isAiGenerated: false,
    aiPrompt: "",
    numberOfAICards: 5,
  });
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------------------------------------------ */
  /*                           SIDE‑EFFECTS                             */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (userId) {
      const parsed = Number(userId);
      if (!isNaN(parsed)) setUserIdAsNumber(parsed);
      else router.push("/login");
    }
  }, [userId]);

  /* ------------------------------------------------------------------ */
  /*                           HANDLERS                                 */
  /* ------------------------------------------------------------------ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // extra guard

    setError(null);

    // ------------ client‑side validations --------------------------- //
    if (!form.title.trim() || !form.deckCategory) {
      setError("Title and category are required.");
      return;
    }

    if (form.isAiGenerated) {
      if (!form.aiPrompt || form.aiPrompt.trim().length < 10) {
        setError("AI prompt must be at least 10 characters long.");
        return;
      }
      if (
        form.numberOfAICards === undefined ||
        form.numberOfAICards < 1 ||
        form.numberOfAICards > MAX_AI_CARDS
      ) {
        setError(`Number of cards must be between 1 and ${MAX_AI_CARDS}.`);
        return;
      }
    }

    // start loading UI
    setIsLoading(true);

    try {
      const deckDTO = {
        title: form.title.trim(),
        deckCategory: form.deckCategory,
        isPublic: form.isPublic ?? false,
        isAiGenerated: form.isAiGenerated ?? false,
        aiPrompt: form.aiPrompt?.trim() ?? "",
        numberOfAICards: form.numberOfAICards ?? null,
      };

      await apiService.post(`/decks/addDeck?userId=${userIdAsNumber}`, deckDTO);
      router.push("/decks");
    } catch (err) {
      console.error(err);
      setError("Failed to add deck. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*                              JSX                                   */
  /* ------------------------------------------------------------------ */
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
          position: "relative",
        }}
      >
        {/* -------------------------------- overlay spinner ------------------------------- */}
        {isLoading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,0.7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: "inherit",
              zIndex: 10,
            }}
          >
            <span className="loader" />
          </div>
        )}

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
              "MOMENTS",
              "SPORTS",
              "ANIMALS",
              "PLACES",
              "FOODS",
              "SCIENCE",
              "MATH",
              "HISTORY",
              "LANGUAGE",
              "TECHNOLOGY",
              "OTHERS",
              "MIXED",
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
                onChange={(e) =>
                  setForm({ ...form, isPublic: e.target.checked })
                }
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
                onChange={(e) =>
                  setForm({ ...form, aiPrompt: e.target.value })
                }
                placeholder="Enter prompt for AI to generate cards"
                style={{ ...inputStyle, height: "100px" }}
                required
              />

              <label style={labelStyle}>Number of Cards</label>
              <input
                type="number"
                min={1}
                max={MAX_AI_CARDS}
                value={form.numberOfAICards}
                onChange={(e) =>
                  setForm({
                    ...form,
                    numberOfAICards: Number(e.target.value),
                  })
                }
                style={inputStyle}
                required
              />
            </>
          )}

          {/* ------------------------------ error + helper texts ----------------------------- */}
          {error && (
            <p style={{ color: "red", marginTop: "12px" }}>{error}</p>
          )}
          {isLoading && !error && (
            <p style={{ color: "#215F46", marginTop: "12px" }}>
              Creating deck, please wait…
            </p>
          )}

          <div style={{ marginTop: "40px", display: "flex", gap: "16px" }}>
            <button
              type="submit"
              style={{
                ...buttonStyle,
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
              disabled={isLoading}
            >
              {isLoading ? "Saving…" : "Save Deck"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/decks")}
              style={{
                ...buttonStyle,
                backgroundColor: "#ccc",
                color: "#222",
              }}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*                             STYLES                                 */
/* ------------------------------------------------------------------ */
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
  color: "#222",
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
