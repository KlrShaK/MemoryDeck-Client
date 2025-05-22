// "use client";

// import React, { useEffect, useState } from "react";
// import { useRouter, useParams } from "next/navigation";
// import { useApi } from "@/hooks/useApi";
// import { Flashcard } from "@/types/flashcard";
// import { Button, Drawer, Form, Input, Space, Divider, message, Upload } from "antd";
// import { EditOutlined, DeleteOutlined, PlusOutlined, SaveOutlined, UploadOutlined, MinusCircleOutlined } from "@ant-design/icons";
// import { Deck } from "@/types/deck";
// import Image from "next/image";
// import type { UploadChangeParam, UploadFile } from "antd/es/upload/interface";
// import { DatePicker } from "antd"; 
// import dayjs from "dayjs";
// import { getApiDomain } from "@/utils/domain";

// const { TextArea } = Input;

// // Default wrong answers for new/reset forms
// const DEFAULT_WRONG_ANSWERS = ['', '', ''];

// const FlashcardsPage: React.FC = () => {
//   const router = useRouter();
//   const apiService = useApi();
//   const domain = getApiDomain();
//   const { id } = useParams();
//   const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
//   const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [deck, setDeck] = useState<Deck | null>(null);
//   const [deckIdAsNumber, setDeckIdAsNumber] = useState<number | null>(null);

//   // For the drawer and editing functionality
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
//   const [savingCard, setSavingCard] = useState(false);
//   const [cardForm] = Form.useForm();
//   const [fileList, setFileList] = useState<UploadFile[]>([]);
//   const [imageUrl, setImageUrl] = useState<string | undefined>();

//   useEffect(() => {
//     if (id) {
//       const parsedDeckId = Number(id);
//       if (!isNaN(parsedDeckId)) {
//         setDeckIdAsNumber(parsedDeckId);
//       }
//     }
//   }, [id]);

//   useEffect(() => {
//     const userId = localStorage.getItem("userId")?.replace(/"/g, "");
//     if (!userId || isNaN(Number(userId)) || Number(userId) <= 0) {
//       router.push("/login");
//     }
//   }, [router]);

//   useEffect(() => {
//     const fetchCards = async () => {
//       try {
//         const userId = localStorage.getItem("userId")?.replace(/"/g, "");
//         if (!userId || isNaN(Number(userId))) {
//           router.push("/login");
//           return;
//         }

//         const allFlashcards = await apiService.get<Flashcard[]>(`/decks/${deckIdAsNumber}/flashcards`);
//         setFlashcards(Array.isArray(allFlashcards) ? allFlashcards : []);
//       } catch (error) {
//         console.error("Error fetching flashcards:", error);
//         setFlashcards([]);
//       }
//     };

//     const fetchDeck = async () => {
//       try {
//         const fetchedDeck = await apiService.get<Deck>(`/decks/${deckIdAsNumber}`);
//         setDeck(fetchedDeck);
//       } catch (error) {
//         console.error("Error fetching deck", error);
//       }
//     };

//     if (deckIdAsNumber !== null) {
//       fetchCards();
//       fetchDeck();
//     }
//   }, [apiService, deckIdAsNumber, router]);

//   // Handle opening the drawer for editing a card
//   const handleEdit = (flashcard: Flashcard, e: React.MouseEvent) => {
//     e.stopPropagation(); // Prevent card flip when clicking edit
//     setEditingCard(flashcard);
//     setDrawerOpen(true);
    
//     // Set form values
//     cardForm.setFieldsValue({
//       description: flashcard.description,
//       answer: flashcard.answer,
//       wrongAnswers: flashcard.wrongAnswers?.length >= 3 
//         ? flashcard.wrongAnswers 
//         : DEFAULT_WRONG_ANSWERS,
//         date: flashcard.date ? dayjs(flashcard.date) : null,
//     });
    
//     // Set image display if there is one
//     setImageUrl(flashcard.imageUrl ?? undefined);
//     setFileList(
//       flashcard.imageUrl
//         ? [{
//             uid: '-1',
//             name: 'image',
//             status: 'done',
//             url: flashcard.imageUrl,
//           }]
//         : []
//     );
//   };

