"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Radio, Space, Progress, Typography, Row, Col, Spin, message, Modal } from 'antd';
import { useApi } from '@/hooks/useApi';
import useLocalStorage from '@/hooks/useLocalStorage';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
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
    score: number;
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
        username: "You",
        score: 0
      },
      {
        id: "2",
        username: "Opponent",
        score: 0
      }
    ]
  };

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        // Try to fetch the quiz data from API
        // const response = await apiService.get<QuizData>(`/quiz/${quizId}`);
        // setQuiz(response);
        
        // Using sample data for now
        setQuiz(sampleQuiz);
        setTimeLeft(sampleQuiz.timeLimit);
      } catch (error) {
        console.error('Failed to fetch quiz data:', error);
        message.error('Error loading quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId, apiService]);

  // Timer effect
  useEffect(() => {
    if (!quiz || answerSubmitted || gameEnded || !timeLeft) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [quiz, timeLeft, answerSubmitted, gameEnded]);

  const handleTimeUp = () => {
    if (!answerSubmitted) {
      // Time ran out without an answer
      setAnswerSubmitted(true);
      setIsCorrect(false);
      message.warning('Time is up!');
    }
  };

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
      setScore(prev => prev + 1);
      
      // Update UI to show updated score
      const updatedQuiz = { ...quiz };
      // Find the user's participant entry and update the score
      const userParticipant = updatedQuiz.participants.find(p => p.id === userId);
      if (userParticipant) {
        userParticipant.score += 1;
      }
      setQuiz(updatedQuiz);
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
    
    // Find winner
    const sortedParticipants = [...quiz.participants].sort((a, b) => b.score - a.score);
    const winner = sortedParticipants[0];
    const isTie = sortedParticipants.length > 1 && sortedParticipants[0].score === sortedParticipants[1].score;
    
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
              <Text type="secondary">With a score of {winner.score}/{quiz.flashcards.length}</Text>
            </>
          )}
          
          <div style={{ margin: '30px 0' }}>
            <Title level={4}>Final Scores:</Title>
            {quiz.participants.map(participant => (
              <div key={participant.id} style={{ margin: '10px 0' }}>
                <Text strong>{participant.username}: </Text>
                <Text>{participant.score} / {quiz.flashcards.length}</Text>
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
              {quiz.participants.map(participant => (
                <div key={participant.id} style={{ marginBottom: '10px' }}>
                  <Text strong>{participant.username}: </Text>
                  <Text>{participant.score}</Text>
                </div>
              ))}
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
                        width: '100%', 
                        height: '50px',
                        padding: '10px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        backgroundColor: answerSubmitted ? 
                          (answer === currentCard.answer ? '#f6ffed' : 
                           selectedAnswer === answer && selectedAnswer !== currentCard.answer ? '#fff2f0' : 
                           'transparent') : 
                          'transparent'
                      }}
                    >
                      <Space>
                        {answer}
                        {answerSubmitted && answer === currentCard.answer && (
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        )}
                        {answerSubmitted && selectedAnswer === answer && answer !== currentCard.answer && (
                          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                        )}
                      </Space>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
              
              {answerSubmitted ? (
                <div style={{ 
                  marginTop: '20px', 
                  padding: '10px', 
                  backgroundColor: isCorrect ? '#f6ffed' : '#fff2f0',
                  borderRadius: '8px',
                  borderColor: isCorrect ? '#b7eb8f' : '#ffccc7',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}>
                  <Text strong style={{ color: isCorrect ? '#52c41a' : '#ff4d4f' }}>
                    {isCorrect ? 'Correct! ' : 'Incorrect. '}
                  </Text>
                  <Text>
                    {isCorrect 
                      ? 'Well done!' 
                      : `The correct answer is: ${currentCard.answer}`}
                  </Text>
                </div>
              ) : (
                <Button 
                  type="primary" 
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer}
                  style={{ 
                    marginTop: '20px',
                    backgroundColor: '#285c28',
                    borderColor: '#285c28',
                  }}
                  block
                >
                  Submit Answer
                </Button>
              )}
            </Card>
          </Col>
        </Row>
      </div>
      
      {renderResultModal()}
    </div>
  );
};

export default QuizGamePage;