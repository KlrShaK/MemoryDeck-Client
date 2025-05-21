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
  DatePicker,
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
  // Add state for field-specific messages
  const [fieldMessages, setFieldMessages] = useState<{
    [key: string]: { type: 'success' | 'error'; message: string } | null;
  }>({});

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

    const updatedUser = {
      username: null,
      name: null,
      birthday: null
    };
    try {
      // If it's the birthday field and we have a valid dayjs object
      if (field === "birthday" && value && dayjs.isDayjs(value)) {
        value = value.format("YYYY-MM-DD");
        updatedUser.birthday = value;
      } else if (field === "name" && value !== user.name) {
        updatedUser.name = value;
      } else if (field === "username" && value !== user.username) {
        updatedUser.username = value;
      }

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
      
      // Show success message under the field
      setFieldMessages(prev => ({
        ...prev,
        [field]: { type: 'success', message: `${field} updated successfully` }
      }));
      
      message.success(`${field} updated successfully`);
      
      // Clear the field message after 3 seconds
      setTimeout(() => {
        setFieldMessages(prev => ({ ...prev, [field]: null }));
      }, 3000);
      
      setEditField(null);
    } catch (err) {
      console.error("Update failed", err);
      
      // Show error message under the field
      setFieldMessages(prev => ({
        ...prev,
        [field]: { type: 'error', message: `Failed to update ${field}` }
      }));
      
      message.error("Failed to update field.");
    }
  };

  const handlePasswordSave = async () => {
      const values = form.getFieldsValue(["oldPassword", "newPassword"]);

      if (!values.oldPassword || !values.newPassword) {
        console.error("Please fill in both password fields");
        message.error("Please fill in both password fields");
        setFieldMessages(prev => ({
          ...prev,
          password: { type: 'error', message: "Please fill in both password fields" }
        }));
        return;
      }
      if (values.oldPassword === values.newPassword) {
        console.error("New password must be different");
        message.error("New password must be different");
        setFieldMessages(prev => ({
          ...prev,
          password: { type: 'error', message: "New password must be different" }
        }));
        return;
      }
      try {
        await apiService.put(`/users/${user?.id}/password`, {
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        });
        
        // Show success message under the password field
        setFieldMessages(prev => ({
          ...prev,
          password: { type: 'success', message: "Password updated successfully" }
        }));
        
        message.success("Password updated");
        form.resetFields(["oldPassword", "newPassword"]);
        
        // Clear the field message after 3 seconds
        setTimeout(() => {
          setFieldMessages(prev => ({ ...prev, password: null }));
        }, 3000);
        
        setEditField(null);
      } catch (err) {
        console.error("Password update failed", err);
        
        // Show error message under the password field
        setFieldMessages(prev => ({
          ...prev,
          password: { type: 'error', message: "Password update failed. Check if your old password is correct." }
        }));
        
        message.error("Password update failed");
      }
  }

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
  const formatDate = (dateValue: string | Date | dayjs.Dayjs | null | undefined): string => {
    if (!dateValue) return "—";
    const date = dayjs(dateValue);
    return date.isValid() ? date.format("DD.MM.YYYY") : "—";
  };

  // Message styles
  const messageStyle = (type: 'success' | 'error') => ({
    color: type === 'success' ? '#2E8049' : '#ff4d4f',
    fontSize: '12px',
    marginTop: '4px',
    marginBottom: '0',
  });

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
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                    {/* Field-specific message */}
                    {fieldMessages[field.name] && (
                      <div style={messageStyle(fieldMessages[field.name]?.type || 'error')}>
                        {fieldMessages[field.name]?.message}
                      </div>
                    )}
                  </div>
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
                <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                  {/* Password-specific message */}
                  {fieldMessages.password && (
                    <div style={messageStyle(fieldMessages.password?.type || 'error')}>
                      {fieldMessages.password?.message}
                    </div>
                  )}
                </div>
              </Col>
              <Col span={6}>
                {editField === "password" ? (
                  <Button
                    type="primary"
                    onClick={() => handlePasswordSave()}
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