//   const handleDelete = async (flashcardId: string, e: React.MouseEvent) => {
//     e.stopPropagation(); // Prevent card flip when clicking delete
//     try {
//       await apiService.delete(`/decks/${deckIdAsNumber}/flashcards/${flashcardId}`);
//       setFlashcards((prev) => prev.filter((f) => f.id !== flashcardId));
//       message.success("Flashcard deleted successfully");
//     } catch (error) {
//       console.error("Error deleting flashcard:", error);
//       message.error("Failed to delete flashcard");
//     }
//   };

//   const toggleFlip = (index: number) => {
//     setFlippedIndex(flippedIndex === index ? null : index);
//   };

//   const goToNextFlashcard = () => {
//     if (currentIndex < flashcards.length - 1) {
//       setCurrentIndex(currentIndex + 1);
//       setFlippedIndex(null);
//     }
//   };

//   const goToPreviousFlashcard = () => {
//     if (currentIndex > 0) {
//       setCurrentIndex(currentIndex - 1);
//       setFlippedIndex(null);
//     }
//   };

//   // Handle image upload in the form
//   const handleImageChange = async (info: UploadChangeParam<UploadFile>) => {
//     const { file, fileList: newFileList } = info;
//     setFileList(newFileList);

//     if (file.status === 'removed') {
//       // User clicked X on the thumbnail
//       setImageUrl(undefined);
//       return;
//     }

//     if (file.originFileObj) {
//       try {
//         const url = await apiService.uploadImage(
//           '/flashcards/upload-image',
//           file.originFileObj,
//         );
//         setImageUrl(url);
//         message.success('Image uploaded successfully');
//       } catch {
//         message.error('Image upload failed');
//         setFileList([]);
//       }
//     }
//   };

//   // Save the edited flashcard
//   const saveFlashcard = async () => {
//     try {
//       await cardForm.validateFields();
//       const values = cardForm.getFieldsValue();

//       const wrongAnswers = (values.wrongAnswers ?? [])
//         .map((w: string) => w.trim())
//         .filter(Boolean);

//       if (wrongAnswers.length < 3) {
//         message.error('Please provide at least 3 wrong answers');
//         return;
//       }
      
//       if (wrongAnswers.includes(values.answer.trim())) {
//         message.error('Correct answer must not be in wrong answers');
//         return;
//       }

//       const payload = {
//         description: values.description.trim(),
//         answer: values.answer.trim(),
//         wrongAnswers,
//         date: values.date ? values.date.format('YYYY-MM-DD') : null,
//         imageUrl: imageUrl ?? null,
//         flashcardCategory: deck?.deckCategory,
//       };

//       setSavingCard(true);
      
//       if (editingCard && editingCard.id) {
//         await apiService.put(`/flashcards/${editingCard.id}`, payload);
//         message.success('Flashcard updated successfully');
        
//         // Update the flashcard in the current list
//         setFlashcards(prevCards => 
//           prevCards.map(card => 
//             card.id === editingCard.id 
//               ? { 
//                   ...card, 
//                   description: payload.description,
//                   answer: payload.answer,
//                   wrongAnswers: payload.wrongAnswers,
//                   date: payload.date,
//                   imageUrl: payload.imageUrl,
//                 }
//               : card
//           )
//         );
//       }
      
//       setDrawerOpen(false);
//     } catch (error) {
//       console.error("Error saving flashcard:", error);
//       // Form validation errors are shown automatically
//     } finally {
//       setSavingCard(false);
//     }
//   };

//   return (
//     <div style={{ background: "#c3fad4", minHeight: "100vh", padding: "40px 20px" }}>
//       <div style={{ textAlign: "center", marginBottom: "40px" }}>
//         <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#215F46" }}>
//           Deck {deck?.id}{deck?.title ? `: ${deck.title}` : ""}
//         </h1>
//         <h2 style={{ fontSize: "1.5rem", color: "#215F46" }}>
//           Category: {deck?.deckCategory}
//         </h2>
//       </div>

