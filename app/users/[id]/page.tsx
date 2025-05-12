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
  DatePicker, // Add DatePicker import
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
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const watchedFieldValue = Form.useWatch(editField || "", form);

  // Check validity whenever the field value changes
  useEffect(() => {
    if (editField) {
      const errors = form.getFieldError(editField);
      const isTouched = form.isFieldTouched(editField);
      const hasErrors = errors.length > 0;
      setIsSaveDisabled(!isTouched || hasErrors);
    }
  }, [editField, form, watchedFieldValue]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiService.get<User>(`/users/${id}`);
        setUser(data);
        
        // Convert birthday to dayjs object for the form
        const formValues = {
          ...data,
          birthday: data.birthday ? dayjs(data.birthday) : null
        };
        form.setFieldsValue(formValues);
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
    let value = form.getFieldValue(field);

    // If it's the birthday field and we have a valid dayjs object
    if (field === "birthday" && value && dayjs.isDayjs(value)) {
      value = value.format("YYYY-MM-DD");
    } 
    // For other date fields that might be using native date inputs
    else if (field.includes("date")) {
      value = dayjs(value).format("YYYY-MM-DD");
    }

    const updatedUser = { ...user, [field]: value };

    try {
      await apiService.put(`/users/${user.id}`, updatedUser);
      const updatedData = await apiService.get<User>(`/users/${user.id}`);
      
      // Update the user state with the raw API response
      setUser(updatedData);
      
      // For the form, convert dates to dayjs objects
      const formValues = {
        ...updatedData,
        birthday: updatedData.birthday ? dayjs(updatedData.birthday) : null
      };
      form.setFieldsValue(formValues);
      
      message.success(`${field} updated successfully`);
      setEditField(null);
    } catch (err) {
      console.error("Update failed", err);
      message.error("Failed to update field.");
    }
  };

  const handleBack = () => router.push("/decks");

  if (loading || !user)
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <Spin size="large" tip="Loading profile..." />
      </div>
    );

  const fields: Array<{ label: string; name: keyof User; editable: boolean }> = [
    { label: "Username", name: "username", editable: true },
    { label: "Name", name: "name", editable: true },
    { label: "Birthday", name: "birthday", editable: true },
    { label: "Creation Date", name: "creationDate", editable: false },
  ];
    
  // Helper function to format dates consistently
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return "—";
    const date = dayjs(dateValue);
    return date.isValid() ? date.format("DD.MM.YYYY") : "—";
  };

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
                      {field.name === "birthday" ? (
                        <DatePicker 
                          style={{ 
                            width: '100%', 
                            backgroundColor: 'white', 
                            color: 'black', 
                            borderRadius: 4 
                          }}
                          format="DD.MM.YYYY"
                          placeholder="Select birthday"
                          popupClassName="light-range-calendar" 
                          disabledDate={(current) => {
                            // Can't select dates after today or before 1900
                            return current && (current > dayjs().endOf('day') || current < dayjs('1900-01-01'));
                          }}
                        />
                      ) : (
                        <Input
                          type={field.name.includes("date") ? "date" : "text"}
                          style={{
                            backgroundColor: "white",
                            color: "black",
                            borderRadius: 4,
                          }}
                        />
                      )}
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
                      {field.name === "creationDate" || field.name === "birthday"
                        ? formatDate(user[field.name as keyof User])
                        : user[field.name as keyof User] ?? "—"}
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
                        disabled={isSaveDisabled}
                      >
                        Save
                      </Button>
                    ) : (
                      <Button onClick={() => setEditField(field.name)}>Edit</Button>
                    )}
                  </Col>
                )}
              </Row>
            ))}

            {/* Password update section */}
            <Row gutter={16} align="middle" style={{ marginBottom: 20 }}>
              <Col span={6} style={{ color: "#215F46", fontWeight: 600 }}>
                Password
              </Col>
              <Col span={12}>
                {editField === "password" ? (
                  <>
                    <Form.Item name="oldPassword" style={{ marginBottom: 8 }}>
                      <Input.Password
                        placeholder="Old Password"
                        style={{ backgroundColor: "white", color: "black", borderRadius: 4 }}
                      />
                    </Form.Item>
                    <Form.Item name="newPassword" style={{ margin: 0 }}>
                      <Input.Password
                        placeholder="New Password"
                        style={{ backgroundColor: "white", color: "black", borderRadius: 4 }}
                      />
                    </Form.Item>
                  </>
                ) : (
                  <div
                    style={{
                      backgroundColor: "white",
                      padding: "8px 12px",
                      border: "1px solid #ccc",
                      borderRadius: 6,
                      color: "#999",
                    }}
                  >
                    ••••••••••
                  </div>
                )}
              </Col>
              <Col span={6}>
                {editField === "password" ? (
                  <Button
                    type="primary"
                    onClick={async () => {
                      const values = form.getFieldsValue(["oldPassword", "newPassword"]);
                      if (!values.oldPassword || !values.newPassword) {
                        message.error("Please fill in both password fields");
                        return;
                      }
                      if (values.oldPassword === values.newPassword) {
                        message.error("New password must be different");
                        return;
                      }
                      try {
                        await apiService.put(`/users/${user?.id}/password`, {
                          oldPassword: values.oldPassword,
                          newPassword: values.newPassword,
                        });
                        message.success("Password updated");
                        form.resetFields(["oldPassword", "newPassword"]);
                        setEditField(null);
                      } catch (err) {
                        console.error("Password update failed", err);
                        message.error("Password update failed");
                      }
                    }}
                    style={{ background: "#2E8049", borderColor: "#2E8049" }}
                  >
                    Save
                  </Button>
                ) : (
                  <Button onClick={() => setEditField("password")}>Edit</Button>
                )}
              </Col>
            </Row>
          </Form>
  
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Button onClick={handleBack}>Back to Home</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserProfileDisplay;