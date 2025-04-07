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

    const handleRegister = async (values: { username: string; name: string; password: string }) => {
        try {
            const response = await apiService.post<User>("/register", {
                username: values.username,
                name: values.name,
                password: values.password,
            });

            if (response.token) {
                setToken(response.token);
                router.push("/decks");
            }
        } catch {
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
