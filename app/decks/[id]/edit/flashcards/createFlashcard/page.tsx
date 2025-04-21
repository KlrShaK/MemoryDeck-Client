//adding flashcards to a deck
"use client";

import React, { useEffect, useState } from "react";
import { Upload, Input, Button, message, Form, Card } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import type { UploadChangeParam } from "antd/es/upload";
import type { UploadFile } from "antd/es/upload/interface";
import Image from "next/image";
import { Deck } from "@/types/deck";

type FlashcardFormValues = {
  description: string;
  answer: string;
  date?: string;
  flashcardCategory: string;
};

const AddFlashcardPage: React.FC = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const apiService = useApi();
  const [deckName, setDeckName] = useState<string | null>(null);

  const { id } = useParams();
  const { value: userId } = useLocalStorage<string>("userId", "");
  const userIdAsNumber = Number(userId?.replace(/"/g, ""));

  const [wrongAnswers, setWrongAnswers] = useState<string[]>(["", "", ""]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [isValidUser, setIsValidUser] = useState(true);

  useEffect(() => {
    if (isNaN(userIdAsNumber)) {
      message.error("Invalid user id. Please log in again.");
      router.push("/login");
      setIsValidUser(false);
    }
  }, [userIdAsNumber, router]);

  useEffect(() => {
    if (isNaN(Number(id))) {
      message.error("Invalid deck ID");
      router.push("/decks");
      return;
    }
  
    const fetchDeck = async () => {
      try {
        const deck = await apiService.get<Deck>(`/decks/${id}`);
        if (!deck) {
          message.error("Deck not found.");
          router.push("/decks");
        } else {
          // Ensure that deck.title and deck.deckCategory are not null
          if (deck.title && deck.deckCategory) {
            setDeckName(deck.title);
            form.setFieldsValue({
              flashcardCategory: deck.deckCategory,
              isPublic: deck.isPublic,
            });
          } else {
            message.error("Deck data is incomplete.");
            router.push("/decks");
          }
        }
      } catch {
        message.error("Failed to fetch deck data.");
        router.push("/decks");
      }
    };
  
    fetchDeck();
  }, [id, apiService, form, router]);
  
  if (!isValidUser) {
    return null;
  }

  const handleImageChange = async ({ file, fileList }: UploadChangeParam<UploadFile>) => {
    setFileList(fileList);

    if (file.status === "removed") {
      setImageUrl(null);
      return;
    }

    if (file.originFileObj) {
      try {
        const uploadedImageUrl = await apiService.uploadImage("/flashcards/upload-image", file.originFileObj);
        setImageUrl(uploadedImageUrl);
        message.success("Image uploaded successfully!");
      } catch {
        message.error("Image upload failed.");
        setFileList([]);
      }
    }
  };

  const handleWrongAnswerChange = (index: number, value: string) => {
    const newAnswers = [...wrongAnswers];
    newAnswers[index] = value;
    setWrongAnswers(newAnswers);
  };

  const handleAddFlashcard = async (values: FlashcardFormValues) => {
    try {
      if (wrongAnswers.filter((a) => a.trim()).length === 0) {
        message.error("Please provide at least one wrong answer.");
        return;
      }

      let finalImageUrl = imageUrl;

      if (fileList.length > 0 && fileList[0].originFileObj) {
        try {
          finalImageUrl = await apiService.uploadImage(
            "/flashcards/upload-image",
            fileList[0].originFileObj
          );
        } catch {
          message.error("Image upload failed. Please try again.");
          return;
        }
      }

      const flashcardDTO = {
        description: values.description,
        answer: values.answer,
        wrongAnswers: wrongAnswers.filter((a) => a.trim()),
        date: values.date,
        imageUrl: finalImageUrl || null,
        flashcardCategory: values.flashcardCategory,
      };

      await apiService.post(`/decks/${id}/flashcards/addFlashcard`, flashcardDTO);

      message.success(`Flashcard has been added to the "${deckName}" Deck`);
      router.push(`/decks/${id}/edit`);
    } catch (error: any) {
      console.error("Error adding flashcard:", error);

      if (error.response?.status === 400 || error.response?.status === 422) {
        message.error("Make sure all mandatory fields have been filled out correctly.");
      } else {
        message.error("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
      <Card title={`Add New Flashcard`} style={{ width: 400 }}>
        <Form form={form} onFinish={handleAddFlashcard} layout="vertical">
          <Form.Item label="Date" name="date" rules={[{ required: false }]}>
            <Input type="date" />
          </Form.Item>

          <Form.Item
            label="Question"
            name="description"
            rules={[{ required: true, message: "Question is required" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Correct Answer"
            name="answer"
            rules={[{ required: true, message: "Correct Answer is required" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Wrong Answers (at least 1 required)"
            required
            validateStatus={
              wrongAnswers.filter((a) => a.trim()).length === 0 ? "error" : "success"
            }
            help={
              wrongAnswers.filter((a) => a.trim()).length === 0
                ? "Please provide at least one wrong answer."
                : ""
            }
          >
            {["First", "Second", "Third"].map((label, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                <Input
                  placeholder={`${label} Wrong Answer`}
                  value={wrongAnswers[index]}
                  onChange={(e) => handleWrongAnswerChange(index, e.target.value)}
                />
              </div>
            ))}
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

          <Button type="primary" htmlType="submit">
            Save Flashcard
          </Button>

          <Button
            style={{ marginLeft: "10px" }}
            onClick={() => router.push(`/decks/${id}/edit`)}
          >
            Cancel
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default AddFlashcardPage;



