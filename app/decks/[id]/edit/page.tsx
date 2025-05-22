'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Affix,
  Button,
  Card,
  Col,
  Drawer,
  Divider,
  Form,
  Input,
  message,
  Popconfirm,
  Row,
  Select,
  Skeleton,
  Space,
  Switch,
  Typography,
  Upload,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  LeftOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import Image from 'next/image';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import { DatePicker } from "antd"; 
import dayjs from "dayjs"; 

import { useApi } from '@/hooks/useApi';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Deck } from '@/types/deck';
import { Flashcard } from '@/types/flashcard';
import { getApiDomain } from '@/utils/domain';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/* ----------  design tokens ---------- */
const TOKENS = {
  primary: '#2E8049',
  pageBg: '#aef5c4',    // whole viewport
  contentBg: '#d4ffdd', // inner container
  radius: 24,
  shadow: '0 8px 16px rgba(0,0,0,0.12)',
};

const DEFAULT_WRONG_ANSWERS = ['', '', ''];

interface DeckFormData {
  title: string;
  deckCategory: string;
  isPublic: boolean;
}


interface FlashcardFormData {
  description: string;
  answer: string;
  wrongAnswers: string[];
  date?: dayjs.Dayjs;
  imageUrl?: string;
}

const DeckEditPage: React.FC = () => {
  /* ----------  routing & hooks ---------- */
  const { id: deckIdParam } = useParams<{ id: string }>();
  const deckId = String(deckIdParam);
  const router = useRouter();
  const apiService = useApi();
  const domain = getApiDomain();
  const { value: userId } = useLocalStorage<string>('userId', '');
  const userIdNumber = userId ? Number(userId) : null;

  /* ----------  state ---------- */
  const [deck, setDeck] = useState<Deck | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  /* deck‑detail edit */
  const [isEditingDeckDetails, setIsEditingDeckDetails] = useState(false);
  const [savingDeck, setSavingDeck] = useState(false);
  const [deckForm] = Form.useForm();

  /* flashcard edit */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [savingCard, setSavingCard] = useState(false);
  const [cardForm] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageUrl, setImageUrl] = useState<string | undefined>();

  /* ----------  helpers ---------- */

  const isNewCard = editingCardId === 'new';

  const showError = (msg: string) => message.error(msg);
  const showSuccess = (msg: string) => message.success(msg);

  /* ----------  data fetch ---------- */
  const fetchDeckAndCards = useCallback(async () => {
    if (!userIdNumber) return;

    try {
      const [deckData, cardsData] = await Promise.all([
        apiService.get<Deck>(`/decks/${deckId}`),
        apiService.get<Flashcard[]>(`/decks/${deckId}/flashcards`),
      ]);

      setDeck(deckData);
      setFlashcards(cardsData ?? []);

      deckForm.setFieldsValue({
        title: deckData.title ?? '',
        deckCategory: deckData.deckCategory,
        isPublic: deckData.isPublic,
      });
    } catch (err) {
      console.error('Error loading deck data:', err);
      showError('Failed to load deck data.');
      router.push('/decks');
    } finally {
      setLoading(false);
    }
  }, [apiService, deckForm, deckId, router, userIdNumber]);

  useEffect(() => {
    if (!deckId) {
      showError('Invalid deck ID');
      router.push('/decks');
      return;
    }
    fetchDeckAndCards();
  }, [deckId, fetchDeckAndCards, router]);

  /* ----------  deck handlers ---------- */
  const handleDeckSave = async (values: DeckFormData) => {
    if (!deck) return;
    setSavingDeck(true);
    try {
      await apiService.put(`/decks/${deckId}`, {
        ...deck,
        title: values.title,
        deckCategory: values.deckCategory,
        isPublic: values.isPublic,
      });
      await fetchDeckAndCards();
      showSuccess('Deck updated');
      setIsEditingDeckDetails(false);
    } catch {
      showError('Failed to save deck');
    } finally {
      setSavingDeck(false);
    }
  };

  const handleDeleteDeck = async () => {

    try {
      if (!deckId) {
        showError("Deck ID is missing.");
        return;
      }

      await apiService.delete(`/decks/${deckId}`);
      showSuccess('Deck deleted');
      router.push('/decks');
    } catch (error) {
      console.error('Delete deck failed:', error);
      showError('Failed to delete deck');
    }
  };

  /* ----------  flashcard handlers ---------- */
  const openDrawerForCard = (card?: Flashcard) => {
    setDrawerOpen(true);
    if (card) {
      /* edit existing */
      setEditingCardId(card.id);
      cardForm.setFieldsValue({
        description: card.description,
        answer: card.answer,
        wrongAnswers:
          card.wrongAnswers?.length >= 3 ? card.wrongAnswers : DEFAULT_WRONG_ANSWERS,
          date: card.date ? dayjs(card.date) : null,
      });
      setImageUrl(card.imageUrl ?? undefined);
      setFileList(
        card.imageUrl
          ? [
              {
                uid: '-1',
                name: 'image',
                status: 'done',
                url: card.imageUrl,
              },
            ]
          : [],
      );
    } else {
      /* new card */
      setEditingCardId('new');
      cardForm.resetFields();
      cardForm.setFieldsValue({ wrongAnswers: DEFAULT_WRONG_ANSWERS });
      setImageUrl(undefined);
      setFileList([]);
    }
  };

  const saveFlashcard = async () => {
    try {
      await cardForm.validateFields();
      const values = cardForm.getFieldsValue() as FlashcardFormData;

      const wrongAnswers = (values.wrongAnswers ?? [])
        .map((w) => w.trim())
        .filter(Boolean);

      if (wrongAnswers.length < 3) {
        showError('Provide at least 3 wrong answers');
        return;
      }
      if (wrongAnswers.includes(values.answer.trim())) {
        showError('Correct answer must not be in wrong answers');
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
      }

      const payload = {
        description: values.description.trim(),
        answer: values.answer.trim(),
        wrongAnswers,
        date: values.date ? values.date.format('YYYY-MM-DD') : null,
        imageUrl: finalImageUrl ?? null,
        flashcardCategory: deck?.deckCategory,
      };

      setSavingCard(true);
      if (isNewCard) {
        await apiService.post(`/decks/${deckId}/flashcards/addFlashcard`, payload);
        showSuccess('Flashcard created');
      } else {
        await apiService.put(`/flashcards/${editingCardId}`, payload);
        showSuccess('Flashcard updated');
      }
      await fetchDeckAndCards();
      setDrawerOpen(false);
    } catch {
      /* form validation errors are shown automatically */
    } finally {
      setSavingCard(false);
    }
  };

  const handleDeleteFlashcard = async (id: string) => {
    try {
      await apiService.delete(`/decks/${deckId}/flashcards/${id}`);
      setFlashcards((prev) => prev.filter((c) => c.id !== id));
      showSuccess('Flashcard deleted');
    } catch {
      showError('Delete failed');
    }
  };

  /* ----------  upload ---------- */
  const handleImageChange = async (info: UploadChangeParam<UploadFile>) => {
    const { file, fileList: newFileList } = info;
    setFileList(newFileList);

    if (file.status === 'removed') {
      // user clicked X on the thumbnail
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
        showSuccess('Image uploaded');
      } catch {
        showError('Upload failed');
        setFileList([]);
      }
    }
  };

  const handleDeleteImage = async () => {
    if (imageUrl) {
      try {
        await apiService.delete(`/flashcards/delete-image?imageUrl=${encodeURIComponent(imageUrl)}`);
        setImageUrl(undefined);
        setFileList([]);
        message.success("Image removed successfully");
      } catch {
        message.error("Failed to remove image.");
      }
    }
  };

  /* ----------  memo ---------- */
  const deckTitle = useMemo(() => deck?.title ?? 'Untitled deck', [deck]);

  /* ----------  render ---------- */
  if (loading) {
    return (
      <div
        style={{
          background: TOKENS.pageBg,
          minHeight: '100vh',
          padding: '40px 20px',
        }}
      >
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  return (
    <div
      style={{
        background: TOKENS.pageBg,
        minHeight: '100vh',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* ----------  sticky header ---------- */}
      <Affix offsetTop={0}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            background: '#fff',
            boxShadow: TOKENS.shadow,
          }}
        >
          <Space>
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={() => router.push('/decks')}
            />
            <Title level={4} style={{ margin: 0, color: 'black' }}>
              {deckTitle}
            </Title>
          </Space>

          {!isEditingDeckDetails && (
            <Popconfirm
              placement="left"
              title="Delete deck?"
              description="All flashcards will be removed"
              onConfirm={() => handleDeleteDeck()}
              okType="danger"
            >
              <Button danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </div>
      </Affix>

      {/* ----------  main content ---------- */}
      <div
        style={{
          
          minHeight: '100%',
          padding: '80px 20px 40px',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Row gutter={24}>
            {/* -------  left: deck details ------- */}
            <Col xs={24} md={8}>
              <Card
                style={{
                  marginBottom: 24,
                  borderRadius: TOKENS.radius,
                  boxShadow: TOKENS.shadow,
                  background: 'white',   
                }}
                bodyStyle={{ padding: 24 }}
              >
                {isEditingDeckDetails ? (
                  <Form
                    form={deckForm}
                    layout="vertical"
                    onFinish={handleDeckSave}
                  >
                    <Form.Item
                      name="title"
                      label={<span style={{ color: 'black' }}>Deck Title</span>}
                      rules={[{ required: true }]}
                    >
                      <Input style={{ backgroundColor: 'white', color: 'black', borderRadius: 10 }} />
                    </Form.Item>

                    <Form.Item
                      name="deckCategory"
                      label={<span style={{ color: 'black' }}>Category</span>}
                      rules={[{ required: true }]}
                    >
                      <Select 
                      placeholder="Category" 
                      popupMatchSelectWidth={false} 
                      style={{
                        backgroundColor: 'white',
                        color: 'black',
                        borderRadius: 10,
                      }}
                      dropdownStyle={{
                        backgroundColor: 'white',
                      }}
                      >
                        {[
                          'MOMENTS',
                          'SPORTS',
                          'ANIMALS',
                          'PLACES',
                          'FOODS',
                          'SCIENCE',
                          'MATH',
                          'HISTORY',
                          'LANGUAGE',
                          'TECHNOLOGY',
                          'OTHERS',
                          'MIXED',
                        ].map((c) => (
                          <Option key={c} value={c} style={{
                            color: 'black',            
                            backgroundColor: 'white', 
                          }}>
                            {c}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="isPublic"
                      valuePropName="checked"
                      label={<span style={{ color: 'black' }}>Public</span>}
                    >
                      <Switch />
                    </Form.Item>

                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={savingDeck}
                        icon={<SaveOutlined />}
                        style={{
                          background: TOKENS.primary,
                          borderColor: TOKENS.primary,
                        }}
                      >
                        Save
                      </Button>
                      <Button onClick={() => setIsEditingDeckDetails(false)}>
                        Cancel
                      </Button>
                    </Space>
                  </Form>
                ) : (
                  <>
                    <Space direction="vertical" size={4} style={{ fontSize: 16 }}>
                      <Text type="secondary" style={{ color: 'black' }}>
                        Category: {deck?.deckCategory}
                      </Text>
                      <Text type="secondary" style={{ color: 'black' }}>
                        Status: {deck?.isPublic ? 'Public' : 'Private'}
                      </Text>
                    </Space>
                    <Divider />
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => setIsEditingDeckDetails(true)}
                    >
                      Edit deck details
                    </Button>
                  </>
                )}
              </Card>
            </Col>

            {/* -------  right: flashcards grid ------- */}
            <Col xs={24} md={16}>
              {!isEditingDeckDetails && (
                <>
                  <Space
                    style={{ marginBottom: 16 }}
                    align="center"
                    className="w-full justify-between"
                  >
                    <Title level={4} style={{ margin: 0, color: "black" }}>
                      Flashcards ({flashcards.length})
                    </Title>

                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      style={{
                        background: TOKENS.primary,
                        borderColor: TOKENS.primary,
                      }}
                      onClick={() => openDrawerForCard()}
                    >
                      Add flashcard
                    </Button>
                  </Space>

                  <Row gutter={[16, 16]}>
                    {flashcards.length ? (
                      flashcards.map((card) => (
                        <Col xs={24} sm={12} lg={8} key={card.id}>
                            <Card
                              hoverable
                              style={{
                                height: 240,
                                borderRadius: TOKENS.radius,
                                boxShadow: TOKENS.shadow,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                background: 'white',
                                transition: 'transform 0.2s',
                              }}
                              onClick={() => openDrawerForCard(card)}
                              cover={
                                card.imageUrl && (
                                  <div
                                    style={{
                                      height: 120,
                                      overflow: 'hidden',
                                      display: 'flex',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      background: '#f5f5f5',
                                      borderTopLeftRadius: TOKENS.radius,
                                      borderTopRightRadius: TOKENS.radius,
                                    }}
                                  >
                                    <Image
                                      // src={card.imageUrl}
                                      src = {`${domain}/flashcards/image?imageUrl=${encodeURIComponent(card.imageUrl)}`}
                                      alt="cover"
                                      width={140}
                                      height={120}
                                      style={{ objectFit: 'cover' }}
                                      unoptimized
                                    />
                                  </div>
                                )
                              }
                            >
                              <div style={{ flex: 1, overflow: 'hidden' }}>
                                <Text
                                  strong
                                  style={{
                                    WebkitLineClamp: 2,
                                    display: '-webkit-box',
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    color: 'black',
                                  }}
                                >
                                  {card.description}
                                </Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Answer: {card.answer}
                                </Text>
                              </div>

                              {/* custom footer with white icon buttons */}
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  marginTop: 12,
                                }}
                              >
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDrawerForCard(card);
                                  }}
                                  style={{
                                    background: 'white',
                                    borderRadius: '50%',
                                    padding: 8,
                                    display: 'inline-flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    boxShadow: TOKENS.shadow,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <EditOutlined style={{ color: '#2E8049' }}/>
                                </span>

                                <Popconfirm
                                   title={<span style={{ color: 'black' }}>Delete flashcard?</span>}
                                  onConfirm={() => handleDeleteFlashcard(card.id)}
                                  okType="danger"
                                >
                                  <span
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      background: 'white',
                                      borderRadius: '50%',
                                      padding: 8,
                                      display: 'inline-flex',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      boxShadow: TOKENS.shadow,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <DeleteOutlined style={{ color: 'red' }} />
                                  </span>
                                </Popconfirm>
                              </div>
                            </Card>
                          </Col>

                      ))
                    ) : (
                      <Col span={24}>
                        <Card
                          style={{
                            textAlign: 'center',
                            padding: '60px 0',
                            borderRadius: TOKENS.radius,
                            background: "white",
                            boxShadow: TOKENS.shadow,
                          }}
                        >
                          <Title level={4} style={{ color: 'black' }}>No flashcards yet</Title>
                          <Text type="secondary">
                            Get started by adding your first flashcard
                          </Text>
                          <div style={{ marginTop: 24 }}>
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              style={{
                                background: TOKENS.primary,
                                borderColor: TOKENS.primary,
                              }}
                              onClick={() => openDrawerForCard()}
                            >
                              Add your first flashcard
                            </Button>
                          </div>
                        </Card>
                      </Col>
                    )}
                  </Row>
                </>
              )}
            </Col>
          </Row>
        </div>
      </div>

      {/* ----------  drawer for add/edit ---------- */}
      <Drawer
        destroyOnClose
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={460}
        title={isNewCard ? 'Add flashcard' : 'Edit flashcard'}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              loading={savingCard}
              icon={<SaveOutlined />}
              onClick={saveFlashcard}
              style={{
                background: TOKENS.primary,
                borderColor: TOKENS.primary,
              }}
            >
              {isNewCard ? 'Create' : 'Save'}
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

          <Divider orientation="left">Wrong answers (min 3) </Divider>

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
          {imageUrl ? (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <Image
                    src={`${domain}/flashcards/image?imageUrl=${encodeURIComponent(imageUrl)}`}
                    alt="Flashcard"
                    width={260}
                    height={180}
                    style={{
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid #eee',
                    }}
                    unoptimized
                  />
                  <div>
                  <Button
                    type="link"
                    icon={<DeleteOutlined />}
                    // className="delete-button"
                    style={{color: "#ff4000" }}
                    onClick={handleDeleteImage}
                  />
                  </div>
                </div>
              ) : (
                <Upload
                  fileList={fileList}
                  beforeUpload={() => false}
                  onChange={handleImageChange}
                  listType="picture-card"
                >
                  {fileList.length >= 1 ? null : <Button icon={<UploadOutlined />}>Upload Image</Button>}
                </Upload>
              )}
          <Form.Item label="Image (optional)">

          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default DeckEditPage;