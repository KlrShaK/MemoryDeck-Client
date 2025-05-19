"use client";

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import React from "react";
import Link from "next/link";
// Use Ant Design's components
import { Input } from "antd";

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

  // Add debug console logs to help troubleshoot
  React.useEffect(() => {
    console.log("Current errors:", errors);
  }, [errors]);

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
          <div style={{ marginBottom: "25px", position: "relative" }}>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Username"
              style={{
                ...inputStyle,
                borderColor: errors.username ? "#ff0000" : "#666",
              }}
              required
            />
            {errors.username && (
              <div style={{
                ...errorStyle,
                display: "block", // Force display
                visibility: "visible" // Ensure visibility
              }}>
                {errors.username}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "25px", position: "relative" }}>
            <Input.Password
              value={password}
              onChange={handlePasswordChange}
              placeholder="Password"
              style={{
                borderColor: errors.password ? "#ff0000" : "#666",
                backgroundColor: "transparent",
                fontSize: "18px",
                color: "#222",
                padding: "16px 12px",
                height: "auto",
              }}
              required
            />
            {errors.password && (
              <div style={{
                ...errorStyle,
                display: "block", // Force display
                visibility: "visible" // Ensure visibility
              }}>
                {errors.password}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "25px", position: "relative" }}>
            <Input.Password
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Confirm Password"
              style={{
                borderColor: errors.confirmPassword ? "#ff0000" : "#666",
                backgroundColor: "transparent",
                fontSize: "18px",
                color: "#222",
                padding: "16px 12px",
                height: "auto",
              }}
              required
            />
            {errors.confirmPassword && (
              <div style={{
                ...errorStyle,
                display: "block", // Force display
                visibility: "visible" // Ensure visibility
              }}>
                {errors.confirmPassword}
              </div>
            )}
          </div>

          {errors.general && (
            <div style={{
              ...errorStyle,
              display: "block", // Force display
              visibility: "visible", // Ensure visibility
              marginBottom: "20px",
              fontWeight: "bold"
            }}>
              {errors.general}
            </div>
          )}

          <div style={{ textAlign: "right", marginBottom: "30px" }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                router.push("/login");
              }}
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
              pointerEvents: loading ? 'none' : 'auto',
              marginBottom: "30px"
            }}
            disabled={loading}
          >
            {loading ? "Processing..." : "Create Account"}
          </button>
        </form>
        
        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "14px" }}>
          <Link 
            href="/" 
            style={{ 
              color: "#215F46", 
              textDecoration: "none",
              opacity: 0.8,
              transition: "opacity 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = "1"}
            onMouseOut={(e) => e.currentTarget.style.opacity = "0.8"}
          >
            Go back to Main page
          </Link>
        </div>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px 0",
  border: "none",
  borderBottom: "1.5px solid #666",
  marginBottom: "8px", // Add some space for error messages
  fontSize: "18px",
  color: "#222",
  background: "transparent",
  outline: "none",
};

const errorStyle: React.CSSProperties = {
  color: "#ff0000",
  fontSize: "14px", // Increased from 12px for better visibility
  fontWeight: "500",
  marginTop: "4px",
  marginBottom: "8px",
  textAlign: "left",
  paddingLeft: "2px",
  position: "relative", // Ensure proper stacking context
  zIndex: 10, // Ensure it's above other elements
};

export default Register;
