// your code here for S2 to display a single user profile after having clicked on it
// each user has their own slug /[id] (/1, /2, /3, ...) and is displayed using this file
// try to leverage the component library from antd by utilizing "Card" to display the individual user
// import { Card } from "antd"; // similar to /app/users/page.tsx

"use client";
// For components that need React hooks and browser APIs,
// SSR (server side rendering) has to be disabled.
// Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import React, { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, Typography, Form, Spin, message, Row, Col } from "antd";
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
      await apiService.put(`/users/${user.id}`, {
        ...user,
        [field]: value,
      });
  
      // Re-fetch the updated user data
      const updatedData = await apiService.get<User>(`/users/${user.id}`);
      setUser(updatedData); // Update the state with the newly fetched data
      form.setFieldsValue(updatedData); // Reflect the updated value in the form
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

  if (loading || !user) return <Spin tip="Loading profile..." />;

  const fields = [
    { label: "Username", name: "username", editable: true },
    { label: "Name", name: "name", editable: true },
    { label: "Birthday", name: "birthday", editable: true },
    { label: "Creation Date", name: "creationDate", editable: false },
  ];

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <Title level={1}>User Profile</Title>

      <Form form={form} layout="vertical">
        {fields.map((field) => (
          <Row
            key={field.name}
            gutter={16}
            align="middle"
            style={{ marginBottom: 16 }}
          >
            <Col span={6} style={{ color: "darkgreen", fontWeight: 600 }}>
              {field.label}
            </Col>
            <Col span={12}>
              {field.editable && editField === field.name ? (
                field.name === "birthday" || field.name === "creationDate" ? (
                  <Form.Item
                    name={field.name}
                    label={field.label}
                    rules={[
                      { required: false, message: `Please select ${field.label.toLowerCase()}` },
                    ]}
                  >
                    <Input type="date" />
                  </Form.Item>
                ) : (
                  <Form.Item name={field.name} style={{ margin: 0 }}>
                    <Input />
                  </Form.Item>
                )
              ) : (
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "8px 12px",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    color: "black",
                  }}
                >
                  {field.name === "birthday" || field.name === "creationDate" ? (
                    // Check if the date exists and format it using dayjs
                    dayjs(user[field.name as keyof User] as string).format("YYYY-MM-DD")
                  ) : (
                    user[field.name as keyof User] || "—"
                  )}
                </div>
              )}
            </Col>
            {field.editable && (
              <Col span={6}>
                {editField === field.name ? (
                  <Button type="primary" onClick={() => handleSave(field.name)}>
                    Save
                  </Button>
                ) : (
                  <Button onClick={() => handleEditClick(field.name)}>
                    Edit
                  </Button>
                )}
              </Col>
            )}
          </Row>
        ))}
      </Form>

      <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
        <Button onClick={handleBack}>Back to Home</Button>
        <Button type="primary" onClick={handleEditPassword}>
          Edit Password
        </Button>
      </div>
    </div>
  );
};

export default UserProfileDisplay;

