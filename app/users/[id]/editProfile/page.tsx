"use client";

import React, { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import { useParams, useRouter } from "next/navigation";
import { Spin, Input, Button, Form, message, Typography } from "antd";

const { Title, Text } = Typography;

const EditUserProfilePage = () => {
  const { id } = useParams();
  const router = useRouter();
  const apiService = useApi();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [updateFailed, setUpdateFailed] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        const user = await apiService.get<User>(`/users/${id}`);
        setUser(user);
      } catch (err) {
        console.error("Error fetching user:", err);
        message.error("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, apiService, form]);

  const handleUpdate = async (values: any) => {
    if (!id || !user) return;
  
    // Reset status states
    setPasswordUpdated(false);
    setUpdateFailed(false);
  
    // Validate oldPassword and newPassword are provided
    if (!values.oldPassword) {
      message.error("Please enter your old password.");
      setUpdateFailed(true);
      return;
    }
  
    if (!values.newPassword) {
      message.error("Please enter your new password.");
      setUpdateFailed(true);
      return;
    }
  
    // Validate old password is correct
    if (values.oldPassword !== user.password) {
      message.error("Old password is incorrect.");
      setUpdateFailed(true);
      return;
    }
  
    // Validate new password is different from old
    if (values.newPassword === values.oldPassword) {
      message.error("New password must be different from the old password.");
      setUpdateFailed(true);
      return;
    }
  
    try {
      // Create the updatedUserDTO with all the necessary fields
      const updatedUserDTO = {
        name: user.name, // Keep the name the same if not updating it
        username: user.username,
        password: values.newPassword, // Update password
        birthday: user.birthday, // Keep the birthday the same if not updating it
      };
  
      // Send the PUT request with the updatedUserDTO
      await apiService.put(`/users/${id}`, updatedUserDTO);
  
      // Update the user state with the new password
      setUser({ ...user, password: values.newPassword });
  
      // Reset the form fields
      form.resetFields(["oldPassword", "newPassword"]);
  
      // Set success message
      setPasswordUpdated(true);
      setUpdateFailed(false);
    } catch (error: any) {
      console.error("Update failed:", error);
      message.error("Failed to update password");
      setPasswordUpdated(false);
      setUpdateFailed(true);
    }
  };
  

  const goHome = () => router.push("/decks");

  if (loading || !user) return <Spin tip="Loading user profile..." />;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <Title level={2}>Update Password</Title>

      <Form
        layout="vertical"
        form={form}
        onFinish={handleUpdate}
      >
        <Form.Item 
          label={<span style={{ fontWeight: "bold", color: "#006400" }}>Old Password</span>}
          name="oldPassword"
          rules={[{ required: true, message: "Please enter your old password" }]}
        >
          <Input.Password style={{ backgroundColor: "white", borderRadius: "2px", color: "black" }} />
        </Form.Item>

        <Form.Item 
          label={<span style={{ fontWeight: "bold", color: "#006400" }}>New Password</span>}
          name="newPassword"
          rules={[{ required: true, message: "Please enter your new password" }]}
        >
          <Input.Password style={{ backgroundColor: "white", borderRadius: "2px", color: "black" }} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
            Update Password
          </Button>
          <Button onClick={goHome}>Go Back to Home Page</Button>
        </Form.Item>
        
        {passwordUpdated && (
          <Text type="success" style={{ display: "block", marginTop: 16, fontSize: "16px" }}>
            Password has been successfully updated!
          </Text>
        )}
        
        {updateFailed && (
          <Text type="danger" style={{ display: "block", marginTop: 16, fontSize: "16px" }}>
            Password update failed. Please try again.
          </Text>
        )}
      </Form>
    </div>
  );
};

export default EditUserProfilePage;