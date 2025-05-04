"use client";

import React, { useEffect, useState } from "react";
import {
  Upload,
  Input,
  Button,
  message,
  Form,
  Card,
  Space,
} from "antd";
import {
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import type { UploadChangeParam } from "antd/es/upload";
import type { UploadFile } from "antd/es/upload/interface";
import Image from "next/image";
import { Deck } from "@/types/deck";

type FlashcardValues = {
  description: string;
  answer: string;
  wrongAnswers: string[];
  date?: string;
  imageUrl?: string;
};

const AddMultipleFlashcardsPage: React.FC = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const apiService = useApi();
  const [deckName, setDeckName] = useState<string | null>(null);
  const [deckCategory, setDeckCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { id } = useParams();
  const { value: userId } = useLocalStorage<string>("userId", "");
  const userIdAsNumber = Number(userId?.replace(/"/g, ""));
  const [fileUploads, setFileUploads] = useState<Record<number, { fileList: UploadFile[]; imageUrl: string | null }>>({});
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
        if (!deck || !deck.title || !deck.deckCategory) {
          message.error("Deck not found or data incomplete.");
          router.push("/decks");
        } else {
          setDeckName(deck.title);
          setDeckCategory(deck.deckCategory);
        }
      } catch {
        message.error("Failed to fetch deck data.");
        router.push("/decks");
      }
    };

    fetchDeck();
  }, [id, apiService, form, router]);

  const handleImageChange = async (index: number, info: UploadChangeParam<UploadFile<any>>) => {
    const { file, fileList } = info;
    if (file.status === "removed") {
      setFileUploads(prev => ({ ...prev, [index]: { fileList, imageUrl: null } }));
      return;
    }
    if (file.originFileObj) {
      try {
        const imageUrl = await apiService.uploadImage("/flashcards/upload-image", file.originFileObj);
        setFileUploads(prev => ({ ...prev, [index]: { fileList, imageUrl } }));
        message.success("Image uploaded successfully");
      } catch {
        message.error("Image upload failed");
      }
    }
  };

  const handleSaveAll = async () => {
    try {
      const values = await form.validateFields();
      const cards: FlashcardValues[] = values.flashcards.filter((c: FlashcardValues) => c.description && c.answer && c.wrongAnswers?.some((w: string) => w?.trim()));
      if (!cards.length) return message.error("Add at least one complete flashcard");

      setSaving(true);
      for (let i = 0; i < cards.length; i++) {
        const dto = {
          description: cards[i].description,
          answer: cards[i].answer,
          wrongAnswers: cards[i].wrongAnswers.filter((a: string) => a?.trim()),
          date: cards[i].date,
          imageUrl: fileUploads[i]?.imageUrl || null,
          flashcardCategory: deckCategory || "MIXED",
        };
        await apiService.post(`/decks/${id}/flashcards/addFlashcard`, dto);
      }
      message.success(`Added ${cards.length} flashcards`);
      router.push(`/decks/${id}/edit`);
    } catch (err) {
      message.error("Failed to save flashcards");
    } finally {
      setSaving(false);
    }
  };

  if (!isValidUser) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#c3fad4", padding: 40, fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", backgroundColor: "#aef5c4", borderRadius: 20, padding: 40 }}>
        <h1 style={{ fontSize: 32, color: "#215F46", marginBottom: 32, textAlign: "center" }}>Add Flashcards to "{deckName}"</h1>
        <Form form={form} layout="vertical" initialValues={{ flashcards: [{}] }} autoComplete="off">
          <Form.List name="flashcards">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, i) => (
                  <Card
                    key={field.key}
                    title={`Card ${i + 1}`}
                    style={{ marginBottom: 24, borderRadius: 16, background: "#fff", boxShadow: "0 6px 12px rgba(0,0,0,0.1)" }}
                    headStyle={{ backgroundColor: "#D4FFDD", borderBottom: "1px solid #ccc", color: "black" }}
                    extra={<Button icon={<DeleteOutlined />} onClick={() => remove(field.name)} danger type="link">Remove</Button>}
                  >
                    <Form.Item name={[field.name, "description"]} label={<span style={{ color: "black" }}>Question</span>} rules={[{ required: true }]}> <Input.TextArea rows={2} placeholder="Enter question" style={{ background: "white", color: "black" }} /></Form.Item>
                    <Form.Item name={[field.name, "answer"]} label={<span style={{ color: "black" }}>Correct Answer</span>} rules={[{ required: true }]}> <Input placeholder="Correct answer" style={{ background: "white", color: "black" }} /></Form.Item>
                    <Form.Item label={<span style={{ color: "black" }}>Wrong Answers</span>}>
                      <Form.List name={[field.name, "wrongAnswers"]} initialValue={["", "", ""]}>
                        {(subFields, { add: addWrong, remove: remWrong }) => (
                          <>
                            {subFields.map((sub, j) => (
                              <Form.Item name={[field.name, "wrongAnswers", sub.name]} key={sub.key} style={{ marginBottom: 8 }}>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                  <Input placeholder={`Wrong answer ${j + 1}`} style={{ flex: 1, background: "white", color: "black", marginRight: 8 }} />
                                  {j >= 3 && <MinusCircleOutlined onClick={() => remWrong(sub.name)} style={{ color: "#ff4d4f", fontSize: 18, cursor: "pointer" }} />}
                                </div>
                              </Form.Item>
                            ))}
                            {subFields.length < 6 && <Button type="dashed" onClick={() => addWrong()}>Add wrong answer</Button>}
                          </>
                        )}
                      </Form.List>
                    </Form.Item>
                    <Form.Item name={[field.name, "date"]} label={<span style={{ color: "black" }}>Date (optional)</span>}><Input type="date" style={{ background: "white", color: "black" }} /></Form.Item>
                    <Form.Item label={<span style={{ color: "black" }}>Image (optional)</span>}>
                      <Upload
                        fileList={fileUploads[i]?.fileList || []}
                        beforeUpload={() => false}
                        onChange={info => handleImageChange(i, info)}
                        listType="text"
                      >
                        {fileUploads[i]?.fileList?.length ? null : <Button icon={<UploadOutlined />}>Upload Image</Button>}
                      </Upload>
                      {fileUploads[i]?.imageUrl && (
                        <Image src={fileUploads[i].imageUrl} alt={`Card ${i + 1}`} width={100} height={100} style={{ marginTop: 12, borderRadius: 8 }} />
                      )}
                    </Form.Item>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block style={{ fontWeight: "bold", marginBottom: 24 }}>Add Another Flashcard</Button>
              </>
            )}
          </Form.List>
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Space>
              <Button type="primary" onClick={handleSaveAll} size="large" loading={saving} style={{ backgroundColor: "#2E8049", borderColor: "#2E8049" }}>Save All</Button>
              <Button onClick={() => router.push(`/decks/${id}/edit`)} size="large">Cancel</Button>
            </Space>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default AddMultipleFlashcardsPage;
