"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Spin,
  Upload,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SaveOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

import { useApi } from "@/hooks/useApi";
import { Deck } from "@/types/deck";
import { Flashcard } from "@/types/flashcard";
import type { UploadChangeParam, UploadFile } from "antd/es/upload/interface";

/* ---------- design tokens --------------------------------------- */
const primaryColor = "#2E8049";
const cardShadow = "0 8px 16px rgba(0,0,0,0.12)";
const fontFamily = "'Poppins', sans-serif";

const MAX_WRONG = 6;
const defaultWrongArray = () => ["", "", ""]; // first 3 are mandatory

/* =================================================================
   MAIN COMPONENT
   ================================================================= */
const EditDeckPage: React.FC = () => {
  const { id: deckId } = useParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();

  /* ---- antd message (hook) ------------------------------------- */
  const [msgApi, contextHolder] = message.useMessage();

  /* ---- deck meta ------------------------------------------------ */
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [deckForm] = Form.useForm();

  /* ---- flashcards ---------------------------------------------- */
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, Partial<Flashcard>>>({});
  const [uploads, setUploads] = useState<
    Record<string, { fileList: UploadFile[]; imageUrl: string | null }>
  >({});

  /* ---- bulk add ------------------------------------------------- */
  const [bulkForm] = Form.useForm();
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);

  const [loading, setLoading] = useState(true);

  /* ================================================================
     LOAD DECK & CARDS
     ================================================================ */
  useEffect(() => {
    if (!deckId) return;
    (async () => {
      try {
        const d = await api.get<Deck>(`/decks/${deckId}`);
        const cards = await api.get<Flashcard[]>(
          `/decks/${deckId}/flashcards`
        );
        setDeck(d);
        setFlashcards(cards);
        const m: Record<string, Partial<Flashcard>> = {};
        cards.forEach((c) => (m[c.id] = { ...c }));
        setForms(m);
      } catch {
        msgApi.error("Failed to load deck");
        router.push("/decks");
      } finally {
        setLoading(false);
      }
    })();
  }, [deckId, api, msgApi, router]);

  /* ================================================================
     EDIT DECK META
     ================================================================ */
  useEffect(() => {
    if (isEditingMeta && deck) {
      deckForm.setFieldsValue({
        title: deck.title,
        deckCategory: deck.deckCategory,
      });
    }
  }, [isEditingMeta, deck, deckForm]);

  const saveMeta = async () => {
    try {
      const vals = await deckForm.validateFields();
      await api.put(`/decks/${deckId}`, { ...deck, ...vals });
      setDeck((p) => (p ? { ...p, ...vals } : p));
      setFlashcards((p) =>
        p.map((c) => ({ ...c, flashcardCategory: vals.deckCategory }))
      );
      msgApi.success("Deck updated");
      setIsEditingMeta(false);
    } catch {
      msgApi.error("Could not update deck");
    }
  };

  /* ================================================================
     CARD HELPERS
     ================================================================ */
  const setCardField = (
    id: string,
    field: keyof Flashcard,
    val: any
  ) => setForms((p) => ({ ...p, [id]: { ...p[id], [field]: val } }));

  const setWrongAnswer = (id: string, idx: number, val: string) => {
    const arr = [...(forms[id].wrongAnswers ?? defaultWrongArray())];
    arr[idx] = val;
    setCardField(id, "wrongAnswers", arr);
  };

  const addWrongInput = (id: string) => {
    const arr = [...(forms[id].wrongAnswers ?? defaultWrongArray())];
    if (arr.length < MAX_WRONG) arr.push("");
    setCardField(id, "wrongAnswers", arr);
  };

  const onImageChange = async (
    id: string,
    info: UploadChangeParam<UploadFile>
  ) => {
    const { file, fileList } = info;
    if (file.status === "removed") {
      setUploads((p) => ({ ...p, [id]: { fileList, imageUrl: null } }));
      setCardField(id, "imageUrl", null);
      return;
    }
    if (file.originFileObj) {
      try {
        const url = await api.uploadImage(
          "/flashcards/upload-image",
          file.originFileObj as File
        );
        setUploads((p) => ({ ...p, [id]: { fileList, imageUrl: url } }));
        setCardField(id, "imageUrl", url);
        msgApi.success("Image uploaded");
      } catch {
        msgApi.error("Upload failed");
      }
    }
  };

  const validateCard = (d: Partial<Flashcard>) =>
    d.description?.trim() &&
    d.answer?.trim() &&
    (d.wrongAnswers ?? defaultWrongArray())
      .slice(0, 3)
      .every((w) => w?.trim());

  const saveCard = async (card: Flashcard, data: Partial<Flashcard>) => {
    if (!validateCard(data)) {
      msgApi.warning("Please fill question, answer and 3 wrong answers");
      return;
    }

    const body = {
      ...card,
      ...data,
      wrongAnswers: (data.wrongAnswers ?? defaultWrongArray()).filter(
        (w) => w?.trim()
      ),
    };

    try {
      if (card.id.startsWith("new-")) {
        const created = await api.post<Flashcard>(
          `/decks/${deckId}/flashcards/addFlashcard`,
          body
        );
        setFlashcards((p) =>
          p.map((c) => (c.id === card.id ? created : c))
        );
        setForms((p) => {
          const { [card.id]: _, ...rest } = p;
          return { ...rest, [created.id]: { ...created } };
        });
      } else {
        await api.put(`/flashcards/${card.id}`, body);
        setFlashcards((p) =>
          p.map((c) =>
            c.id === card.id ? ({ ...c, ...body } as Flashcard) : c
          )
        );
      }
      msgApi.success("Saved");
      setEditingId(null);
    } catch {
      msgApi.error("Could not save flashcard");
    }
  };

  const deleteCard = async (card: Flashcard) => {
    try {
      if (!card.id.startsWith("new-")) {
        await api.delete(`/decks/${deckId}/flashcards/${card.id}`);
      }
      setFlashcards((p) => p.filter((c) => c.id !== card.id));
      setEditingId(null);
      msgApi.success("Deleted");
    } catch {
      msgApi.error("Delete failed");
    }
  };

  const duplicateCard = (src: Flashcard) => {
    const id = `new-${Date.now()}`;
    const dup: Flashcard = { ...src, id, date: "" };
    setFlashcards((p) => [...p, dup]);
    setForms((p) => ({ ...p, [id]: { ...dup } }));
    setEditingId(id);
  };

  const addCard = () => {
    const id = `new-${Date.now()}`;
    const temp: Flashcard = {
      id,
      description: "",
      answer: "",
      wrongAnswers: defaultWrongArray(),
      date: "",
      imageUrl: null,
      flashcardCategory: deck?.deckCategory ?? "MIXED",
      isPublic: false,
      deck: { id: deckId, title: deck?.title ?? null },
    };
    setFlashcards((p) => [...p, temp]);
    setForms((p) => ({ ...p, [id]: { ...temp } }));
    setEditingId(id);
  };

  /* ================================================================
     BULK ADD
     ================================================================ */
  useEffect(() => {
    if (isBulkOpen) bulkForm.setFieldsValue({ flashcards: [{}] });
  }, [isBulkOpen, bulkForm]);

  const saveBulk = async () => {
    try {
      const vals = await bulkForm.validateFields();
      const cards = vals.flashcards.filter(
        (c: any) =>
          c.description && c.answer && c.wrongAnswers?.some((w: string) => w)
      );
      if (!cards.length) {
        msgApi.error("Please fill at least one card");
        return;
      }
      setSavingBulk(true);

      await Promise.all(
        cards.map((c: any, i: number) =>
          api.post(`/decks/${deckId}/flashcards/addFlashcard`, {
            ...c,
            wrongAnswers: c.wrongAnswers.filter((x: string) => x?.trim()),
            imageUrl: uploads[`bulk-${i}`]?.imageUrl ?? null,
            flashcardCategory: deck?.deckCategory ?? "MIXED",
          })
        )
      );

      msgApi.success(`Added ${cards.length} cards`);

      const fresh = await api.get<Flashcard[]>(
        `/decks/${deckId}/flashcards`
      );
      setFlashcards(fresh);
      const map: Record<string, Partial<Flashcard>> = {};
      fresh.forEach((c) => (map[c.id] = { ...c }));
      setForms(map);
      setIsBulkOpen(false);
    } catch {
      msgApi.error("Bulk save failed");
    } finally {
      setSavingBulk(false);
    }
  };

  /* ================================================================
     RENDER
     ================================================================ */
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  /* ---------- Deck Header --------------------------------------- */
  const DeckHeader = (
    <Card
      style={{
        marginBottom: 24,
        borderRadius: 16,
        boxShadow: cardShadow,
        border: "none",
        fontFamily,
      }}
    >
      {isEditingMeta ? (
        <Form
          form={deckForm}
          layout="inline"
          onFinish={saveMeta}
          style={{ flexWrap: "wrap", gap: 16 }}
        >
          <Form.Item
            name="title"
            rules={[{ required: true, message: "Title?" }]}
          >
            <Input placeholder="Deck title" style={{ width: 220 }} />
          </Form.Item>
          <Form.Item
            name="deckCategory"
            rules={[{ required: true, message: "Category?" }]}
          >
            <Select style={{ width: 180 }}>
              {[
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
              ].map((c) => (
                <Select.Option key={c}>{c}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            style={{ background: primaryColor, border: "none" }}
          >
            Save
          </Button>
          <Button
            icon={<CloseOutlined />}
            onClick={() => setIsEditingMeta(false)}
          >
            Cancel
          </Button>
        </Form>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ display: "inline-block", marginRight: 12 }}>
              {deck?.title}
            </h2>
            <Button
              icon={<EditOutlined />}
              onClick={() => setIsEditingMeta(true)}
            >
              Edit
            </Button>
            <div style={{ color: "#555" }}>
              Category:&nbsp;{deck?.deckCategory}
            </div>
          </div>

          <Space>
            <Button
              icon={<PlusOutlined />}
              onClick={addCard}
              style={{
                background: primaryColor,
                color: "white",
                border: "none",
                borderRadius: 24,
                fontWeight: 600,
              }}
            >
              Add Flashcard
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsBulkOpen(true)}
              style={{
                background: "#66ba7d",
                border: "none",
                borderRadius: 24,
              }}
            >
              Bulk Add
            </Button>
          </Space>
        </div>
      )}
    </Card>
  );

  /* ---------- Single Card --------------------------------------- */
  const FlashcardCard = (card: Flashcard) => {
    const isEdit = editingId === card.id;
    const data = forms[card.id] ?? {};

    return (
      <Col xs={24} sm={12} md={8} key={card.id}>
        <Card
          style={{
            height: 440,
            display: "flex",
            flexDirection: "column",
            borderRadius: 16,
            boxShadow: cardShadow,
            border: "none",
            fontFamily,
          }}
          actions={
            isEdit
              ? [
                  <SaveOutlined
                    key="save"
                    onClick={() => saveCard(card, data)}
                    style={{ color: primaryColor }}
                  />,
                  <CloseOutlined
                    key="cancel"
                    onClick={() => setEditingId(null)}
                    style={{ color: "#ff4d4f" }}
                  />,
                ]
              : [
                  <EditOutlined
                    key="edit"
                    onClick={() => setEditingId(card.id)}
                  />,
                  <CopyOutlined
                    key="dup"
                    onClick={() => duplicateCard(card)}
                  />,
                  <DeleteOutlined
                    key="del"
                    onClick={() => deleteCard(card)}
                    style={{ color: "#ff4d4f" }}
                  />,
                ]
          }
        >
          <div style={{ overflow: "auto", flex: 1 }}>
            {isEdit ? (
              <>
                <Input.TextArea
                  rows={2}
                  placeholder="Question"
                  value={data.description ?? ""}
                  onChange={(e) =>
                    setCardField(card.id, "description", e.target.value)
                  }
                  style={{ marginBottom: 8 }}
                />

                <Input
                  placeholder="Correct answer"
                  value={data.answer ?? ""}
                  onChange={(e) =>
                    setCardField(card.id, "answer", e.target.value)
                  }
                  style={{ marginBottom: 8 }}
                />

                {(data.wrongAnswers ?? defaultWrongArray()).map(
                  (w, idx) => (
                    <Input
                      key={idx}
                      placeholder={`Wrong answer ${idx + 1}`}
                      value={w ?? ""}
                      onChange={(e) =>
                        setWrongAnswer(card.id, idx, e.target.value)
                      }
                      style={{ marginBottom: 6 }}
                    />
                  )
                )}

                {(
                  data.wrongAnswers ?? defaultWrongArray()
                ).length < MAX_WRONG && (
                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={() => addWrongInput(card.id)}
                    style={{ marginBottom: 8 }}
                  >
                    Add wrong answer
                  </Button>
                )}

                <Input
                  type="date"
                  value={typeof data.date === "string" ? data.date : ""}
                  onChange={(e) =>
                    setCardField(card.id, "date", e.target.value)
                  }
                  style={{ marginBottom: 8 }}
                />

                <Upload
                  fileList={uploads[card.id]?.fileList ?? []}
                  beforeUpload={() => false}
                  onChange={(info) => onImageChange(card.id, info)}
                  listType="text"
                >
                  {uploads[card.id]?.fileList?.length ? null : (
                    <Button icon={<UploadOutlined />}>Upload image</Button>
                  )}
                </Upload>

                {data.imageUrl && (
                  <Image
                    src={data.imageUrl}
                    alt="img"
                    width={100}
                    height={100}
                    style={{
                      marginTop: 8,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                    unoptimized
                  />
                )}
              </>
            ) : (
              <>
                <h4>{card.description}</h4>
                <p>
                  <strong>Answer:</strong> {card.answer}
                </p>
                {card.imageUrl && (
                  <Image
                    src={card.imageUrl}
                    alt="img"
                    width={110}
                    height={110}
                    style={{
                      marginTop: 8,
                      borderRadius: 8,
                      objectFit: "cover",
                    }}
                    unoptimized
                  />
                )}
              </>
            )}
          </div>
        </Card>
      </Col>
    );
  };

  /* ---------- Bulk Panel ---------------------------------------- */
  const BulkPanel = isBulkOpen && (
    <Card style={{ marginBottom: 32, borderRadius: 16, boxShadow: cardShadow }}>
      <h3 style={{ fontFamily, marginBottom: 16 }}>Add multiple flashcards</h3>
      <Form
        form={bulkForm}
        layout="vertical"
        initialValues={{ flashcards: [{}] }}
      >
        <Form.List name="flashcards">
          {(fields, { add, remove }) => (
            <>
              {fields.map((f, i) => (
                <Card
                  key={f.key}
                  title={`Card ${i + 1}`}
                  style={{ marginBottom: 24, borderRadius: 12 }}
                  extra={
                    fields.length > 1 && (
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(f.name)}
                      >
                        Remove
                      </Button>
                    )
                  }
                >
                  <Form.Item
                    name={[f.name, "description"]}
                    label="Question"
                    rules={[{ required: true }]}
                  >
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Form.Item
                    name={[f.name, "answer"]}
                    label="Correct answer"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item label="Wrong answers">
                    <Form.List
                      name={[f.name, "wrongAnswers"]}
                      initialValue={defaultWrongArray()}
                    >
                      {(subs, { add: addW, remove: remW }) => (
                        <>
                          {subs.map((s, j) => (
                            <Form.Item
                              key={s.key}
                              name={[f.name, "wrongAnswers", s.name]}
                            >
                              <div style={{ display: "flex", gap: 8 }}>
                                <Input placeholder={`Wrong ${j + 1}`} />
                                {j >= 3 && (
                                  <MinusCircleOutlined
                                    onClick={() => remW(s.name)}
                                    style={{ color: "#ff4d4f" }}
                                  />
                                )}
                              </div>
                            </Form.Item>
                          ))}
                          {subs.length < MAX_WRONG && (
                            <Button
                              type="dashed"
                              icon={<PlusOutlined />}
                              onClick={() => addW()}
                            >
                              Add wrong answer
                            </Button>
                          )}
                        </>
                      )}
                    </Form.List>
                  </Form.Item>
                  <Form.Item name={[f.name, "date"]} label="Date (optional)">
                    <Input type="date" />
                  </Form.Item>
                  <Form.Item label="Image (optional)">
                    <Upload
                      fileList={uploads[`bulk-${i}`]?.fileList ?? []}
                      beforeUpload={() => false}
                      onChange={(info) => {
                        const { file, fileList } = info;
                        if (file.status === "removed") {
                          setUploads((p) => ({
                            ...p,
                            [`bulk-${i}`]: { fileList, imageUrl: null },
                          }));
                          return;
                        }
                        if (file.originFileObj) {
                          api
                            .uploadImage(
                              "/flashcards/upload-image",
                              file.originFileObj as File
                            )
                            .then((url) => {
                              setUploads((p) => ({
                                ...p,
                                [`bulk-${i}`]: { fileList, imageUrl: url },
                              }));
                              msgApi.success("Image uploaded");
                            })
                            .catch(() => msgApi.error("Upload failed"));
                        }
                      }}
                      listType="text"
                    >
                      {uploads[`bulk-${i}`]?.fileList?.length ? null : (
                        <Button icon={<UploadOutlined />}>Upload</Button>
                      )}
                    </Upload>
                    {uploads[`bulk-${i}`]?.imageUrl && (
                      <Image
                        src={uploads[`bulk-${i}`]!.imageUrl!}
                        alt="bulk"
                        width={90}
                        height={90}
                        style={{ marginTop: 8, borderRadius: 6 }}
                        unoptimized
                      />
                    )}
                  </Form.Item>
                </Card>
              ))}
              <Button
                block
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add()}
              >
                Add another flashcard
              </Button>
            </>
          )}
        </Form.List>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Space>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={savingBulk}
              onClick={saveBulk}
            >
              Save All
            </Button>
            <Button onClick={() => setIsBulkOpen(false)}>Cancel</Button>
          </Space>
        </div>
      </Form>
    </Card>
  );

  /* ---------- Final render -------------------------------------- */
  return (
    <>
      {contextHolder}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: 24,
          fontFamily,
        }}
      >
        {DeckHeader}
        {BulkPanel}

        <h3 style={{ marginBottom: 16, color: "#215F46" }}>Flashcards</h3>

        <Row gutter={[24, 24]}>
          {flashcards.map((c) => FlashcardCard(c))}
        </Row>

        {!flashcards.length && !isBulkOpen && (
          <div
            style={{
              textAlign: "center",
              padding: 80,
              color: "#ff0000",
              fontWeight: 700,
            }}
          >
            No flashcards yet. Click&nbsp;
            <Button type="link" icon={<PlusOutlined />} onClick={addCard}>
              Add Flashcard
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default EditDeckPage;
