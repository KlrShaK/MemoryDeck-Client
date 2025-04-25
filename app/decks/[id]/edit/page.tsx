 // Edit the deck & its flashcards (for editing the individual flashcard within the deck navigate to flashcardId/page.tsx)
 "use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Spin,
  message,
  Row,
  Col,
} from "antd";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";

const { Option } = Select;

interface Flashcard {
  id: number;
  description: string;
  answer: string;
}

interface Deck {
  id: number;
  title: string;
  deckCategory: string;
  isPublic: boolean;
  isAiGenerated: boolean;
  aiPrompt: string;
  numberOfAICards: number;
  user: { id: number };
}

const EditDeckPage: React.FC = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const params = useParams();
  const deckId = params?.id;

  // Guard clause for invalid deckId
  if (!deckId) {
    message.error("Invalid deck ID");
    router.push("/decks");
    return null; // Early return if no deckId is found
  }

  const apiService = useApi(); // Always call hooks at the top
  const [loading, setLoading] = useState(true);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [existingDeck, setExistingDeck] = useState<Deck | null>(null);

  useEffect(() => {
    const fetchDeck = async () => {
      if (!deckId) return;

      try {
        const deck = await apiService.get<Deck>(`/decks/${deckId}`);
        setExistingDeck(deck);
        form.setFieldsValue({
          title: deck.title,
          deckCategory: deck.deckCategory,
        });

        const flashcardList = await apiService.get<Flashcard[]>(`/decks/${deckId}/flashcards`);
        setFlashcards(flashcardList);
      } catch (error) {
        message.error("Failed to load deck data.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeck();
  }, [deckId, apiService, form]); // Ensure all dependencies are added

  const handleSaveDeck = async (values: { title: string; deckCategory: string }) => {
    try {
      if (!existingDeck) return;

      await apiService.put(`/decks/${deckId}`, {
        ...existingDeck,
        title: values.title,
        deckCategory: values.deckCategory,
      });
      message.success("Deck updated successfully!");
      router.push("/decks");
    } catch (error) {
      console.error(error);
      message.error("Failed to update deck.");
    }
  };

  const handleEditFlashcard = (flashcardId: number) => {
    router.push(`/decks/${deckId}/edit/flashcards/${flashcardId}`);
  };

  const handleAddFlashcard = () => {
    router.push(`/decks/${deckId}/edit/flashcards/createFlashcard`);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px" }}>
      <h2>Edit Deck</h2>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSaveDeck}
        style={{ marginBottom: "32px" }}
      >
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter deck title" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Deck Category"
          name="deckCategory"
          rules={[{ required: true, message: "Please select a category" }]}
        >
          <Select placeholder="Select category">
            <Option value="MOMENTS">Moments</Option>
            <Option value="SPORTS">Sports</Option>
            <Option value="ANIMALS">Animals</Option>
            <Option value="PLACES">Places</Option>
            <Option value="FOODS">Foods</Option>
            <Option value="SCIENCE">Science</Option>
            <Option value="MATH">Math</Option>
            <Option value="HISTORY">History</Option>
            <Option value="LANGUAGE">Language</Option>
            <Option value="TECHNOLOGY">Technology</Option>
            <Option value="OTHERS">Others</Option>
            <Option value="MIXED">Mixed</Option>
          </Select>
        </Form.Item>

        <Button type="primary" htmlType="submit">
          Save Deck
        </Button>

        <Button
          style={{ marginLeft: "16px" }}
          onClick={handleAddFlashcard}
          type="dashed"
        >
          Add Flashcard
        </Button>
      </Form>

      <h3>Existing Flashcards</h3>
      <Row gutter={[16, 16]}>
        {flashcards.map((card) => (
          <Col key={card.id} xs={24} sm={12} md={8}>
            <Card
              title={card.description || "Untitled"}
              extra={
                <Button size="small" onClick={() => handleEditFlashcard(card.id)}>
                  Edit
                </Button>
              }
            >
              <p>{card.answer ? `Answer: ${card.answer}` : "No answer"}</p>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default EditDeckPage;



 //  "use client";
//
// import React, { useEffect, useState } from "react";
// import { useRouter, useParams } from "next/navigation";
// import { Checkbox,Card,Form, Input, Button, Select, message } from "antd";
// const { Option } = Select;
// import { Flashcard } from "@/types/flashcard";
// import { useApi } from "@/hooks/useApi";
// import { Deck } from "@/types/deck";
//
//
// const EditDeckPage: React.FC = () => {
//   const router = useRouter();
//   const { deckId } = useParams();
//   const apiService = useApi();
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(false);
//
//
//   useEffect(() => {
//     if (isNaN(Number(deckId))) {
//       message.error("Invalid deck ID");
//       router.push("/decks");
//       return;
//     }
//
//     const fetchDeck = async () => {
//       try {
//         const deck = await apiService.get<Deck>(`/decks/${deckId}`);
//         form.setFieldsValue({
//           title: deck?.title,
//           deckCategory: deck?.deckCategory,
//           isPublic: deck?.isPublic,
//         });
//
//       } catch{
//         message.error("Failed to fetch deck data");
//         router.push("/decks");
//       }
//     };
//
//     fetchDeck();
//   }, [deckId, apiService, form, router]);
//
//   const handleSubmit = async (formValues: Flashcard) => {
//     setLoading(true);
//     try {
//       const deckData = {
//         ...formValues,
//       };
//
//       await apiService.put(`/decks/${deckId}`, deckData);
//       message.success("Deck updated successfully!");
//       router.push("/decks");
//     } catch (error) {
//       message.error("Failed to update deck");
//       console.error("Update error:", error);
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   return (
//     <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
//     <Card title={`Update Deck`} style={{ width: 400 }}>
//       <Form
//         form={form}
//         layout="vertical"
//         onFinish={(values) =>
//           handleSubmit({...values})
//         }
//       >
//         <Form.Item
//           label="Title"
//           name="title"
//           rules={[{ required: true, message: "Please enter a title" }]}
//         >
//           <Input />
//         </Form.Item>
//
//         <Form.Item
//           label="DeckCategory"
//           name="deckCategory"
//           rules={[{ required: true, message: "Deck Category is required" }]}
//         >
//           <Select placeholder="Select a category">
//             <Option value="MOMENTS">Moments</Option>
//             <Option value="SPORTS">Sports</Option>
//             <Option value="ANIMALS">Animals</Option>
//             <Option value="PLACES">Places</Option>
//             <Option value="FOODS">Foods</Option>
//             <Option value="SCIENCE">Science</Option>
//             <Option value="MATH">Math</Option>
//             <Option value="HISTORY">History</Option>
//             <Option value="LANGUAGE">Language</Option>
//             <Option value="TECHNOLOGY">Technology</Option>
//             <Option value="OTHERS">Others</Option>
//             <Option value="MIXED">Mixed</Option>
//           </Select>
//         </Form.Item>
//
//         <Form.Item name="isPublic" valuePropName="checked">
//           <Checkbox>Public</Checkbox>
//         </Form.Item>
//
//         <Form.Item>
//           <Button type="primary" htmlType="submit" loading={loading}>
//             Save Changes
//           </Button>
//           <Button style={{ marginLeft: "10px" }} onClick={() => router.push("/decks")}>
//           Cancel
//           </Button>
//         </Form.Item>
//
//       </Form>
//     </Card>
//     </div>
//   );
// };
//
// export default EditDeckPage;
