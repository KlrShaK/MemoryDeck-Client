"use client";

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Form, Input, Typography } from "antd";

const { Title } = Typography;

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  const { set: setToken } = useLocalStorage<string>("token", "");

  const handleLogin = async (values: { username: string; password: string }) => {
    try {
      const response = await apiService.post<User>("/login", {
        username: values.username,
        password: values.password,
      });

      if (response.token) {
        setToken(response.token);
        router.push("/decks"); // redirect to user dashboard or main page
      }
    } catch (error) {
      form.setFields([
        {
          name: "username",
          errors: ["Login failed. Please check your credentials."],
        },
      ]);
    }
  };

  return (
      <div className="login-container" style={{ maxWidth: 400, margin: "0 auto", paddingTop: 64 }}>
        <Title level={2}>Login</Title>
        <Form form={form} name="login" layout="vertical" size="large" onFinish={handleLogin}>
          <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input placeholder="Enter username" />
          </Form.Item>

          <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Login
            </Button>
          </Form.Item>

          <p style={{ textAlign: "center" }}>
            Don't have an account?{" "}
            <a onClick={() => router.push("/register")}>Register</a>
          </p>
        </Form>
      </div>
  );
};

export default Login;
