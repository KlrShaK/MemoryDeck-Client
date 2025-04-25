// Edit specific flashcard within the deck
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, Form, Input, Button, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { Flashcard } from "@/types/flashcard";
import { useApi } from "@/hooks/useApi";
import type { UploadChangeParam } from "antd/es/upload";
import type { UploadFile } from "antd/es/upload/interface";
import { getApiDomain } from "@/utils/domain";
import Image from "next/image";

const EditFlashcardPage: React.FC = () => {
  const router = useRouter();
  const { id, flashcardId } = useParams();
  const apiService = useApi();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>(['', '', '']);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleWrongAnswerChange = (index: number, value: string) => {
    const newAnswers = [...wrongAnswers];
    newAnswers[index] = value;
    setWrongAnswers(newAnswers);
  };

  const handleImageChange = async ({ file, fileList }: UploadChangeParam<UploadFile>) => {
    setFileList(fileList);

    if (file.status === "removed") {
      setImageUrl(null); // Clear image URL when removing
      return;
    }

    if (file.originFileObj) {
      try {
        const uploadedImageUrl = await apiService.uploadImage("/flashcards/upload-image", file.originFileObj);
        setImageUrl(uploadedImageUrl);
        message.success("Image uploaded successfully!");
      } catch {
        message.error("Image upload failed.");
        setFileList([]); // Clear the failed file
      }
    }
  };

  useEffect(() => {
    if (isNaN(Number(flashcardId))) {
      message.error("Invalid flashcard ID");
      router.push("/flashcards");
      return;
    }

    const fetchFlashcard = async () => {
      try {
        const flashcard = await apiService.get<Flashcard>(`/flashcards/${flashcardId}`);
        form.setFieldsValue({
          description: flashcard?.description,
          answer: flashcard?.answer,
          date: flashcard?.date, // if needed (date handling)
        });

        // Initialize wrongAnswers state
        setWrongAnswers([
          flashcard?.wrongAnswers?.[0] || '',
          flashcard?.wrongAnswers?.[1] || '',
          flashcard?.wrongAnswers?.[2] || ''
        ]);

        // Set the image URL if available
        if (flashcard?.imageUrl) {
          setImageUrl(flashcard.imageUrl);
          setFileList([{ uid: '-1', name: 'image.jpg', status: 'done', url: flashcard.imageUrl }]);
        }
      } catch {
        message.error("Failed to fetch flashcard data");
        router.push("/flashcards");
      }
    };

    fetchFlashcard();
  }, [flashcardId, apiService, form, router]);

  const handleSubmit = async (formValues: Flashcard) => {
    setLoading(true);
    try {
      if (wrongAnswers.filter(a => a.trim()).length === 0) {
        message.error("Please provide at least one wrong answer.");
        setLoading(false);
        return;
      }

      let finalImageUrl = imageUrl;

      if (fileList.length > 0 && fileList[0].originFileObj) {
        try {
          finalImageUrl = await apiService.uploadImage("/flashcards/upload-image", fileList[0].originFileObj);
        } catch {
          message.error("Image upload failed. Please try again.");
          return;
        }
      } else if (fileList.length === 0) {
        // If no file, ensure the image URL is null
        finalImageUrl = null;
      }

      const flashcardData = {
        ...formValues,
        wrongAnswers: wrongAnswers.filter(a => a.trim()), // inject into submitted object
        imageUrl: finalImageUrl, // Include the final image URL
      };

      await apiService.put(`/flashcards/${flashcardId}`, flashcardData);
      message.success("Flashcard updated successfully!");
      router.push(`/decks/${id}/edit`); // go back to flashcard list
    } catch (error) {
      message.error("Failed to update flashcard");
      console.error("Update error:", error);
    } finally {
      setLoading(false);
    }
  };

  // const handleDeleteImage = async () => {
  //   if (imageUrl) {
  //     try {
  //       await apiService.delete(`/flashcards/delete-image?imageUrl=${encodeURIComponent(imageUrl)}`);
  //       setImageUrl(null);
  //       setFileList([]);
  //       message.success("Image removed successfully");
  //     } catch {
  //       message.error("Failed to remove image.");
  //     }
  //   }
  // };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
      <Card title={`Update Flashcard`} style={{ width: 400 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) =>
            handleSubmit({
              ...values,
              wrongAnswers: wrongAnswers.filter(a => a.trim()) // inject into submitted object
            })
          }
        >
          <Form.Item
            label="Question"
            name="description"
            rules={[{ required: true, message: "Please enter a question" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Correct Answer"
            name="answer"
            rules={[{ required: true, message: "Please enter a correct answer" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Wrong Answers (at least 1 required)" required>
            {['First', 'Second', 'Third'].map((label, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                <Input
                  placeholder={`${label} Wrong Answer`}
                  value={wrongAnswers[index]}
                  onChange={(e) => handleWrongAnswerChange(index, e.target.value)}
                />
              </div>
            ))}
            <span style={{ color: "red" }}>*</span>
          </Form.Item>

          <Form.Item label="Date" name="date">
            <Input type="date" />
          </Form.Item>

          <Form.Item label="Image">
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt="Flashcard"
                  unoptimized={true}
                  width={80}
                  height={80}
                  style={{ borderRadius: "5px", objectFit: "cover" }}
                />
              )}
              <Upload
                fileList={fileList}
                beforeUpload={() => false}
                onChange={handleImageChange}
                listType="text"
                onRemove={() => {
                  setFileList([]);
                  setImageUrl(null);
                }}
              >
                {fileList.length >= 1 ? null : (
                  <Button icon={<UploadOutlined />}>Upload Image</Button>
                )}
              </Upload>
            </div>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Save Changes
            </Button>
            <Button style={{ marginLeft: "10px" }} onClick={() => router.push(`/decks/${id}/edit`)}>
              Cancel
            </Button>
          </Form.Item>

        </Form>
      </Card>
    </div>
  );
};

export default EditFlashcardPage;

