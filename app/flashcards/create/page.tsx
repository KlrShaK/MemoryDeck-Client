"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Upload, Button, message, Card, Row, Col, Select, Typography } from "antd";
import { UploadOutlined, MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";

const { Text } = Typography;

type FlashcardFormValues = {
    deckTitle: string;
    flashcards: {
        question: string;
        answer: string;
        questionImageUrl?: string;
        answerImageUrl?: string;
    }[];
};

/**
 * Example image-upload function.
 * Discuss with Melih & Shak how to do image upload logic
 * in backend (endpoint URLs, form data, etc.).
 */
async function handleImageUpload(_file: File): Promise<string> {
    // e.g.:
    // const formData = new FormData();
    // formData.append("file", file);
    // const res = await apiService.post<{ imageUrl: string }>("/flashcards/upload-image", formData);
    // return res.imageUrl;

    // For now, return a placeholder for demonstration:
    console.log("Simulating image upload for file:", _file);
    return "https://placekitten.com/200/300";
}

const CreateDeckPage: React.FC = () => {
    const router = useRouter();
    const [form] = Form.useForm();
    const [bulkCount, setBulkCount] = useState<number>(1); // for the “Add X flashcards” dropdown

    /**
     * Called when user submits (clicks "Save Deck").
     * gather deckTitle + flashcards array and pass them to backend.
     *
     * Discuss with Melih & Shak how to store this deck in backend:
     *  - Endpoint: e.g. POST /decks
     *  - Body: { deckTitle, flashcards: [...] }
     */
    const onFinish = async (values: FlashcardFormValues) => {
        try {
            // Just log values so it's used and not flagged by the linter:
            console.log("Submitted values:", values);

            // e.g.:
            // await apiService.post('/decks', values);

            message.success("Deck created successfully!");
            router.push("/home"); // Return to decks listing page
        } catch (err) {
            console.error(err);
            message.error("Error creating deck.");
        }
    };

    /**
     * Because we use beforeUpload in <Upload />, we intercept the file
     * and manually handle the upload to get a URL, then store it in form state.
     *
     * Discuss with Melih & Shak how backend expects these uploads:
     *   - Auth headers?
     *   - Specific file field name?
     */
    const handleBeforeUpload = async (
        file: File,
        fieldName: [number, string]
    ) => {
        console.log("Uploading file:", file);
        try {
            const url = await handleImageUpload(file);
            form.setFieldValue(["flashcards", fieldName[0], fieldName[1]], url);
            message.success("Image uploaded!");
        } catch (err) {
            console.error(err);
            message.error("Image upload failed.");
        }
        return false;
    };

    return (
        <div
            style={{
                backgroundColor: "#cce2ba",
                minHeight: "100vh",
                padding: "20px",
            }}
        >
            <h1 style={{ textAlign: "center", marginBottom: "24px", color: "#005B33" }}>
                Create a New Deck
            </h1>

            <div
                style={{
                    maxWidth: "800px",
                    margin: "0 auto",
                    background: "#ffffff",
                    borderRadius: "8px",
                    padding: "24px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
            >
                <Form
                    layout="vertical"
                    form={form}
                    onFinish={onFinish}
                    initialValues={{
                        flashcards: [{ question: "", answer: "" }],
                    }}
                >
                    <Form.Item
                        label={<span style={{ color: "#333", fontWeight: 600 }}>Deck Title</span>}
                        name="deckTitle"
                        rules={[{ required: true, message: "Please enter a deck title!" }]}
                    >
                        <Input
                            placeholder="e.g. My Memory Deck"
                            style={{
                                backgroundColor: "#f2f2f2",
                                color: "#000",
                                border: "2px solid #005B33",
                                borderRadius: "6px",
                            }}
                        />

                    </Form.Item>

                    <Form.List
                        name="flashcards"
                        rules={[
                            {
                                validator: async (_rule, flashcards) => {
                                    if (!flashcards || flashcards.length < 1) {
                                        return Promise.reject(new Error("At least one flashcard is required."));
                                    }
                                },
                            },
                        ]}
                    >
                        {(fields, { add, remove }) => (
                            <>
                                <AnimatePresence>
                                    {fields.map(({ key, name, ...restField }, index) => (
                                        <motion.div
                                            key={key}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <Card
                                                style={{
                                                    marginBottom: "20px",
                                                    borderRadius: "8px",
                                                    backgroundColor: "#f2f2f2",
                                                    border: "2px solid #005B33",
                                                }}
                                            >
                                                <Row gutter={16} align="top">
                                                    <Col span={24}>
                                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                            <Text strong style={{ fontSize: "16px", color: "#005B33" }}>
                                                                Flashcard #{index + 1}
                                                            </Text>
                                                            {fields.length > 1 && (
                                                                <MinusCircleOutlined
                                                                    onClick={() => remove(name)}
                                                                    style={{
                                                                        fontSize: 18,
                                                                        cursor: "pointer",
                                                                        color: "red",
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    </Col>

                                                    <Col span={12}>
                                                        <Form.Item
                                                            {...restField}
                                                            label={<span style={{ color: "#333", fontWeight: 600 }}>Topic / Question</span>}
                                                            name={[name, "question"]}
                                                            rules={[{ required: true, message: "A question is required." }]}
                                                        >
                                                            <Input.TextArea
                                                                placeholder="e.g. When was I born?"
                                                                style={{
                                                                    backgroundColor: "#fff",
                                                                    color: "#000",
                                                                    height: "100px",
                                                                    resize: "none",
                                                                }}
                                                            />
                                                        </Form.Item>

                                                        <Form.Item
                                                            {...restField}
                                                            label={<span style={{ color: "#333" }}>Question Image (Optional)</span>}
                                                            name={[name, "questionImageUrl"]}
                                                        >
                                                            <Upload
                                                                showUploadList={false}
                                                                beforeUpload={(file) =>
                                                                    handleBeforeUpload(file, [name, "questionImageUrl"])
                                                                }
                                                                maxCount={1}
                                                            >
                                                                <Button
                                                                    icon={<UploadOutlined />}
                                                                    style={{ borderRadius: "4px" }}
                                                                >
                                                                    Upload
                                                                </Button>
                                                            </Upload>
                                                        </Form.Item>
                                                    </Col>

                                                    <Col span={12}>
                                                        <Form.Item
                                                            {...restField}
                                                            label={<span style={{ color: "#333", fontWeight: 600 }}>Answer / Memory</span>}
                                                            name={[name, "answer"]}
                                                            rules={[{ required: true, message: "An answer is required." }]}
                                                        >
                                                            <Input.TextArea
                                                                placeholder="e.g. 1985 in Istanbul"
                                                                style={{
                                                                    backgroundColor: "#fff",
                                                                    color: "#000",
                                                                    height: "100px",
                                                                    resize: "none",
                                                                }}
                                                            />
                                                        </Form.Item>

                                                        <Form.Item
                                                            {...restField}
                                                            label={<span style={{ color: "#333" }}>Answer Image (Optional)</span>}
                                                            name={[name, "answerImageUrl"]}
                                                        >
                                                            <Upload
                                                                showUploadList={false}
                                                                beforeUpload={(file) =>
                                                                    handleBeforeUpload(file, [name, "answerImageUrl"])
                                                                }
                                                                maxCount={1}
                                                            >
                                                                <Button
                                                                    icon={<UploadOutlined />}
                                                                    style={{ borderRadius: "4px" }}
                                                                >
                                                                    Upload
                                                                </Button>
                                                            </Upload>
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        marginBottom: "20px",
                                    }}
                                >
                                    <span style={{ color: "#333", fontWeight: 600 }}>Add</span>

                                    <Select
                                        className="createDeckCardNumberDropdown"
                                        popupClassName="dropdownCardNumberPopup"
                                        defaultValue={1}
                                        style={{ width: 60 }}
                                        onChange={(val) => setBulkCount(val)}
                                        options={[1, 2, 3, 4, 5].map((num) => ({
                                            label: num,
                                            value: num,
                                        }))}
                                    />

                                    <span style={{ color: "#333", fontWeight: 600 }}>flashcard(s):</span>

                                    <Button
                                        type="dashed"
                                        icon={<PlusOutlined />}
                                        style={{ borderRadius: "4px" }}
                                        onClick={() => {
                                            for (let i = 0; i < bulkCount; i++) {
                                                add();
                                            }
                                        }}
                                    >
                                        Add {bulkCount} Flashcard(s)
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form.List>

                    <Form.Item style={{ marginTop: "24px" }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            style={{
                                marginRight: "8px",
                                backgroundColor: "#1f7a1f",
                                borderColor: "#1f7a1f",
                                borderRadius: "4px",
                            }}
                        >
                            Save Deck
                        </Button>
                        <Button
                            danger
                            onClick={() => router.push("/home")}
                            style={{ borderRadius: "4px" }}
                        >
                            Cancel
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default CreateDeckPage;
