"use client";

import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  Button,
  Input,
  Select,
  Checkbox,
  Card,
  Row,
  Col,
  Modal,
  Form,
  Popconfirm,
  Spin,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";


// Types
interface Deck {
  id: number;
  title: string;
  deckCategory: string;
  isPublic: boolean;
}

interface Flashcard {
  id?: number;
  description: string;
  answer: string;
  wrongAnswers: string[];
  imageUrl?: string | null;
}

const CATEGORY_OPTIONS = [
  "MOMENTS",
  "SPORTS",
  "ANIMALS",
  "PLACES",
  "FOODS",
  "SCIENCE",
  "MATH",
  "HISTORY",
  "LANGUAGE",
  "TECHNOLOGY",
  "OTHERS",
  "MIXED",
];


// Main Page Component
const EditDeckPage: React.FC = () => {
  const router = useRouter();
  const { deckId } = useParams<{ deckId: string }>();
  const apiService = useApi();

  // State 
  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  const [deckForm, setDeckForm] = useState({
    title: "",
    deckCategory: "",
    isPublic: false,
  });

  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(
    null
  );

  // Fetch helpers 
  const fetchDeck = useCallback(async () => {
    try {
      const fetchedDeck = await apiService.get<Deck>(`/decks/${deckId}`);
      setDeck(fetchedDeck);
      setDeckForm({
        title: fetchedDeck.title ?? "",
        deckCategory: fetchedDeck.deckCategory ?? "",
        isPublic: fetchedDeck.isPublic ?? false,
      });
    } catch (err) {
      console.error(err);
      message.error("Failed to load deck details.");
    }
  }, [apiService, deckId]);

  const fetchFlashcards = useCallback(async () => {
    try {
      const data = await apiService.get<Flashcard[]>(
        `/decks/${deckId}/flashcards`
      );
      setFlashcards(data);
    } catch (err) {
      console.error(err);
      message.error("Failed to load flashcards.");
    }
  }, [apiService, deckId]);

  useEffect(() => {
    if (!deckId) return;
    (async () => {
      setLoading(true);
      await Promise.all([fetchDeck(), fetchFlashcards()]);
      setLoading(false);
    })();
  }, [deckId, fetchDeck, fetchFlashcards]);

  // Deck handlers
  const handleDeckSave = async () => {
    if (!deck) return;
    try {
      await apiService.put(`/decks/${deck.id}`, {
        title: deckForm.title,
        deckCategory: deckForm.deckCategory,
        isPublic: deckForm.isPublic,
      });
      message.success("Deck updated successfully");
      router.push("/decks");
    } catch (err) {
      console.error(err);
      message.error("Failed to update deck");
    }
  };

  // Flashcard handlers 
  const openAddModal = () => {
    setEditingFlashcard(null);
    setIsModalVisible(true);
  };

  const openEditModal = (card: Flashcard) => {
    setEditingFlashcard(card);
    setIsModalVisible(true);
  };

  const handleDeleteFlashcard = async (cardId?: number) => {
    if (!cardId) return;
    try {
      await apiService.delete(`/decks/${deckId}/flashcards/${cardId}`);
      message.success("Flashcard deleted");
      fetchFlashcards();
    } catch {
      message.error("Failed to delete flashcard");
    }
  };

  const handleModalOk = async (values: Flashcard) => {
    try {
      if (editingFlashcard && editingFlashcard.id) {
        // Update existing
        await apiService.put(`/flashcards/${editingFlashcard.id}`, values);
      } else {
        // Create new
        await apiService.post(`/decks/${deckId}/flashcards/addFlashcard`, values);
      }
      setIsModalVisible(false);
      fetchFlashcards();
      message.success("Flashcard saved");
    } catch (err) {
      console.error(err);
      message.error("Failed to save flashcard");
    }
  };

  // Render 
  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!deck) {
    return (
      <div style={{ textAlign: "center", marginTop: "120px" }}>
        <p>Deck not found.</p>
        <Button type="primary" onClick={() => router.push("/decks")}>Go back</Button>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#b3edbc",
        minHeight: "100vh",
        padding: "40px 24px 120px",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Back button */}
      <Button
        style={{ marginBottom: "24px" }}
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/decks")}
      >
        Back to decks
      </Button>

      {/* Deck form */}
      <Card
        style={{
          maxWidth: 640,
          margin: "0 auto 40px",
          borderRadius: 24,
          boxShadow: "0 8px 18px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ marginBottom: 24, color: "#215F46" }}>Edit Deck</h2>
        <Form layout="vertical" autoComplete="off">
          <Form.Item label="Title" required>
            <Input
              value={deckForm.title}
              onChange={(e) =>
                setDeckForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </Form.Item>

          <Form.Item label="Category" required>
            <Select
              value={deckForm.deckCategory}
              onChange={(val) =>
                setDeckForm((f) => ({ ...f, deckCategory: val }))
              }
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <Select.Option key={cat} value={cat}>
                  {cat[0] + cat.slice(1).toLowerCase()}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Checkbox
              checked={deckForm.isPublic}
              onChange={(e) =>
                setDeckForm((f) => ({ ...f, isPublic: e.target.checked }))
              }
            >
              Public deck
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" onClick={handleDeckSave}>
              Save deck changes
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Flashcards section */}
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={{ color: "#215F46", marginBottom: 24 }}>Flashcards</h2>
        <Row gutter={[16, 16]}>
          {/* Add card placeholder */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              style={{
                height: 140,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed #2E8049",
                borderRadius: 16,
              }}
              onClick={openAddModal}
            >
              <PlusOutlined style={{ fontSize: 32, color: "#2E8049" }} />
            </Card>
          </Col>

          {flashcards.map((card) => (
            <Col xs={24} sm={12} md={8} lg={6} key={card.id}>
              <Card
                style={{ height: 140, borderRadius: 16 }}
                actions={[
                  <EditOutlined key="edit" onClick={() => openEditModal(card)} />,
                  <Popconfirm
                    key="delete"
                    title="Delete this flashcard?"
                    onConfirm={() => handleDeleteFlashcard(card.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <DeleteOutlined />
                  </Popconfirm>,
                ]}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {card.description}
                </div>
                <div style={{ color: "#666", fontSize: 12 }}>
                  Answer: {card.answer}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Flashcard modal */}
      <FlashcardModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        initial={editingFlashcard}
        onOk={handleModalOk}
      />
    </div>
  );
};

// Flashcard Modal component
interface ModalProps {
  visible: boolean;
  initial: Flashcard | null;
  onOk: (vals: Flashcard) => void;
  onCancel: () => void;
}

const FlashcardModal: React.FC<ModalProps> = ({
  visible,
  initial,
  onOk,
  onCancel,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        description: initial?.description ?? "",
        answer: initial?.answer ?? "",
        wrongAnswers: initial?.wrongAnswers?.join(", ") ?? "",
      });
    }
  }, [visible, initial, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: Flashcard = {
        description: values.description,
        answer: values.answer,
        wrongAnswers: values.wrongAnswers
          .split(/,\s*/)
          .filter((s: string) => s),
      };
      onOk(payload);
      form.resetFields();
    } catch {
      /* validation errors */
    }
  };

  return (
    <Modal
      open={visible}
      title={initial ? "Edit Flashcard" : "Add Flashcard"}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="Save"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Question / Description"
          name="description"
          rules={[{ required: true, message: "Description is required" }]}
        >
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item
          label="Correct Answer"
          name="answer"
          rules={[{ required: true, message: "Answer is required" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Wrong Answers (comma‑separated)"
          name="wrongAnswers"
          rules={[{ required: true, message: "Please provide wrong answers" }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditDeckPage;
