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
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  // Validation functions
  const validateUsername = (value: string) => {
    if (!value) return "Username is required";
    if (value.length <= 5) return "Username must be larger than 5 characters";
    if (!/^[a-zA-Z0-9]+$/.test(value)) return "Username may not contain special characters";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const validateConfirmPassword = (value: string) => {
    if (!value) return "Please confirm your password";
    if (value !== password) return "Passwords do not match";
    return "";
  };

  // Handle input changes with validation
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    
    // Clear any existing username error when user starts typing again
    if (errors.username?.includes("not unique") || errors.username?.includes("already taken")) {
      setErrors(prev => ({ ...prev, username: validateUsername(value) }));
    } else {
      const error = validateUsername(value);
      setErrors(prev => ({ ...prev, username: error }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    const error = validatePassword(value);
    setErrors(prev => ({ ...prev, password: error }));
    
    // Also validate confirm password if it's already been entered
    if (confirmPassword) {
      const confirmError = value !== confirmPassword ? "Passwords do not match" : "";
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    const error = validateConfirmPassword(value);
    setErrors(prev => ({ ...prev, confirmPassword: error }));
  };

  const validateForm = () => {
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);
    
    setErrors({
      username: usernameError,
      password: passwordError,
      confirmPassword: confirmPasswordError
    });
    
    return !usernameError && !passwordError && !confirmPasswordError;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submitting
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.post<User>("/register", {
        username,
        name: username, 
        password,
      });

      if (response.token && response.id) {
        setToken(response.token);
        setUserId(response.id);
        router.push("/decks");
      }
    } catch (error: unknown) {
      console.error("Registration error:", error);
      
      // Check if this is a conflict error (409) which indicates username already exists
      const errorObj = error as { response?: { status?: number } };
      if (errorObj?.response?.status === 409) {
        setErrors(prev => ({ 
          ...prev, 
          username: "Username not unique. Please choose a different name." 
        }));
      } else {
        setErrors(prev => ({ ...prev, general: "Registration failed. Please try again." }));
      }
    } finally {
      setLoading(false);
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
          <div style={{ marginBottom: "15px", position: "relative" }}>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Username"
              style={{
                ...inputStyle,
                borderColor: errors.username ? "red" : "#666",
                marginBottom: "5px"
              }}
              required
            />
            {errors.username && (
              <p style={errorStyle}>{errors.username}</p>
            )}
          </div>

          <div style={{ marginBottom: "15px", position: "relative" }}>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Password"
              style={{
                ...inputStyle,
                borderColor: errors.password ? "red" : "#666",
                marginBottom: "5px"
              }}
              required
            />
            {errors.password && (
              <p style={errorStyle}>{errors.password}</p>
            )}
          </div>

          <div style={{ marginBottom: "15px", position: "relative" }}>
            <input
              type="password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Confirm Password"
              style={{
                ...inputStyle,
                borderColor: errors.confirmPassword ? "red" : "#666",
                marginBottom: "5px"
              }}
              required
            />
            {errors.confirmPassword && (
              <p style={errorStyle}>{errors.confirmPassword}</p>
            )}
          </div>

          {errors.general && (
            <p style={errorStyle}>{errors.general}</p>
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
              opacity: loading ? 0.6 : 1,
              pointerEvents: loading ? 'none' : 'auto'
            }}
            disabled={loading}
          >
            {loading ? "Processing..." : "Create Account"}
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
  marginBottom: "0",
  fontSize: "18px",
  color: "#222",
  background: "transparent",
  outline: "none",
};

const errorStyle: React.CSSProperties = {
  color: "red",
  fontSize: "12px",
  marginTop: "2px",
  marginBottom: "0",
  textAlign: "left",
  paddingLeft: "2px",
};

export default Register;