//       <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 32 }}>
//         <Button onClick={goToPreviousFlashcard} disabled={currentIndex === 0 || flashcards.length === 0}>
//           &lt; Previous
//         </Button>

//         <div
//           style={{
//             width: "800px",
//             height: "500px",
//             backgroundColor: "#fff",
//             borderRadius: "20px",
//             boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
//             display: "flex",
//             flexDirection: "column",
//             justifyContent: "space-between",
//             alignItems: "center",
//             margin: "0 20px",
//             padding: "24px",
//             position: "relative",
//             cursor: "pointer",
//           }}
//           tabIndex={0}
//           onClick={() => toggleFlip(currentIndex)}
//           onKeyDown={(e) => {
//             if (e.key === 'Enter' || e.key === ' ') {
//               e.preventDefault();
//               toggleFlip(currentIndex);
//             }
//           }}
//         >
//           {flashcards.length > 0 ? (
//             <>
//               <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: "10px" }}>
//                 <Button 
//                   type="link" 
//                   icon={<EditOutlined />} 
//                   onClick={(e) => handleEdit(flashcards[currentIndex], e)} 
//                 />
//                 <Button 
//                   type="link" 
//                   icon={<DeleteOutlined />} 
//                   style={{ color: "#ff4d4f" }} 
//                   onClick={(e) => handleDelete(flashcards[currentIndex].id, e)} 
//                 />
//               </div>
              
//               <div style={{ textAlign: "center", color: "#215F46", marginTop: "30px" }}>
//                 <h2 style={{ fontSize: "2rem" }}>{flippedIndex === currentIndex ? "Answer" : "Question"}</h2>
//                 <h3 style={{ fontSize: "1rem", color: "#215F46" }}>Flashcard {currentIndex + 1} of {flashcards.length}</h3>
//               </div>
              
//               <div style={{ 
//                 flexGrow: 1, 
//                 display: "flex", 
//                 alignItems: "center", 
//                 justifyContent: "center", 
//                 color: "#215F46", 
//                 textAlign: "center",
//                 width: "100%",
//                 padding: "0 20px"
//               }}>
//                 {/* Show image if available and relevant to the current side */}                
//                 <p style={{ fontSize: "1.2rem" }}>
//                   {flippedIndex === currentIndex ? flashcards[currentIndex].answer : flashcards[currentIndex].description}
                

//                 {flashcards[currentIndex].imageUrl && (
//                   <div style={{ marginTop: "20px",marginBottom: "20px", maxWidth: "100%", textAlign: "center" }}>
//                     <Image
//                       // src={flashcards[currentIndex].imageUrl}
//                       src = {`${domain}/flashcards/image?imageUrl=${encodeURIComponent(flashcards[currentIndex].imageUrl)}`}
//                       alt="Flashcard image"
//                       width={250}
//                       height={170}
//                       style={{ objectFit: "contain", maxHeight: "200px", borderRadius: "8px" }}
//                       unoptimized
//                     />
//                   </div>
//                 )}

//               </p>
//               </div>
//             </>
//           ) : (
//             <p style={{ color: "#215F46", fontWeight: "bold" }}>No flashcards available</p>
//           )}
//         </div>

//         <Button onClick={goToNextFlashcard} disabled={currentIndex === flashcards.length - 1 || flashcards.length === 0}>
//           Next &gt;
//         </Button>
//       </div>

//       <div style={{ textAlign: "center", marginTop: 32 }}>
//         <Button type="primary" onClick={() => router.push(`/decks/${deckIdAsNumber}/edit`)} style={{ marginRight: 16 }}>
//           Add New Flashcard
//         </Button>
//         <Button onClick={() => router.push(`/decks`)}>Back to Decks</Button>
//       </div>

