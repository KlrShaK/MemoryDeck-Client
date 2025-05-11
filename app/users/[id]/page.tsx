"use client";

import React, { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Input,
  Typography,
  Form,
  Spin,
  message,
  Row,
  Col,
  Card,
} from "antd";
import dayjs from "dayjs";

const { Title } = Typography;

const UserProfileDisplay = () => {
  const { id } = useParams();
  const router = useRouter();
  const apiService = useApi();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [editField, setEditField] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiService.get<User>(`/users/${id}`);
        setUser(data);
        form.setFieldsValue(data);
      } catch (err) {
        console.error("Failed to fetch user", err);
        message.error("Could not load profile.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchUser();
  }, [id, apiService, form]);

  const handleSave = async (field: string) => {
    if (!user) return;
    const value = form.getFieldValue(field);
    const updatedUser = { ...user, [field]: value };

    try {
      await apiService.put(`/users/${user.id}`, updatedUser);
      const updatedData = await apiService.get<User>(`/users/${user.id}`);
      setUser(updatedData);
      form.setFieldsValue(updatedData);
      message.success(`${field} updated successfully`);
      setEditField(null);
    } catch (err) {
      console.error("Update failed", err);
      message.error("Failed to update field.");
    }
  };

  const handleEditClick = (field: string) => {
    setEditField(field);
  };

  const handleBack = () => router.push("/decks");
  const handleEditPassword = () => router.push(`/users/${id}/editProfile`);

  if (loading || !user)
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <Spin size="large" tip="Loading profile..." />
      </div>
    );

  const fields = [
    { label: "Username", name: "username", editable: true },
    { label: "Name", name: "name", editable: true },
    { label: "Birthday", name: "birthday", editable: true },
    { label: "Creation Date", name: "creationDate", editable: false },
  ];

  return (
    <div style={{ background: "#c3fad4", minHeight: "100vh", padding: 40 }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <Card
          style={{
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 6px 12px rgba(0,0,0,0.1)",
            background: "white",
          }}
        >
          <Title level={2} style={{ textAlign: "center", color: "#215F46" }}>
            User Profile
          </Title>

          <Form form={form} layout="vertical">
            {fields.map((field) => (
              <Row
                key={field.name}
                gutter={16}
                align="middle"
                style={{ marginBottom: 20 }}
              >
                <Col span={6} style={{ color: "#215F46", fontWeight: 600 }}>
                  {field.label}
                </Col>
                <Col span={12}>
                  {field.editable && editField === field.name ? (
                    <Form.Item name={field.name} style={{ margin: 0 }}>
                      <Input type={field.name.includes("date") ? "date" : "text"} />
                    </Form.Item>
                  ) : (
                    <div
                      style={{
                        backgroundColor: "white",
                        padding: "8px 12px",
                        border: "1px solid #ccc",
                        borderRadius: 6,
                        color: "black",
                      }}
                    >
                      {field.name.includes("date")
                        ? dayjs(user[field.name as keyof User] as string).format("YYYY-MM-DD")
                        : user[field.name as keyof User] || "—"}
                    </div>
                  )}
                </Col>
                {field.editable && (
                  <Col span={6}>
                    {editField === field.name ? (
                      <Button
                        type="primary"
                        onClick={() => handleSave(field.name)}
                        style={{ background: "#2E8049", borderColor: "#2E8049" }}
                      >
                        Save
                      </Button>
                    ) : (
                      <Button onClick={() => handleEditClick(field.name)}>Edit</Button>
                    )}
                  </Col>
                )}
              </Row>
            ))}
          </Form>

          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Button onClick={handleBack} style={{ marginRight: 12 }}>
              Back to Home
            </Button>
            <Button
              type="primary"
              onClick={handleEditPassword}
              style={{ background: "#2E8049", borderColor: "#2E8049" }}
            >
              Edit Password
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserProfileDisplay;
