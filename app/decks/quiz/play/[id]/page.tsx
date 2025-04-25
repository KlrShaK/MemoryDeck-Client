"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Radio, Space, Progress, Typography, Row, Col, Spin, message, Modal } from 'antd';
import { useApi } from '@/hooks/useApi';
import useLocalStorage from '@/hooks/useLocalStorage';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useCallback } from 'react';
import Image from 'next/image';
import { getApiDomain } from '@/utils/domain';

const { Title, Text } = Typography;

// Sample quiz data structure (replace with API data later)
interface QuizFlashcard {
  id: string;
  description: string;
  answer: string; // correct answer
  wrongAnswers: string[]; // incorrect options
  imageUrl?: string | null;
}

interface QuizData {
  id: string;
  title: string;
  timeLimit: number; // seconds per question
  flashcards: QuizFlashcard[];
  participants: {
    id: string;
    username: string;
  }[];
}

const QuizGamePage: React.FC = () => {
  const router = useRouter();
  const { id: quizId } = useParams();
  const apiService = useApi();
  const { value: userId } = useLocalStorage<string>('user_id', '');
  const apiUrl = getApiDomain();
  
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [score, setScore] = useState(0);
  
  // Track scores for participants
  const [scores, setScores] = useState<{ [key: string]: number }>({});

  // Sample quiz data for testing
  const sampleQuiz: QuizData = {
    id: quizId as string,
    title: "Memory Quiz",
    timeLimit: 30,
    flashcards: [
      {
        id: "1",
        description: "What is the capital of France?",
        answer: "Paris",
        wrongAnswers: ["London", "Berlin", "Madrid"]
      },
      {
        id: "2",
        description: "Who painted the Mona Lisa?",
        answer: "Leonardo da Vinci",
        wrongAnswers: ["Pablo Picasso", "Vincent van Gogh", "Michelangelo"]
      },
      {
        id: "3",
        description: "What is the largest organ of the human body?",
        answer: "Skin",
        wrongAnswers: ["Liver", "Brain", "Heart"]
      },
      {
        id: "4",
        description: "Which planet is closest to the Sun?",
        answer: "Mercury",
        wrongAnswers: ["Venus", "Earth", "Mars"]
      }
    ],
    participants: [
      {
        id: "1",
        username: "You"
      },
      {
        id: "2",
        username: "Opponent"
      }
    ]
  };

  const handleTimeUp = useCallback(() => {
    if (!answerSubmitted) {
      setAnswerSubmitted(true);
      setIsCorrect(false);
      message.warning('Time is up&#39;!');
    }
  }, [answerSubmitted]);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setQuiz(sampleQuiz);
        setTimeLeft(sampleQuiz.timeLimit);
        const initialScores = sampleQuiz.participants.reduce((acc, participant) => {
          acc[participant.id] = 0;
          return acc;
        }, {} as { [key: string]: number });
        setScores(initialScores);
      } catch (error) {
        console.error('Failed to fetch quiz data:', error);
        message.error('Error loading quiz');
      } finally {
        setLoading(false);
      }
    };
    fetchQuizData();
  }, [quizId, apiService, sampleQuiz]);  // Add sampleQuiz here
  
  useEffect(() => {
    if (!quiz || answerSubmitted || gameEnded || !timeLeft) return;
  
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();  // handleTimeUp should be in dependencies
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  
    return () => clearInterval(timer);
  }, [quiz, timeLeft, answerSubmitted, gameEnded, handleTimeUp]);  // Add handleTimeUp here

  const getAllAnswers = (flashcard: QuizFlashcard) => {
    // Combine correct and wrong answers and shuffle them
    const allAnswers = [flashcard.answer, ...flashcard.wrongAnswers];
    return shuffleArray(allAnswers);
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleAnswerSelect = (answer: string) => {
    if (answerSubmitted) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = async () => {
    if (!quiz || !selectedAnswer) return;
    
    const currentCard = quiz.flashcards[currentCardIndex];
    const correct = selectedAnswer === currentCard.answer;
    
    setIsCorrect(correct);
    setAnswerSubmitted(true);
    
    if (correct) {
      // Update score for the participant who answered correctly
      setScores(prevScores => ({
        ...prevScores,
        [userId]: (prevScores[userId] || 0) + 1
      }));
    }
    
    // In a real app, send the answer to the API
    // try {
    //   await apiService.post(`/quiz/${quizId}/submit-answer`, {
    //     userId,
    //     flashcardId: currentCard.id,
    //     answer: selectedAnswer
    //   });
    // } catch (error) {
    //   console.error('Failed to submit answer:', error);
    // }
    
    // Wait 2 seconds to show the result before moving to next question
    setTimeout(() => {
      if (currentCardIndex < quiz.flashcards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setAnswerSubmitted(false);
        setTimeLeft(quiz.timeLimit);
      } else {
        // End of quiz
        setGameEnded(true);
      }
    }, 2000);
  };

  const handleEndQuiz = () => {
    // In a real app, notify the API that the user has left
    // apiService.post(`/quiz/${quizId}/leave`, { userId });
    router.push('/decks');
  };

  const renderResultModal = () => {
    if (!quiz) return null;
    
    // Sort participants based on the score
    const sortedParticipants = [...quiz.participants].sort((a, b) => {
      const scoreA = scores[a.id] || 0;
      const scoreB = scores[b.id] || 0;
      return scoreB - scoreA;
    });

    const winner = sortedParticipants[0];
    const isTie = sortedParticipants.length > 1 && scores[sortedParticipants[0].id] === scores[sortedParticipants[1].id];
    
    return (
      <Modal
        title="Quiz Results"
        open={gameEnded}
        footer={[
          <Button 
            key="back" 
            onClick={handleEndQuiz}
            style={{ backgroundColor: '#285c28', color: 'white', borderColor: '#285c28' }}
          >
            Return to Decks
          </Button>
        ]}
        closable={false}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {isTie ? (
            <Title level={3}>It's a tie!</Title>
          ) : (
            <>
              <Title level={3}>{winner.username} wins!</Title>
              <Text type="secondary">With a score of {scores[winner.id]}/{quiz.flashcards.length}</Text>
            </>
          )}
          
          <div style={{ margin: '30px 0' }}>
            <Title level={4}>Final Scores:</Title>
            {quiz.participants.map(participant => (
              <div key={participant.id} style={{ margin: '10px 0' }}>
                <Text strong>{participant.username}: </Text>
                <Text>{scores[participant.id] || 0} / {quiz.flashcards.length}</Text>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#ccf0cc' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#ccf0cc', minHeight: '100vh' }}>
        <Title level={3}>Quiz not found</Title>
        <Button onClick={() => router.push('/decks')}>Return to Decks</Button>
      </div>
    );
  }

  const currentCard = quiz.flashcards[currentCardIndex];
  const shuffledAnswers = getAllAnswers(currentCard);
  const progressPercent = Math.round((currentCardIndex / quiz.flashcards.length) * 100);

  return (
    <div style={{ backgroundColor: '#ccf0cc', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
          <Col>
            <Title level={3}>{quiz.title}</Title>
          </Col>
          <Col>
            <Button onClick={handleEndQuiz}>Exit Quiz</Button>
          </Col>
        </Row>
        
        <Row justify="space-between" style={{ marginBottom: '10px' }}>
          <Col span={12}>
            <Progress percent={progressPercent} status="active" />
            <Text>Question {currentCardIndex + 1} of {quiz.flashcards.length}</Text>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '5px' }}>
              <Text strong>Time left: </Text>
              <Text style={{ color: timeLeft < 10 ? 'red' : undefined }}>{timeLeft}s</Text>
            </div>
            <Progress 
              percent={(timeLeft / quiz.timeLimit) * 100} 
              showInfo={false} 
              status={timeLeft < 10 ? "exception" : "active"}
              strokeColor={timeLeft < 10 ? "#ff4d4f" : undefined}
            />
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={6}>
            <Card title="Scores" style={{ marginBottom: '20px' }}>
              <div key={userId} style={{ marginBottom: '10px' }}>
                <Text strong>{quiz.participants[0]?.username}: </Text>
                <Text>{scores[userId] || 0}</Text>
              </div>
            </Card>
          </Col>
          
          <Col span={18}>
            <Card 
              title={<div style={{ fontSize: '18px' }}>{currentCard.description}</div>}
              style={{ marginBottom: '20px' }}
            >
              {currentCard.imageUrl && (
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <Image 
                    src={`${apiUrl}/flashcards/image?imageUrl=${encodeURIComponent(currentCard.imageUrl)}`} 
                    alt="Flashcard" 
                    width={300} 
                    height={200} 
                    style={{ objectFit: 'contain' }}
                    unoptimized={true}
                  />
                </div>
              )}
              
              <Radio.Group 
                onChange={(e) => handleAnswerSelect(e.target.value)} 
                value={selectedAnswer}
                style={{ width: '100%' }}
                disabled={answerSubmitted}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {shuffledAnswers.map((answer, index) => (
                    <Radio
                      key={index}
                      value={answer}
                      style={{
                        backgroundColor: answerSubmitted 
                          ? (answer === currentCard.answer ? '#c6f7c7' : '#ffccc7') 
                          : undefined
                      }}
                    >
                      {answer}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <Button 
                  type="primary" 
                  onClick={handleSubmitAnswer}
                  disabled={answerSubmitted}
                >
                  Submit Answer
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {renderResultModal()}
    </div>
  );
};

export default QuizGamePage;