//       {/* Drawer for editing flashcard */}
//       <Drawer
//         destroyOnClose
//         open={drawerOpen}
//         onClose={() => setDrawerOpen(false)}
//         width={460}
//         title="Edit flashcard"
//         extra={
//           <Space>
//             <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
//             <Button
//               type="primary"
//               loading={savingCard}
//               icon={<SaveOutlined />}
//               onClick={saveFlashcard}
//               style={{
//                 background: '#2E8049',
//                 borderColor: '#2E8049',
//               }}
//             >
//               Save
//             </Button>
//           </Space>
//         }
//       >
//         <Form layout="vertical" form={cardForm}>
//           <Form.Item
//             label={<span style={{ color: 'black' }}>Question</span>}
//             name="description"
//             rules={[{ required: true }]}
//           >
//             <TextArea rows={3} placeholder="Enter question" style={{ backgroundColor: 'white', color: 'black', borderRadius: 8 }}/>
//           </Form.Item>

//           <Form.Item
//             label={<span style={{ color: 'black' }}>Correct Answer</span>}
//             name="answer"
//             rules={[{ required: true }]}
//           >
//             <Input style={{ backgroundColor: 'white', color: 'black', borderRadius: 8 }}/>
//           </Form.Item>

//           <Divider orientation="left">Wrong answers (min 3) </Divider>

//           <Form.List name="wrongAnswers">
//             {(fields, { add, remove }) => (
//               <>
//                 {fields.map((field, index) => (
//                   <Form.Item
//                     key={field.key}
//                     required={index < 3}
//                     label={<span style={{ color: 'black' }}>{`Wrong answer ${index + 1}`}</span>}
//                   >
//                     <Input.Group compact style={{ display: 'flex' }}>
//                       <Form.Item
//                         key={field.key}
//                         name={field.name}
//                         fieldKey={field.fieldKey}
//                         noStyle
//                         rules={[
//                           { required: index < 3, message: 'Required' },
//                           { whitespace: true },
//                         ]}
//                       >
//                         <Input
//                           placeholder={`Wrong answer ${index + 1}`}
//                           style={{ flex: 1, backgroundColor: 'white', color: 'black', borderRadius: 8 }}
//                         />
//                       </Form.Item>
//                       {index >= 3 && (
//                         <MinusCircleOutlined
//                           style={{
//                             color: 'red',
//                             marginLeft: 8,
//                             fontSize: 16,
//                           }}
//                           onClick={() => remove(field.name)}
//                         />
//                       )}
//                     </Input.Group>
//                   </Form.Item>
//                 ))}
//                 {fields.length < 6 && (
//                   <Button
//                     type="dashed"
//                     icon={<PlusOutlined />}
//                     onClick={() => add()}
//                     block
//                   >
//                     Add wrong answer
//                   </Button>
//                 )}
//               </>
//             )}
//           </Form.List>

//           <Form.Item label={<span style={{ color: 'black' }}>Date (optional)</span>} name="date">
//               <DatePicker 
//                 style={{ width: '100%', backgroundColor: 'white', color: 'black', borderRadius: 8 }}
//                 format="YYYY-MM-DD"
//                 placeholder="Select date (optional)"
//                 popupClassName="light-range-calendar" 
//                 disabledDate={(current) => {
//                   // Can't select dates after today or before 1900
//                   return current && (current > dayjs().endOf('day') || current < dayjs('1900-01-01'));
//                 }}
//               />
//           </Form.Item>

//           <Form.Item label="Image (optional)">
//             <Upload
//               accept="image/*"
//               listType="picture"
//               fileList={fileList}
//               onChange={handleImageChange}
//               onRemove={() => {
//                 setImageUrl(undefined);
//                 setFileList([]);
//               }}
//               beforeUpload={() => false /* manual */}
//               maxCount={1}
//             >
//               <Button icon={<UploadOutlined />}>
//                 {imageUrl ? 'Change image' : 'Upload image'}
//               </Button>
//             </Upload>

//             {imageUrl && (
//               <div style={{ marginTop: 8 }}>
//                 <Image
//                   src={imageUrl}
//                   alt="preview"
//                   width={260}
//                   height={180}
//                   style={{
//                     objectFit: 'cover',
//                     borderRadius: 8,
//                     border: '1px solid #eee',
//                   }}
//                   unoptimized
//                 />
//               </div>
//             )}
//           </Form.Item>
//         </Form>
//       </Drawer>
//     </div>
//   );
// };

