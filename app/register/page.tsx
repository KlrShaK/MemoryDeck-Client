"use client";

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import React from "react";

const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { set: setToken } = useLocalStorage<string>("token", "");
  const { set: setUserId } = useLocalStorage<string>("userId", "");

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await apiService.post<User>("/register", {
        username,
        name: username, 
        password,
      });

      if (response.token && response.id) {
        setToken(response.token);
        setUserId(String(response.id));
        router.push("/decks");
      }
    } catch {
      setError("Registration failed. Please try again.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#b3edbc",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "20px",
          padding: "50px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            marginBottom: "40px",
            fontWeight: "500",
            color: "#333",
          }}
        >
          Welcome
        </h1>

        <form onSubmit={handleRegister}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            style={inputStyle}
            required
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={inputStyle}
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            style={inputStyle}
            required
          />

          {error && (
            <p style={{ color: "red", fontSize: "15px", marginBottom: "20px" }}>
              {error}
            </p>
          )}

          <div style={{ textAlign: "right", marginBottom: "30px" }}>
            <a
              href="#"
              onClick={() => router.push("/login")}
              style={{
                fontSize: "12px",
                color: "#222",
                textDecoration: "underline",
              }}
            >
              Already have an Account?
            </a>
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "#3d801e",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "20px",
              fontWeight: "500",
            }}
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px 0",
  border: "none",
  borderBottom: "1.5px solid #666",
  marginBottom: "25px",
  fontSize: "18px",
  color: "#222",
  background: "transparent",
  outline: "none",
};

export default Register;
