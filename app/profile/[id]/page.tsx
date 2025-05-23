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
  Card,
  DatePicker,
  Space,
  Avatar,
  Divider,
  Alert,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  LockOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

// Design tokens matching your app's style
const TOKENS = {
  primary: '#2E8049',
  secondary: '#215F46',
  pageBg: '#aef5c4',
  contentBg: '#d4ffdd',
  cardBg: '#ffffff',
  radius: 24,
  shadow: '0 8px 16px rgba(0,0,0,0.12)',
  fontFamily: "'Poppins', sans-serif",
};

const UserProfileDisplay = () => {
  const { id } = useParams();
  const router = useRouter();
  const apiService = useApi();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [editField, setEditField] = useState<string | null>(null);
  const [fieldMessages, setFieldMessages] = useState<{
    [key: string]: { type: 'success' | 'error'; message: string } | null;
  }>({});

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiService.get<User>(`/users/${id}`);
        setUser(data);
        
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
  };

  const handleBack = () => router.push("/decks");

  const formatDate = (dateValue: string | Date | dayjs.Dayjs | null | undefined): string => {
    if (!dateValue) return "—";
    const date = dayjs(dateValue);
    return date.isValid() ? date.format("DD.MM.YYYY") : "—";
  };

  if (loading || !user) {
    return (
      <div style={{ 
        background: TOKENS.pageBg, 
        minHeight: "100vh", 
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: TOKENS.fontFamily 
      }}>
        <div style={{ textAlign: "center" }}>
          <Spin size="large" />
          <Text style={{ display: "block", marginTop: 16, color: TOKENS.secondary }}>
            Loading profile...
          </Text>
        </div>
      </div>
    );
  }

  const ProfileField = ({ 
    label, 
    field, 
    icon, 
    editable = true, 
    isPassword = false 
  }: { 
    label: string; 
    field: keyof User | 'password'; 
    icon: React.ReactNode; 
    editable?: boolean; 
    isPassword?: boolean; 
  }) => {
    const isEditing = editField === field;
    const fieldMessage = fieldMessages[field as string];

    return (
      <Card
        style={{
          marginBottom: 16,
          borderRadius: 16,
          border: isEditing ? `2px solid ${TOKENS.primary}` : '1px solid #e8e8e8',
          boxShadow: isEditing ? '0 4px 12px rgba(46,128,73,0.15)' : '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'all 0.3s ease',
          backgroundColor: '#ffffff'
        }}
        bodyStyle={{ 
          padding: '20px 24px',
          backgroundColor: '#ffffff'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: TOKENS.primary + '15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16
            }}>
              {icon}
            </div>
            
            <div style={{ flex: 1 }}>
              <Text strong style={{ color: '#333333', fontSize: 14, display: 'block' }}>
                {label}
              </Text>
              
              {isEditing ? (
                <div style={{ marginTop: 8 }}>
                  {isPassword ? (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Form.Item name="oldPassword" style={{ margin: 0 }}>
                        <Input.Password
                          placeholder="Current Password"
                          style={{ 
                            backgroundColor: "#ffffff", 
                            borderRadius: 8,
                            border: '1px solid #d9d9d9',
                            color: '#333333'
                          }}
                        />
                      </Form.Item>
                      <Form.Item name="newPassword" style={{ margin: 0 }}>
                        <Input.Password
                          placeholder="New Password"
                          style={{ 
                            backgroundColor: "#ffffff", 
                            borderRadius: 8,
                            border: '1px solid #d9d9d9',
                            color: '#333333'
                          }}
                        />
                      </Form.Item>
                    </Space>
                  ) : (
                    <Form.Item name={field as string} style={{ margin: 0 }}>
                      {field === "birthday" ? (
                        <DatePicker 
                          style={{ 
                            width: '100%',
                            borderRadius: 8,
                            border: '1px solid #d9d9d9',
                            backgroundColor: '#ffffff',
                            color: '#333333'
                          }}
                          format="DD.MM.YYYY"
                          placeholder="Select birthday"
                          popupClassName="light-range-calendar" 
                          disabledDate={(current) => {
                            return current && (current > dayjs().endOf('day') || current < dayjs('1900-01-01'));
                          }}
                        />
                      ) : (
                        <Input
                          style={{
                            borderRadius: 8,
                            border: '1px solid #d9d9d9',
                            backgroundColor: '#ffffff',
                            color: '#333333'
                          }}
                        />
                      )}
                    </Form.Item>
                  )}
                </div>
              ) : (
                <Text style={{ 
                  fontSize: 16, 
                  color: '#333333',
                  marginTop: 4,
                  display: 'block'
                }}>
                  {isPassword ? 
                    "••••••••••" : 
                    field === "creationDate" || field === "birthday" ?
                      formatDate(user[field as keyof User]) :
                      user[field as keyof User] ?? "—"
                  }
                </Text>
              )}

              {fieldMessage && (
                <Alert
                  message={fieldMessage.message}
                  type={fieldMessage.type}
                  showIcon
                  icon={fieldMessage.type === 'success' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                  style={{ 
                    marginTop: 8,
                    fontSize: 12,
                    padding: '4px 8px',
                    borderRadius: 6
                  }}
                />
              )}
            </div>
          </div>

          {editable && (
            <div style={{ marginLeft: 16 }}>
              {isEditing ? (
                <Space>
                  <Button 
                    onClick={() => {
                      setEditField(null);
                      // Reset form field to original value when canceling
                      const formValues = {
                        ...user,
                        birthday: user.birthday ? dayjs(user.birthday) : null
                      };
                      form.setFieldsValue(formValues);
                    }}
                    style={{ borderRadius: 8 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => isPassword ? handlePasswordSave() : handleSave(field as string)}
                    style={{ 
                      background: TOKENS.primary, 
                      borderColor: TOKENS.primary,
                      borderRadius: 8
                    }}
                  >
                    Save
                  </Button>
                </Space>
              ) : (
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => setEditField(field as string)}
                  style={{ 
                    color: TOKENS.primary,
                    borderRadius: 8,
                    border: `1px solid ${TOKENS.primary}20`,
                    backgroundColor: `${TOKENS.primary}10`
                  }}
                >
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div style={{ 
      background: TOKENS.pageBg, 
      minHeight: "100vh", 
      fontFamily: TOKENS.fontFamily 
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        background: TOKENS.contentBg,
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          style={{ 
            marginRight: 16,
            color: TOKENS.secondary,
            fontSize: 16
          }}
        />
        <Title level={3} style={{ margin: 0, color: TOKENS.secondary }}>
          Profile Settings
        </Title>
      </div>

      {/* Main Content */}
      <div style={{
        padding: '40px 20px',
        maxWidth: 800,
        margin: '0 auto'
      }}>
        {/* Profile Header Card */}
        <Card
          style={{
            marginBottom: 32,
            borderRadius: TOKENS.radius,
            boxShadow: TOKENS.shadow,
            background: TOKENS.cardBg,
            textAlign: 'center'
          }}
          bodyStyle={{ padding: '40px 32px' }}
        >
          <Avatar
            size={80}
            icon={<UserOutlined />}
            style={{
              backgroundColor: TOKENS.primary,
              marginBottom: 16,
              boxShadow: '0 4px 12px rgba(46,128,73,0.3)'
            }}
          />
          <Title level={4} style={{ margin: 0, color: TOKENS.secondary }}>
            {user.name || user.username || "User"}
          </Title>
          <Text style={{ color: '#666', fontSize: 14 }}>
            Member since {formatDate(user.creationDate)}
          </Text>
        </Card>

        {/* Profile Fields */}
        <Form form={form} layout="vertical">
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ 
              color: TOKENS.secondary, 
              marginBottom: 16,
              fontSize: 18,
              fontWeight: 600 
            }}>
              Personal Information
            </Title>
            
            <ProfileField
              label="Username"
              field="username"
              icon={<UserOutlined style={{ color: TOKENS.primary }} />}
            />
            
            <ProfileField
              label="Display Name"
              field="name"
              icon={<UserOutlined style={{ color: TOKENS.primary }} />}
            />
            
            <ProfileField
              label="Birthday"
              field="birthday"
              icon={<CalendarOutlined style={{ color: TOKENS.primary }} />}
            />
            
            <ProfileField
              label="Account Created"
              field="creationDate"
              icon={<CalendarOutlined style={{ color: TOKENS.primary }} />}
              editable={false}
            />
          </div>

          <Divider style={{ margin: '32px 0', borderColor: '#000' }} />

          <div>
            <Title level={5} style={{ 
              color: TOKENS.secondary, 
              marginBottom: 16,
              fontSize: 18,
              fontWeight: 600 
            }}>
              Security
            </Title>
            
            <ProfileField
              label="Password"
              field="password"
              icon={<LockOutlined style={{ color: TOKENS.primary }} />}
              isPassword={true}
            />
          </div>
        </Form>

        {/* Footer Actions */}
        <div style={{ 
          marginTop: 40, 
          textAlign: 'center',
          padding: '24px 0'
        }}>
          <Button 
            size="large"
            onClick={handleBack}
            style={{
              borderRadius: 12,
              height: 48,
              padding: '0 32px',
              fontSize: 16,
              fontWeight: 500
            }}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileDisplay;