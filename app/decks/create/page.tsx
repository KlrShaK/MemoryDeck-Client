// // create a deck
"use client";

import React, { useState } from "react";
import {
    Checkbox,
    Card,
    Form,
    Input,
    Button,
    Select,
    InputNumber,
    message,
    Space,
    Upload
} from "antd";
import { MinusCircleOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";

const { Option } = Select;

const AddDeckPage: React.FC = () => {
    const [form] = Form.useForm();
    const [isAiEnabled, setIsAiEnabled] = useState(false);
    const router = useRouter();
    const apiService = useApi();
    const { value: userId } = useLocalStorage<string>("userId", "");
    const userIdAsNumber = Number(userId);

    if (isNaN(userIdAsNumber)) {
        message.error("Invalid user id. Please log in again.");
        router.push("/login");
        return null;
    }

    const handleAddDeck = async (values: any) => {
        try {
            const deckDTO = {
                title: values.title,
                deckCategory: values.deckCategory,
                isPublic: values.isPublic ?? false,
                isAiGenerated: values.isAiGenerated ?? false,
                aiPrompt: values.aiPrompt ?? "",
                numberofAICards: values.numberofAICards ?? null,
            };

            const createdDeck = await apiService.post<{ id: number }>(
                `/decks/addDeck?userId=${userIdAsNumber}`,
                deckDTO
            );

            if (values.flashcards?.length) {
                await Promise.all(
                    values.flashcards.map(async (fc: any) => {
                        let imageUrl = null;
                        if (fc.imageFile && fc.imageFile.file) {
                            const formData = new FormData();
                            formData.append("file", fc.imageFile.file);

                            const uploadRes = await fetch("http://localhost:8080/flashcards/upload-image", {
                                method: "POST",
                                body: formData,
                            });
                            if (!uploadRes.ok) {
                                throw new Error("Image upload failed");
                            }
                            imageUrl = await uploadRes.text();
                        }

                        return apiService.post(`/decks/${createdDeck.id}/flashcards/addFlashcard`, {
                            deck: { id: createdDeck.id },
                            imageUrl,
                            description: fc.question ?? null,
                            date: new Date().toISOString().split("T")[0],
                            answer: fc.answer,
                            flashcardCategory: values.deckCategory,
                            wrongAnswers: fc.wrongAnswers?.filter((w: string) => w?.trim()) ?? [],
                        });
                    })
                );
            }

            message.success("Deck and flashcards added successfully!");
            router.push("/decks");
        } catch (error) {
            console.error("Error adding deck:", error);
            message.error("Failed to add deck.");
        }
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
            <Card title="Add New Deck" style={{ width: 600 }}>
                <Form
                    form={form}
                    onFinish={handleAddDeck}
                    layout="vertical"
                    initialValues={{ numberofAICards: 5, flashcards: [] }}
                    onValuesChange={(changed) => {
                        if ("isAiGenerated" in changed) {
                            setIsAiEnabled(changed.isAiGenerated);
                        }
                    }}
                >
                    <Form.Item label="Title" required>
                        <Form.Item
                            name="title"
                            noStyle
                            rules={[{ required: true, message: "Please enter Title" }]}
                        >
                            <Input placeholder="Deck title" />
                        </Form.Item>
                    </Form.Item>
                    <Form.Item label="Deck Category" required>
                        <Form.Item
                            name="deckCategory"
                            noStyle
                            rules={[{ required: true, message: "Please enter Deck Category" }]}
                        >
                            <Select placeholder="Select a category">
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
                    </Form.Item>

                    <Form.Item name="isPublic" valuePropName="checked"> <Checkbox>Public</Checkbox> </Form.Item>
                    <Form.Item name="isAiGenerated" valuePropName="checked"> <Checkbox>Generate with AI</Checkbox> </Form.Item>
                    <Form.Item label="AI Prompt" name="aiPrompt" rules={[({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!getFieldValue("isAiGenerated") || (value && value.trim() !== "")) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error("AI Prompt is required when enabled"));
                        },
                    })]}> <Input.TextArea disabled={!isAiEnabled} /> </Form.Item>
                    <Form.Item label="Number of Cards to Generate" name="numberofAICards" rules={[({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!getFieldValue("isAiGenerated") || (value && value > 0)) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error("Enter a valid number"));
                        },
                    })]}> <InputNumber min={1} disabled={!isAiEnabled} style={{ width: "100%" }} /> </Form.Item>

                    <Form.List name="flashcards">
                        {(fields, { add, remove }) => (
                            <>
                                <h3 style={{ marginTop: "20px", color: "darkgreen" }}>Flashcards</h3>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} direction="vertical" style={{ display: "block", marginBottom: 16 }}>

                                        {/* Question */}
                                        <Form.Item label="Question" required>
                                            <Form.Item
                                                {...restField}
                                                name={[name, "question"]}
                                                noStyle
                                                rules={[{ required: true, message: "Please enter Question" }]}
                                            >
                                                <Input placeholder="Enter question" />
                                            </Form.Item>
                                        </Form.Item>

                                        {/* Answer */}
                                        <Form.Item label="Answer" required>
                                            <Form.Item
                                                {...restField}
                                                name={[name, "answer"]}
                                                noStyle
                                                rules={[{ required: true, message: "Please enter Answer" }]}
                                            >
                                                <Input placeholder="Enter answer" />
                                            </Form.Item>
                                        </Form.Item>

                                        {/* Description (optional) */}
                                        <Form.Item {...restField} name={[name, "description"]} label="Description">
                                            <Input.TextArea placeholder="Optional explanation or context" />
                                        </Form.Item>

                                        {/* Image upload */}
                                        <Form.Item name={[name, "imageFile"]} label="Upload Image">
                                            <Upload maxCount={1} beforeUpload={() => false} listType="picture">
                                                <Button icon={<UploadOutlined />}>Select File</Button>
                                            </Upload>
                                        </Form.Item>

                                        {/* Wrong Answers */}
                                        <Form.List name={[name, "wrongAnswers"]}>
                                            {(wrongFields, { add: addWrong, remove: removeWrong }) => (
                                                <>
                                                    {wrongFields.map((field, idx) => (
                                                        <Form.Item
                                                            key={field.key}
                                                            label={idx === 0 ? "Wrong Answers" : ""}
                                                            required
                                                        >
                                                            <Form.Item
                                                                {...field}
                                                                noStyle
                                                                rules={[{ required: true, message: "Enter a wrong answer" }]}
                                                            >
                                                                <Input
                                                                    placeholder="Wrong answer"
                                                                    addonAfter={
                                                                        <MinusCircleOutlined onClick={() => removeWrong(field.name)} />
                                                                    }
                                                                />
                                                            </Form.Item>
                                                        </Form.Item>
                                                    ))}
                                                    <Form.Item>
                                                        <Button
                                                            type="dashed"
                                                            onClick={() => addWrong()}
                                                            icon={<PlusOutlined />}
                                                        >
                                                            Add Wrong Answer
                                                        </Button>
                                                    </Form.Item>
                                                </>
                                            )}
                                        </Form.List>

                                        <Button
                                            danger
                                            type="link"
                                            icon={<MinusCircleOutlined />}
                                            onClick={() => remove(name)}
                                        >
                                            Remove Flashcard
                                        </Button>
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        Add Flashcard
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>


                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <Button onClick={() => router.push("/decks")}>Cancel</Button>
                        <Button type="primary" htmlType="submit">Save Deck</Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default AddDeckPage;






//
// "use client";
//
// import React, { useState } from "react";
// import { Checkbox, Card, Form, Input, Button, Select, InputNumber, message } from "antd";
// import { useRouter } from "next/navigation";
// import { useApi } from "@/hooks/useApi";
// import useLocalStorage from "@/hooks/useLocalStorage";
//
// const { Option } = Select;
//
// type DeckFormValues = {
//     title: string;
//     deckCategory: string;
//     isPublic?: boolean;
//     isAiGenerated?: boolean;
//     aiPrompt?: string;
//     numberofAICards?: number;
// };
//
// const AddDeckPage: React.FC = () => {
//     const [form] = Form.useForm();
//     const [isAiEnabled, setIsAiEnabled] = useState(false);
//     const router = useRouter();
//     const apiService = useApi();
//
//     const { value: userId } = useLocalStorage<string>("userId", "");
//     const userIdAsNumber = Number(userId);
//
//     if (isNaN(userIdAsNumber)) {
//         message.error("Invalid user id. Please log in again.");
//         router.push("/login");
//         return null;
//     }
//
//     const handleAddDeck = async (values: DeckFormValues) => {
//         console.log("Submitted form values:", values);
//         try {
//             if (values.isPublic == null) {
//                 values.isPublic = false;
//             }
//             const deckDTO = {
//                 title: values.title,
//                 deckCategory: values.deckCategory,
//                 isPublic: values.isPublic,
//                 isAiGenerated: values.isAiGenerated || false,
//                 aiPrompt: values.aiPrompt || "",
//                 numberofAICards: values.numberofAICards || null,
//             };
//
//             console.log("Sending deckDTO:", deckDTO);
//             await apiService.post(`/decks/addDeck?userId=${userIdAsNumber}`, deckDTO);
//             message.success("Deck added successfully!");
//             router.push("/decks");
//         } catch (error) {
//             console.error("Error adding deck:", error);
//             message.error("Failed to add deck.");
//         }
//     };
//
//     return (
//         <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
//             <Card title="Add New Deck" style={{ width: 400 }}>
//                 <Form
//                     form={form}
//                     onFinish={handleAddDeck}
//                     onValuesChange={(changed, all) => {
//                         if ("isAiGenerated" in changed) {
//                             setIsAiEnabled(changed.isAiGenerated);
//                             console.log("isAiGenerated changed:", changed.isAiGenerated);
//                         }
//                         if ("numberofAICards" in changed) {
//                             console.log("numberofAICards changed:", changed.numberofAICards);
//                         }
//                         console.log("All form values:", all);
//                     }}
//                     layout="vertical"
//                     initialValues={{ numberofAICards: 5 }}
//                 >
//                     <Form.Item
//                         label="Title"
//                         name="title"
//                         rules={[{ required: true, message: "Title is required" }]}
//                     >
//                         <Input />
//                     </Form.Item>
//
//                     <Form.Item
//                         label="Deck Category"
//                         name="deckCategory"
//                         rules={[{ required: true, message: "Deck Category is required" }]}
//                     >
//                         <Select placeholder="Select a category">
//                             <Option value="MOMENTS">Moments</Option>
//                             <Option value="SPORTS">Sports</Option>
//                             <Option value="ANIMALS">Animals</Option>
//                             <Option value="PLACES">Places</Option>
//                             <Option value="FOODS">Foods</Option>
//                             <Option value="SCIENCE">Science</Option>
//                             <Option value="MATH">Math</Option>
//                             <Option value="HISTORY">History</Option>
//                             <Option value="LANGUAGE">Language</Option>
//                             <Option value="TECHNOLOGY">Technology</Option>
//                             <Option value="OTHERS">Others</Option>
//                             <Option value="MIXED">Mixed</Option>
//                         </Select>
//                     </Form.Item>
//
//                     <Form.Item name="isPublic" valuePropName="checked">
//                         <Checkbox>Public</Checkbox>
//                     </Form.Item>
//
//                     <Form.Item name="isAiGenerated" valuePropName="checked">
//                         <Checkbox>Generate with AI</Checkbox>
//                     </Form.Item>
//
//                     {/* AI Prompt Field */}
//                     <Form.Item
//                         label="AI Prompt"
//                         name="aiPrompt"
//                         dependencies={['isAiGenerated']}
//                         rules={[
//                             ({ getFieldValue }) => ({
//                                 validator(_, value) {
//                                     if (!getFieldValue("isAiGenerated") || (value && value.trim() !== "")) {
//                                         return Promise.resolve();
//                                     }
//                                     return Promise.reject(new Error("AI Prompt is required when generating with AI"));
//                                 },
//                             }),
//                         ]}
//                     >
//                         <Input.TextArea placeholder="Enter your prompt for AI deck generation" disabled={!isAiEnabled} />
//                     </Form.Item>
//
//                     {/* Number of Cards Field */}
//                     <Form.Item
//                         label="Number of Cards to Generate"
//                         name="numberofAICards"
//                         dependencies={['isAiGenerated']}
//                         rules={[
//                             ({ getFieldValue }) => ({
//                                 validator(_, value) {
//                                     if (!getFieldValue("isAiGenerated") || (value && value > 0)) {
//                                         return Promise.resolve();
//                                     }
//                                     return Promise.reject(new Error("Please specify number of cards to generate"));
//                                 },
//                             }),
//                         ]}
//                     >
//                         <InputNumber
//                             min={1}
//                             style={{ width: "100%" }}
//                             disabled={!isAiEnabled}
//                             onChange={(value) => console.log("InputNumber onChange:", value)}
//                         />
//                     </Form.Item>
//
//                     <Button type="primary" htmlType="submit">
//                         Save Deck
//                     </Button>
//                     <Button style={{ marginLeft: "10px" }} onClick={() => router.push("/decks")}>
//                         Cancel
//                     </Button>
//                 </Form>
//             </Card>
//         </div>
//     );
// };
//
// export default AddDeckPage;