// export default FlashcardsPage;

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { Flashcard } from "@/types/flashcard";
import { 
  Button, 
  Drawer, 
  Form, 
  Input, 
  Space, 
  Divider, 
  message, 
  Upload, 
  Progress, 
  Card,
  Affix,
  Typography
} from "antd";
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  SaveOutlined, 
  UploadOutlined, 
  MinusCircleOutlined,
  LeftOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Deck } from "@/types/deck";
import Image from "next/image";
import type { UploadChangeParam, UploadFile } from "antd/es/upload/interface";
import { DatePicker } from "antd"; 
import dayjs from "dayjs";
import { getApiDomain } from "@/utils/domain";

const { TextArea } = Input;
const { Title, Text } = Typography;

// Design tokens to match other pages
const TOKENS = {
  primary: '#2E8049',
  pageBg: '#aef5c4',
  contentBg: '#d4ffdd',
  cardBg: '#ffffff',
  radius: 24,
  shadow: '0 8px 16px rgba(0,0,0,0.12)',
  fontFamily: "'Poppins', sans-serif",
};

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
    e.stopPropagation();
    setEditingCard(flashcard);
    setDrawerOpen(true);
    
    cardForm.setFieldsValue({
      description: flashcard.description,
      answer: flashcard.answer,
      wrongAnswers: flashcard.wrongAnswers?.length >= 3 
        ? flashcard.wrongAnswers 
        : DEFAULT_WRONG_ANSWERS,
        date: flashcard.date ? dayjs(flashcard.date) : null,
    });
    
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
    e.stopPropagation();
    try {
      await apiService.delete(`/decks/${deckIdAsNumber}/flashcards/${flashcardId}`);
      setFlashcards((prev) => prev.filter((f) => f.id !== flashcardId));
      
      // Adjust current index if needed
      if (currentIndex >= flashcards.length - 1 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
      setFlippedIndex(null);
      
      message.success("Flashcard deleted successfully");
    } catch (error) {
      console.error("Error deleting flashcard:", error);
      message.error("Failed to delete flashcard");
    }
  };

  const goToNextFlashcard = useCallback(() => {
  if (currentIndex < flashcards.length - 1) {
    setCurrentIndex(i => i + 1);
    setFlippedIndex(null);
  }
}, [currentIndex, flashcards.length]);

const goToPreviousFlashcard = useCallback(() => {
  if (currentIndex > 0) {
    setCurrentIndex(i => i - 1);
    setFlippedIndex(null);
  }
}, [currentIndex]);

