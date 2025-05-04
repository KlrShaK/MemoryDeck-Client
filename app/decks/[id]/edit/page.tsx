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
import { useRouter, useParams } from "next/navigation";

import { useApi } from "@/hooks/useApi";
import { Deck } from "@/types/deck";
import { Flashcard } from "@/types/flashcard";
import type {
  UploadChangeParam,
  UploadFile,
} from "antd/es/upload/interface";

const { Option } = Select;

/* ------------------------------------------------------------------ */
/*                            Main Page                               */
/* ------------------------------------------------------------------ */
const EditDeckPage: React.FC = () => {
  /* ---------- routing / api -------------------------------------- */
  const router = useRouter();
  const { id: deckId } = useParams<{ id: string }>();
  const api = useApi();

  /* ---------- deck meta ------------------------------------------ */
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [deckForm] = Form.useForm();

  /* ---------- flashcards ----------------------------------------- */
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cardForms, setCardForms] = useState<
    Record<string, Partial<Flashcard>>
  >({});
  const [uploads, setUploads] = useState<
    Record<string, { fileList: UploadFile[]; imageUrl: string | null }>
  >({});

  /* ---------- bulk add ------------------------------------------- */
  const [bulkForm] = Form.useForm();
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);

  /* ---------- misc ----------------------------------------------- */
  const [loading, setLoading] = useState(true);

  /* =============================================================== */
  /*                         data loading                            */
  /* =============================================================== */
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

        /* prime per‑card form cache */
        const map: Record<string, Partial<Flashcard>> = {};
        cards.forEach((c) => (map[c.id] = { ...c }));
        setCardForms(map);
      } catch (e) {
        message.error("Failed to load deck");
        router.push("/decks");
      } finally {
        setLoading(false);
      }
    })();
  }, [deckId, api, router]);

  /* =============================================================== */
  /*                       deck meta editing                         */
  /* =============================================================== */
  /* populate the form only *after* the edit panel is open */
  useEffect(() => {
    if (isEditingMeta && deck) {
      deckForm.setFieldsValue({
        title: deck.title,
        deckCategory: deck.deckCategory,
      });
    }
  }, [isEditingMeta, deck, deckForm]);

  const saveDeckMeta = async () => {
    try {
      const values = await deckForm.validateFields();
      await api.put(`/decks/${deckId}`, {
        ...deck,
        title: values.title,
        deckCategory: values.deckCategory,
      });
      setDeck((prev) =>
        prev ? { ...prev, ...values } : prev
      );
      /* cascade category change down to each card */
      setFlashcards((prev) =>
        prev.map((c) => ({
          ...c,
          flashcardCategory: values.deckCategory,
        }))
      );
      message.success("Deck updated");
      setIsEditingMeta(false);
    } catch {
      message.error("Failed to update deck");
    }
  };

  /* =============================================================== */
  /*                  per‑card helpers (edit flow)                   */
  /* =============================================================== */
  const updateCardField = (
    id: string,
    field: keyof Flashcard,
    value: any
  ) => {
    setCardForms((p) => ({ ...p, [id]: { ...p[id], [field]: value } }));
  };

  const updateWrongAnswer = (
    id: string,
    idx: number,
    value: string
  ) => {
    const wrong = [...(cardForms[id].wrongAnswers ?? [])];
    wrong[idx] = value;
    updateCardField(id, "wrongAnswers", wrong);
  };

  const onImageChange = (
    id: string,
    info: UploadChangeParam<UploadFile>
  ) => {
    const { file, fileList } = info;

    if (file.status === "removed") {
      setUploads((p) => ({ ...p, [id]: { fileList, imageUrl: null } }));
      updateCardField(id, "imageUrl", null);
      return;
    }
    if (file.originFileObj) {
      (async () => {
        try {
          const url = await api.uploadImage(
            "/flashcards/upload-image",
            file.originFileObj as File
          );
          setUploads((p) => ({ ...p, [id]: { fileList, imageUrl: url } }));
          updateCardField(id, "imageUrl", url);
          message.success("Image uploaded");
        } catch {
          message.error("Upload failed");
        }
      })();
    }
  };

  const saveCard = async (card: Flashcard, formData: Partial<Flashcard>) => {
    /* distinguish existing vs brand‑new card (temp id starts with "new‑") */
    const body = {
      ...card,
      ...formData,
      wrongAnswers: (formData.wrongAnswers ?? []).filter((x) => x?.trim()),
    };

    try {
      if (card.id.startsWith("new-")) {
        const created = await api.post<Flashcard>(
          `/decks/${deckId}/flashcards/addFlashcard`,
          body
        );
        /* replace temp card with server card */
        setFlashcards((prev) =>
          prev.map((c) => (c.id === card.id ? created : c))
        );
        setCardForms((p) => {
          const { [card.id]: _, ...rest } = p;
          return { ...rest, [created.id]: { ...created } };
        });
      } else {
        await api.put(`/flashcards/${card.id}`, body);
        setFlashcards((prev) =>
          prev.map((c) => (c.id === card.id ? ({ ...c, ...body } as Flashcard) : c))
        );
      }
      message.success("Flashcard saved");
      setEditingId(null);
    } catch {
      message.error("Could not save flashcard");
    }
  };

  const deleteCard = async (card: Flashcard) => {
    if (!card.id.startsWith("new-")) {
      try {
        await api.delete(
          `/decks/${deckId}/flashcards/${card.id}`
        );
      } catch {
        message.error("Delete failed");
        return;
      }
    }
    setFlashcards((p) => p.filter((c) => c.id !== card.id));
    setEditingId(null);
    message.success("Deleted");
  };

  const duplicateCard = (src: Flashcard) => {
    const tempId = `new-${Date.now()}`;
    setFlashcards((p) => [
      ...p,
      { ...src, id: tempId, date: "" },
    ]);
    setCardForms((p) => ({
      ...p,
      [tempId]: {
        ...src,
        id: tempId,
        date: "",
      },
    }));
    setEditingId(tempId);
  };

  const addNewCard = () => {
    const tempId = `new-${Date.now()}`;
    setFlashcards((p) => [
      ...p,
      {
        id: tempId,
        description: "",
        answer: "",
        wrongAnswers: ["", "", ""],
        date: "",
        imageUrl: null,
        flashcardCategory: deck?.deckCategory ?? "MIXED",
      } as unknown as Flashcard,
    ]);
    setCardForms((p) => ({
      ...p,
      [tempId]: {
        description: "",
        answer: "",
        wrongAnswers: ["", "", ""],
        date: "",
        imageUrl: null,
      },
    }));
    setEditingId(tempId);
  };

  /* =============================================================== */
  /*                        bulk add  (optional)                     */
  /* =============================================================== */
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
        message.error("Please fill at least one card");
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
      message.success(`Added ${cards.length} cards`);
      /* reload list */
      const fresh = await api.get<Flashcard[]>(
        `/decks/${deckId}/flashcards`
      );
      setFlashcards(fresh);
      const map: Record<string, Partial<Flashcard>> = {};
      fresh.forEach((c) => (map[c.id] = { ...c }));
      setCardForms(map);
      setIsBulkOpen(false);
    } catch {
      message.error("Bulk save failed");
    } finally {
      setSavingBulk(false);
    }
  };

  /* =============================================================== */
  /*                                UI                               */
  /* =============================================================== */
  if (loading) {
    return (
      <div style={{ padding: 80, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  /* -------- deck header ----------------------------------------- */
  const DeckHeader = (
    <Card style={{ marginBottom: 24 }}>
      {isEditingMeta ? (
        <Form
          form={deckForm}
          layout="inline"
          onFinish={saveDeckMeta}
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
                <Option key={c}>{c}</Option>
              ))}
            </Select>
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
          >
            Save
          </Button>
          <Button
            onClick={() => setIsEditingMeta(false)}
            icon={<CloseOutlined />}
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
            <div style={{ color: "#666" }}>
              Category: {deck?.deckCategory}
            </div>
          </div>

          <Space>
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={addNewCard}
            >
              Add Flashcard
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsBulkOpen(true)}
            >
              Bulk Add
            </Button>
          </Space>
        </div>
      )}
    </Card>
  );

  /* -------- individual flashcard card --------------------------- */
  const renderCard = (card: Flashcard) => {
    const isEdit = editingId === card.id;
    const data = cardForms[card.id] ?? {};

    return (
      <Col xs={24} sm={12} md={8} key={card.id}>
        <Card
          style={{
            height: 420,
            display: "flex",
            flexDirection: "column",
          }}
          actions={
            isEdit
              ? [
                  <SaveOutlined
                    key="save"
                    onClick={() => saveCard(card, data)}
                    style={{ color: "#52c41a" }}
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
                  value={data.description}
                  onChange={(e) =>
                    updateCardField(card.id, "description", e.target.value)
                  }
                  style={{ marginBottom: 8 }}
                />
                <Input
                  placeholder="Correct answer"
                  value={data.answer}
                  onChange={(e) =>
                    updateCardField(card.id, "answer", e.target.value)
                  }
                  style={{ marginBottom: 8 }}
                />
                {(data.wrongAnswers ?? []).map((w, idx) => (
                  <Input
                    key={idx}
                    placeholder={`Wrong answer ${idx + 1}`}
                    value={w}
                    onChange={(e) =>
                      updateWrongAnswer(card.id, idx, e.target.value)
                    }
                    style={{ marginBottom: 6 }}
                  />
                ))}
                <Input
                  type="date"
                  value={data.date}
                  onChange={(e) =>
                    updateCardField(card.id, "date", e.target.value)
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
                    width={90}
                    height={90}
                    style={{
                      marginTop: 8,
                      objectFit: "cover",
                      borderRadius: 6,
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
                    width={100}
                    height={100}
                    style={{
                      marginTop: 8,
                      borderRadius: 6,
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

  /* -------- bulk add panel -------------------------------------- */
  const BulkPanel = isBulkOpen && (
    <Card style={{ marginBottom: 32 }}>
      <h3>Add multiple flashcards</h3>
      <Form form={bulkForm} layout="vertical" initialValues={{ flashcards: [{}] }}>
        <Form.List name="flashcards">
          {(fields, { add, remove }) => (
            <>
              {fields.map((f, i) => (
                <Card
                  key={f.key}
                  title={`Card ${i + 1}`}
                  style={{ marginBottom: 24 }}
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
                      initialValue={["", "", ""]}
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
                          {subs.length < 6 && (
                            <Button
                              type="dashed"
                              onClick={() => addW()}
                              icon={<PlusOutlined />}
                            >
                              Add wrong answer
                            </Button>
                          )}
                        </>
                      )}
                    </Form.List>
                  </Form.Item>
                  <Form.Item
                    name={[f.name, "date"]}
                    label="Date (optional)"
                  >
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
                              message.success("Image uploaded");
                            })
                            .catch(() =>
                              message.error("Upload failed")
                            );
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
                onClick={() => add()}
                icon={<PlusOutlined />}
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

  /* -------- final render ---------------------------------------- */
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      {DeckHeader}

      {BulkPanel}

      <h3 style={{ marginBottom: 16 }}>Flashcards</h3>
      <Row gutter={[16, 16]}>
        {flashcards.map((c) => renderCard(c))}
      </Row>

      {!flashcards.length && !isBulkOpen && (
        <div
          style={{
            marginTop: 32,
            padding: 48,
            textAlign: "center",
            background: "#fafafa",
            borderRadius: 8,
          }}
        >
          <p>No flashcards yet.</p>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addNewCard}
          >
            Add First Flashcard
          </Button>
        </div>
      )}
    </div>
  );
};

export default EditDeckPage;
