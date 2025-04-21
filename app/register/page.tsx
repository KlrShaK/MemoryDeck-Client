"use client";

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Form, Input, Typography } from "antd";

const { Title } = Typography;

const Register: React.FC = () => {
    const [form] = Form.useForm();
    const apiService = useApi();
    const router = useRouter();
    const { set: setToken } = useLocalStorage<string>("token", "");

    // In your register component
const handleRegister = async (values: { username: string; name: string; password: string }) => {
    try {
      // For testing without backend
      console.log("Registration values:", values);
      
      // Instead of API call, use localStorage to simulate registration
      const user = {
        id: Math.random().toString(36).substring(2, 9), // Generate random ID
        username: values.username,
        name: values.name,
        token: "test-token-" + Math.random().toString(36).substring(2, 9),
        status: "ONLINE"
      };
      
      // Store user in localStorage
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", user.token);
      localStorage.setItem("user_id", user.id);
      
      // Show success message
      
      
      // Redirect to decks page
      router.push("/decks");
    } catch (error) {
      console.error("Registration error:", error);
      form.setFields([
        {
          name: "username",
          errors: ["Registration failed. Please try again later."],
        },
      ]);
    }
  };

    return (
        <div className="register-container" style={{ maxWidth: 400, margin: "0 auto", paddingTop: 64 }}>
            <Title level={2}>Register</Title>
            <Form
                form={form}
                name="register"
                layout="vertical"
                size="large"
                onFinish={handleRegister}
            >
                <Form.Item
                    name="name"
                    label="Name"
                    rules={[{ required: true, message: "Please enter your name." }]}
                >
                    <Input placeholder="Jane Doe" />
                </Form.Item>

                <Form.Item
                    name="username"
                    label="Username"
                    rules={[{ required: true, message: "Please enter a username." }]}
                >
                    <Input placeholder="janedoe" />
                </Form.Item>

                <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                        { required: true, message: "Please enter a password." },
                        {
                            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,}$/,
                            message: "Must be 8+ chars, include upper & lower case, number/symbol.",
                        },
                    ]}
                >
                    <Input.Password placeholder="••••••••" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        Create Account
                    </Button>
                </Form.Item>

                <p style={{ textAlign: "center" }}>
                    Already have an account?{" "}
                    <a onClick={() => router.push("/login")}>Login</a>
                </p>
            </Form>
        </div>
    );
};

export default Register;