const toggleFlip = useCallback((index: number) => {
  setFlippedIndex(prev => (prev === index ? null : index));
}, []);

  const resetProgress = () => {
    setCurrentIndex(0);
    setFlippedIndex(null);
  };

  // Enhanced keyboard event handler
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Don't handle keyboard events when drawer is open or when user is typing
    if (
      drawerOpen ||
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    switch (e.key) {
      case " ":
      case "Space":
        e.preventDefault();
        toggleFlip(currentIndex);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        goToPreviousFlashcard();
        break;
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        goToNextFlashcard();
        break;
      case "Enter":
        e.preventDefault();
        toggleFlip(currentIndex);
        break;
      case "Escape":
        e.preventDefault();
        setFlippedIndex(null); // Reset flip state
        break;
      default:
        break;
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [drawerOpen, currentIndex, goToNextFlashcard, goToPreviousFlashcard, toggleFlip]);

  // Handle image upload in the form
  const handleImageChange = async (info: UploadChangeParam<UploadFile>) => {
    const { file, fileList: newFileList } = info;
    setFileList(newFileList);

    if (file.status === 'removed') {
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
    } finally {
      setSavingCard(false);
    }
  };

  const progressPercent = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;

  if (flashcards.length === 0) {
    return (
      <div style={{ 
        background: TOKENS.pageBg, 
        minHeight: "100vh", 
        fontFamily: TOKENS.fontFamily 
      }}>
        {/* Header */}
        <Affix offsetTop={0}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            background: '#215F46 !important',
            boxShadow: TOKENS.shadow,
          }}>
            <Space>
              <Button
                type="text"
                icon={<LeftOutlined style={{ color: 'white' }} />}
                onClick={() => router.push('/decks')}
                style={{ color: 'white', backgroundColor: 'transparent' }}
              />
              <Title level={4} style={{ margin: 0, color: 'white !important' }}>
                {deck?.title || 'Flashcard Study'}
              </Title>
            </Space>

            <Space>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                {currentIndex + 1} / {flashcards.length}
              </span>
              <Button
                type="text"
                icon={<ReloadOutlined style={{ color: 'white' }} />}
                onClick={resetProgress}
                title="Reset to first card"
                style={{ color: 'white', backgroundColor: 'transparent' }}
              />
            </Space>
          </div>
        </Affix>

        {/* Empty state */}
        <div style={{
          background: TOKENS.contentBg,
          minHeight: '100vh',
          padding: '80px 20px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Card style={{
            textAlign: 'center',
            padding: '60px 40px',
            borderRadius: TOKENS.radius,
            boxShadow: TOKENS.shadow,
            maxWidth: 500,
            background: '#fff'
          }}>
            <Title level={3} style={{ color: '#215F46', margin: 0 }}>No flashcards yet</Title>
            <Text style={{ fontSize: 16, color: '#666' }}>
              This deck doesn&apos;t have any flashcards. Add some to start studying!
            </Text>
            <div style={{ marginTop: 32 }}>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => router.push(`/decks/${deckIdAsNumber}/edit`)}
                style={{
                  background: TOKENS.primary,
                  borderColor: TOKENS.primary,
                  borderRadius: 12,
                  height: 48,
                  marginRight: 16
                }}
              >
                Add Flashcards
              </Button>
              <Button
                size="large"
                onClick={() => router.push('/decks')}
                style={{ borderRadius: 12, height: 48 }}
              >
                Back to Decks
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: TOKENS.pageBg, 
      minHeight: "100vh", 
      fontFamily: TOKENS.fontFamily 
    }}>
      {/* Sticky Header */}
      <Affix offsetTop={0}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: "#215F46",
          boxShadow: TOKENS.shadow,
        }}>
          <Space>
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={() => router.push('/decks')}
              style={{color: "white"}}
            />
            <Title level={4} style={{ margin: 0, color: 'white' }}>
              {deck?.title || 'Flashcard Study'}
            </Title>
          </Space>

          <Space>
            <Text style={{ color: 'white', fontSize: '14px' }}>
              {currentIndex + 1} / {flashcards.length}
            </Text>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={resetProgress}
              style={{color: "white"}}
              title="Reset to first card"
            />
          </Space>
        </div>
      </Affix>

      {/* Main Content */}
      <div style={{
        background: TOKENS.contentBg,
        minHeight: '100vh',
        padding: '80px 20px 40px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          {/* Progress Section */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: '14px', color: '#666' }}>Study Progress</Text>
              <Text style={{ fontSize: '14px', color: '#666' }}>{Math.round(progressPercent)}% Complete</Text>
            </div>
            <Progress 
              percent={progressPercent} 
              strokeColor={TOKENS.primary}
              trailColor="#f0f0f0"
              showInfo={false}
              size="small"
            />
          </div>

          {/* Flashcard Display */}
          <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center", 
            gap: 24,
            marginBottom: 40 
          }}>
            
            {/* Previous Button */}
            <Button
              size="large"
              icon={<ArrowLeftOutlined />}
              onClick={goToPreviousFlashcard}
              disabled={currentIndex === 0}
              style={{
                height: 56,
                width: 56,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: currentIndex === 0 ? '#f5f5f5' : TOKENS.cardBg,
                boxShadow: currentIndex === 0 ? 'none' : TOKENS.shadow,
              }}
            />

            {/* Main Flashcard */}
            <Card
              style={{
                width: "100%",
                maxWidth: "900px",
                height: "550px",
                borderRadius: TOKENS.radius,
                boxShadow: TOKENS.shadow,
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                border: 'none',
                background: TOKENS.cardBg,
              }}
              bodyStyle={{ 
                height: '100%', 
                padding: 0,
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={() => toggleFlip(currentIndex)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = TOKENS.shadow;
              }}
            >
              {/* Card Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '20px 24px 16px',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <div>
                  <Title level={4} style={{ margin: 0, color: TOKENS.primary }}>
                    {flippedIndex === currentIndex ? "Answer" : "Question"}
                  </Title>
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    Card {currentIndex + 1} of {flashcards.length} • {deck?.deckCategory}
                  </Text>
                </div>
                
                <Space>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={(e) => handleEdit(flashcards[currentIndex], e)}
                    style={{ color: TOKENS.primary }}
                  />
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={(e) => handleDelete(flashcards[currentIndex].id, e)}
                    style={{ color: '#ff4d4f' }}
                  />
                </Space>
              </div>

              {/* Card Content */}
              <div style={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '32px 24px',
                textAlign: 'center'
              }}>
                <div style={{ width: '100%', maxWidth: '650px' }}>
                  <Text style={{ 
                    fontSize: '32px', 
                    lineHeight: '1.4',
                    color: '#2c3e50',
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: flashcards[currentIndex].imageUrl ? 20 : 0
                  }}>
                    {flippedIndex === currentIndex 
                      ? flashcards[currentIndex].answer 
                      : flashcards[currentIndex].description
                    }
                  </Text>

                  {flashcards[currentIndex].imageUrl && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center',
                      marginTop: 20 
                    }}>
                      <Image
                        src={`${domain}/flashcards/image?imageUrl=${encodeURIComponent(flashcards[currentIndex].imageUrl)}`}
                        alt="Flashcard image"
                        width={280}
                        height={200}
                        style={{ 
                          objectFit: "contain", 
                          borderRadius: 12,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        unoptimized
                      />
                    </div>
                  )}
                </div>

                {/* Flip indicator */}
                <div style={{ 
                  position: 'absolute', 
                  bottom: 20, 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  fontSize: '12px',
                  color: '#999',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <span>Click or press Space to {flippedIndex === currentIndex ? 'show question' : 'reveal answer'}</span>
                </div>
              </div>
            </Card>

            {/* Next Button */}
            <Button
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={goToNextFlashcard}
              disabled={currentIndex === flashcards.length - 1}
              style={{
                height: 56,
                width: 56,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: currentIndex === flashcards.length - 1 ? '#f5f5f5' : TOKENS.cardBg,
                boxShadow: currentIndex === flashcards.length - 1 ? 'none' : TOKENS.shadow,
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 16,
            marginTop: 40 
          }}>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => router.push(`/decks/${deckIdAsNumber}/edit`)}
              style={{
                background: TOKENS.primary,
                borderColor: TOKENS.primary,
                borderRadius: 12,
                height: 48,
                paddingLeft: 24,
                paddingRight: 24
              }}
            >
              Add New Flashcard
            </Button>
            <Button
              size="large"
              onClick={() => router.push('/decks')}
              style={{ 
                borderRadius: 12, 
                height: 48,
                paddingLeft: 24,
                paddingRight: 24
              }}
            >
              Back to Decks
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Drawer */}
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
                background: TOKENS.primary,
                borderColor: TOKENS.primary,
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
            <TextArea 
              rows={3} 
              placeholder="Enter question" 
              style={{ backgroundColor: 'white', color: 'black', borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ color: 'black' }}>Correct Answer</span>}
            name="answer"
            rules={[{ required: true }]}
          >
            <Input style={{ backgroundColor: 'white', color: 'black', borderRadius: 8 }}/>
          </Form.Item>

          <Divider orientation="left">Wrong answers (min 3)</Divider>

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
              beforeUpload={() => false}
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