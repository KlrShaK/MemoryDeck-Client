"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { Flashcard } from "@/types/flashcard";
import { Button, Drawer, Form, Input, Space, Divider, message, Upload } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, SaveOutlined, UploadOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { Deck } from "@/types/deck";
import Image from "next/image";
import type { UploadChangeParam, UploadFile } from "antd/es/upload/interface";
import { DatePicker } from "antd"; 
import dayjs from "dayjs";
import { getApiDomain } from "@/utils/domain";

const { TextArea } = Input;

// Default wrong answers for new/reset forms
const DEFAULT_WRONG_ANSWERS = ['', '', ''];

const FlashcardsPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const domain = getApiDomain();
  const { id } = useParams();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [deckIdAsNumber, setDeckIdAsNumber] = useState<number | null>(null);

  // For the drawer and editing functionality
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [savingCard, setSavingCard] = useState(false);
  const [cardForm] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageUrl, setImageUrl] = useState<string | undefined>();

  useEffect(() => {
    if (id) {
      const parsedDeckId = Number(id);
      if (!isNaN(parsedDeckId)) {
        setDeckIdAsNumber(parsedDeckId);
      }
    }
  }, [id]);

  useEffect(() => {
    const userId = localStorage.getItem("userId")?.replace(/"/g, "");
    if (!userId || isNaN(Number(userId)) || Number(userId) <= 0) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const userId = localStorage.getItem("userId")?.replace(/"/g, "");
        if (!userId || isNaN(Number(userId))) {
          router.push("/login");
          return;
        }

        const allFlashcards = await apiService.get<Flashcard[]>(`/decks/${deckIdAsNumber}/flashcards`);
        setFlashcards(Array.isArray(allFlashcards) ? allFlashcards : []);
      } catch (error) {
        console.error("Error fetching flashcards:", error);
        setFlashcards([]);
      }
    };

    const fetchDeck = async () => {
      try {
        const fetchedDeck = await apiService.get<Deck>(`/decks/${deckIdAsNumber}`);
        setDeck(fetchedDeck);
      } catch (error) {
        console.error("Error fetching deck", error);
      }
    };

    if (deckIdAsNumber !== null) {
      fetchCards();
      fetchDeck();
    }
  }, [apiService, deckIdAsNumber, router]);

  // Handle opening the drawer for editing a card
  const handleEdit = (flashcard: Flashcard, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip when clicking edit
    setEditingCard(flashcard);
    setDrawerOpen(true);
    
    // Set form values
    cardForm.setFieldsValue({
      description: flashcard.description,
      answer: flashcard.answer,
      wrongAnswers: flashcard.wrongAnswers?.length >= 3 
        ? flashcard.wrongAnswers 
        : DEFAULT_WRONG_ANSWERS,
        date: flashcard.date ? dayjs(flashcard.date) : null,
    });
    
    // Set image display if there is one
    setImageUrl(flashcard.imageUrl ?? undefined);
    setFileList(
      flashcard.imageUrl
        ? [{
            uid: '-1',
            name: 'image',
            status: 'done',
            url: flashcard.imageUrl,
          }]
        : []
    );
  };

  const handleDelete = async (flashcardId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip when clicking delete
    try {
      await apiService.delete(`/decks/${deckIdAsNumber}/flashcards/${flashcardId}`);
      setFlashcards((prev) => prev.filter((f) => f.id !== flashcardId));
      message.success("Flashcard deleted successfully");
    } catch (error) {
      console.error("Error deleting flashcard:", error);
      message.error("Failed to delete flashcard");
    }
  };

  const toggleFlip = (index: number) => {
    setFlippedIndex(flippedIndex === index ? null : index);
  };

  const goToNextFlashcard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlippedIndex(null);
    }
  };

  const goToPreviousFlashcard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlippedIndex(null);
    }
  };

  // Handle image upload in the form
  const handleImageChange = async (info: UploadChangeParam<UploadFile>) => {
    const { file, fileList: newFileList } = info;
    setFileList(newFileList);

    if (file.status === 'removed') {
      // User clicked X on the thumbnail
      setImageUrl(undefined);
      return;
    }

    if (file.originFileObj) {
      try {
        const url = await apiService.uploadImage(
          '/flashcards/upload-image',
          file.originFileObj,
        );
        setImageUrl(url);
        message.success('Image uploaded successfully');
      } catch {
        message.error('Image upload failed');
        setFileList([]);
      }
    }
  };

  // Save the edited flashcard
  const saveFlashcard = async () => {
    try {
      await cardForm.validateFields();
      const values = cardForm.getFieldsValue();

      const wrongAnswers = (values.wrongAnswers ?? [])
        .map((w: string) => w.trim())
        .filter(Boolean);

      if (wrongAnswers.length < 3) {
        message.error('Please provide at least 3 wrong answers');
        return;
      }
      
      if (wrongAnswers.includes(values.answer.trim())) {
        message.error('Correct answer must not be in wrong answers');
        return;
      }

      const payload = {
        description: values.description.trim(),
        answer: values.answer.trim(),
        wrongAnswers,
        date: values.date ? values.date.format('YYYY-MM-DD') : null,
        imageUrl: imageUrl ?? null,
        flashcardCategory: deck?.deckCategory,
      };

      setSavingCard(true);
      
      if (editingCard && editingCard.id) {
        await apiService.put(`/flashcards/${editingCard.id}`, payload);
        message.success('Flashcard updated successfully');
        
        // Update the flashcard in the current list
        setFlashcards(prevCards => 
          prevCards.map(card => 
            card.id === editingCard.id 
              ? { 
                  ...card, 
                  description: payload.description,
                  answer: payload.answer,
                  wrongAnswers: payload.wrongAnswers,
                  date: payload.date,
                  imageUrl: payload.imageUrl,
                }
              : card
          )
        );
      }
      
      setDrawerOpen(false);
    } catch (error) {
      console.error("Error saving flashcard:", error);
      // Form validation errors are shown automatically
    } finally {
      setSavingCard(false);
    }
  };

  return (
    <div style={{ background: "#c3fad4", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#215F46" }}>
          Deck {deck?.id}{deck?.title ? `: ${deck.title}` : ""}
        </h1>
        <h2 style={{ fontSize: "1.5rem", color: "#215F46" }}>
          Category: {deck?.deckCategory}
        </h2>
      </div>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 32 }}>
        <Button onClick={goToPreviousFlashcard} disabled={currentIndex === 0 || flashcards.length === 0}>
          &lt; Previous
        </Button>

        <div
          style={{
            width: "800px",
            height: "500px",
            backgroundColor: "#fff",
            borderRadius: "20px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "0 20px",
            padding: "24px",
            position: "relative",
            cursor: "pointer",
          }}
          tabIndex={0}
          onClick={() => toggleFlip(currentIndex)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleFlip(currentIndex);
            }
          }}
        >
          {flashcards.length > 0 ? (
            <>
              <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: "10px" }}>
                <Button 
                  type="link" 
                  icon={<EditOutlined />} 
                  onClick={(e) => handleEdit(flashcards[currentIndex], e)} 
                />
                <Button 
                  type="link" 
                  icon={<DeleteOutlined />} 
                  style={{ color: "#ff4d4f" }} 
                  onClick={(e) => handleDelete(flashcards[currentIndex].id, e)} 
                />
              </div>
              
              <div style={{ textAlign: "center", color: "#215F46", marginTop: "30px" }}>
                <h2 style={{ fontSize: "2rem" }}>{flippedIndex === currentIndex ? "Answer" : "Question"}</h2>
                <h3 style={{ fontSize: "1rem", color: "#215F46" }}>Flashcard {currentIndex + 1} of {flashcards.length}</h3>
              </div>
              
              <div style={{ 
                flexGrow: 1, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                color: "#215F46", 
                textAlign: "center",
                width: "100%",
                padding: "0 20px"
              }}>
                {/* Show image if available and relevant to the current side */}                
                <p style={{ fontSize: "1.2rem" }}>
                  {flippedIndex === currentIndex ? flashcards[currentIndex].answer : flashcards[currentIndex].description}
                

                {flashcards[currentIndex].imageUrl && (
                  <div style={{ marginTop: "20px",marginBottom: "20px", maxWidth: "100%", textAlign: "center" }}>
                    <Image
                      // src={flashcards[currentIndex].imageUrl}
                      src = {`${domain}/flashcards/image?imageUrl=${encodeURIComponent(flashcards[currentIndex].imageUrl)}`}
                      alt="Flashcard image"
                      width={250}
                      height={170}
                      style={{ objectFit: "contain", maxHeight: "200px", borderRadius: "8px" }}
                      unoptimized
                    />
                  </div>
                )}

              </p>
              </div>
            </>
          ) : (
            <p style={{ color: "#215F46", fontWeight: "bold" }}>No flashcards available</p>
          )}
        </div>

        <Button onClick={goToNextFlashcard} disabled={currentIndex === flashcards.length - 1 || flashcards.length === 0}>
          Next &gt;
        </Button>
      </div>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Button type="primary" onClick={() => router.push(`/decks/${deckIdAsNumber}/edit`)} style={{ marginRight: 16 }}>
          Add New Flashcard
        </Button>
        <Button onClick={() => router.push(`/decks`)}>Back to Decks</Button>
      </div>

      {/* Drawer for editing flashcard */}
      <Drawer
        destroyOnClose
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={460}
        title="Edit flashcard"
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              loading={savingCard}
              icon={<SaveOutlined />}
              onClick={saveFlashcard}
              style={{
                background: '#2E8049',
                borderColor: '#2E8049',
              }}
            >
              Save
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={cardForm}>
          <Form.Item
            label={<span style={{ color: 'black' }}>Question</span>}
            name="description"
            rules={[{ required: true }]}
          >
            <TextArea rows={3} placeholder="Enter question" style={{ backgroundColor: 'white', color: 'black', borderRadius: 8 }}/>
          </Form.Item>

          <Form.Item
            label={<span style={{ color: 'black' }}>Correct Answer</span>}
            name="answer"
            rules={[{ required: true }]}
          >
            <Input style={{ backgroundColor: 'white', color: 'black', borderRadius: 8 }}/>
          </Form.Item>

          <Divider orientation="left">Wrong answers (min 3) </Divider>

          <Form.List name="wrongAnswers">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Form.Item
                    key={field.key}
                    required={index < 3}
                    label={<span style={{ color: 'black' }}>{`Wrong answer ${index + 1}`}</span>}
                  >
                    <Input.Group compact style={{ display: 'flex' }}>
                      <Form.Item
                        key={field.key}
                        name={field.name}
                        fieldKey={field.fieldKey}
                        noStyle
                        rules={[
                          { required: index < 3, message: 'Required' },
                          { whitespace: true },
                        ]}
                      >
                        <Input
                          placeholder={`Wrong answer ${index + 1}`}
                          style={{ flex: 1, backgroundColor: 'white', color: 'black', borderRadius: 8 }}
                        />
                      </Form.Item>
                      {index >= 3 && (
                        <MinusCircleOutlined
                          style={{
                            color: 'red',
                            marginLeft: 8,
                            fontSize: 16,
                          }}
                          onClick={() => remove(field.name)}
                        />
                      )}
                    </Input.Group>
                  </Form.Item>
                ))}
                {fields.length < 6 && (
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add()}
                    block
                  >
                    Add wrong answer
                  </Button>
                )}
              </>
            )}
          </Form.List>

          <Form.Item label={<span style={{ color: 'black' }}>Date (optional)</span>} name="date">
              <DatePicker 
                style={{ width: '100%', backgroundColor: 'white', color: 'black', borderRadius: 8 }}
                format="YYYY-MM-DD"
                placeholder="Select date (optional)"
                popupClassName="light-range-calendar" 
                disabledDate={(current) => {
                  // Can't select dates after today or before 1900
                  return current && (current > dayjs().endOf('day') || current < dayjs('1900-01-01'));
                }}
              />
          </Form.Item>

          <Form.Item label="Image (optional)">
            <Upload
              accept="image/*"
              listType="picture"
              fileList={fileList}
              onChange={handleImageChange}
              onRemove={() => {
                setImageUrl(undefined);
                setFileList([]);
              }}
              beforeUpload={() => false /* manual */}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>
                {imageUrl ? 'Change image' : 'Upload image'}
              </Button>
            </Upload>

            {imageUrl && (
              <div style={{ marginTop: 8 }}>
                <Image
                  src={imageUrl}
                  alt="preview"
                  width={260}
                  height={180}
                  style={{
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid #eee',
                  }}
                  unoptimized
                />
              </div>
            )}
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default FlashcardsPage;