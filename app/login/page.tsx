"use client";

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import React from "react";
import { Input } from "antd";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { set: setToken } = useLocalStorage<string>("token", "");
  const { set: setUserId } = useLocalStorage<string>("userId", "");

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<{
    username?: string;
    password?: string;
    general?: string;
  }>({});

  // Validation functions
  const validateUsername = (value: string) => {
    if (!value) return "Username is required";
    if (value.length <= 5) return "Username must be larger than 5 characters";
    if (!/^[a-zA-Z0-9]+$/.test(value)) return "Username must contain only letters and numbers";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  // Handle input changes with validation
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    
    const error = validateUsername(value);
    setErrors(prev => ({ ...prev, username: error }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    const error = validatePassword(value);
    setErrors(prev => ({ ...prev, password: error }));
  };

  const validateForm = () => {
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    
    setErrors({
      username: usernameError,
      password: passwordError
    });
    
    return !usernameError && !passwordError;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous general errors
    setErrors(prev => ({ ...prev, general: "" }));
    
    // Validate all fields before submitting
    if (!validateForm()) {
      return;
    }

    try {
      const response = await apiService.post<User>("/login", {
        username,
        password,
      });

      if (response.token && response.id) {
        setToken(response.token);
        setUserId(response.id);
        router.push("/decks");
      }
    } catch {
      setErrors(prev => ({ 
        ...prev, 
        general: "Incorrect username or password" 
      }));
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
          padding: "60px 50px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
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

        <form onSubmit={handleLogin}>
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
            <div style={{ position: "relative" }}>
              <Input.Password
                value={password}
                onChange={handlePasswordChange}
                placeholder="Password"
                style={{
                  ...inputStyle,
                  borderColor: errors.password ? "red" : "#666",
                  marginBottom: "5px",
                }}
                required
                iconRender={visible => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              />
            </div>
            {errors.password && (
              <p style={errorStyle}>{errors.password}</p>
            )}
          </div>

          {errors.general && (
            <p style={{ ...errorStyle, textAlign: "center", marginTop: "10px" }}>
              {errors.general}
            </p>
          )}

          <div style={{ textAlign: "right", marginTop: "10px", marginBottom: "30px" }}>
            <a
              href="#"
              onClick={() => router.push("/register")}
              style={{
                fontSize: "13px",
                color: "#222",
                textDecoration: "underline",
              }}
            >
              Create an Account?
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
            Login
          </button>
        </form>

        <div style={{ marginTop: "35px", textAlign: "center" }}>
          <a
            href="#"
            onClick={() => router.push("/")}
            style={{
              fontSize: "13px",
              color: "#555",
              textDecoration: "none",
            }}
          >
            Go back to Main page
          </a>
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

export default Login;
