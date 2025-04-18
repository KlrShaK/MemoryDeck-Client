'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Row, Col, Avatar, Dropdown, Spin, message } from 'antd';
import { EllipsisOutlined, UserOutlined } from '@ant-design/icons';
import { useApi } from '@/hooks/useApi';
import useLocalStorage from '@/hooks/useLocalStorage';

interface Flashcard {
    id: number;
    question: string;
    answer: string;
    questionImageUrl?: string;
    answerImageUrl?: string;
    deckId: number;
    deckTitle: string;
}

type GroupedDecks = Record<number, { title: string; flashcards: Flashcard[] }>;

const DeckPage = () => {
    const router = useRouter();
    const apiService = useApi();
    const { value: userId } = useLocalStorage<string>('userId', '');
    const [decks, setDecks] = useState<GroupedDecks>({});
    const [loading, setLoading] = useState(true);

    const fetchGroupedDecks = async () => {
        if (!userId) return;

        try {
            const response = await apiService.get<Flashcard[]>(`/flashcards?userId=${userId}`);

            const grouped: GroupedDecks = {};
            response.forEach(card => {
                const deckId = card.deckId;
                if (!grouped[deckId]) {
                    grouped[deckId] = { title: card.deckTitle, flashcards: [] };
                }
                grouped[deckId].flashcards.push(card);
            });

            setDecks(grouped);
        } catch (error) {
            console.error('Failed to fetch flashcards:', error);
            message.error('Failed to load decks.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeckClick = (deckId: number) => {
        router.push(`/decks/quiz/${deckId}`);
    };

    const handleEditDeck = (deckId: number) => {
        router.push(`/decks/edit/${deckId}`);
    };

    const handleDeleteDeck = async (deckId: number) => {
        try {
            await apiService.delete(`/flashcards/delete?userId=${userId}&deckId=${deckId}`);
            message.success(`Deleted deck #${deckId}`);
            fetchGroupedDecks(); // Refresh
        } catch (err) {
            console.error(err);
            message.error("Failed to delete deck.");
        }
    };

    const handleCreateClick = () => router.push('/decks/create');
    const handlePerformanceClick = () => console.log("Performance button clicked");
    const handleSetReminderClick = () => console.log("Set Reminder button clicked");
    const handleQuizClick = () => console.log("Quiz button clicked");
    const handleVersusClick = () => console.log("Versus Mode button clicked");
    const handleTutorialClick = () => console.log("Tutorial button clicked");
    const handleProfileClick = () => console.log("Profile button clicked");

    useEffect(() => {
        if (userId) {
            fetchGroupedDecks();
        } else {
            setLoading(false);
        }
    }, [userId]);

    return (
        <div style={{ backgroundColor: '#ccf0cc', minHeight: '100vh', padding: '0' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px' }}>
                <Avatar
                    size={40}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: '#fff', color: '#ccc', cursor: 'pointer' }}
                    onClick={handleProfileClick}
                />
            </div>

            <div style={{ display: 'flex', padding: '0 20px' }}>
                {/* Sidebar */}
                <div style={{ width: '200px', marginRight: '20px' }}>
                    <Button
                        type="primary"
                        onClick={handleCreateClick}
                        style={{
                            width: '100%',
                            marginBottom: '20px',
                            height: '48px',
                            backgroundColor: '#285c28',
                            borderColor: '#285c28',
                            borderRadius: '24px',
                            fontWeight: 'bold',
                        }}
                    >
                        Create
                    </Button>

                    <div style={{ borderTop: '1px solid #a8e6a8', marginBottom: '20px' }}></div>

                    <Button
                        type="default"
                        onClick={handlePerformanceClick}
                        style={{
                            width: '100%',
                            marginBottom: '10px',
                            backgroundColor: 'white',
                            borderColor: 'white',
                            borderRadius: '24px',
                        }}
                    >
                        Performance
                    </Button>

                    <Button
                        type="default"
                        onClick={handleSetReminderClick}
                        style={{
                            width: '100%',
                            marginBottom: '25px',
                            backgroundColor: 'white',
                            borderColor: 'white',
                            borderRadius: '24px',
                        }}
                    >
                        Set Reminder
                    </Button>

                    <div style={{ borderTop: '1px solid #a8e6a8', marginBottom: '20px' }}></div>

                    <h3 style={{ margin: '20px 0px 30px 40px', color: '#333' }}>Gamemodes</h3>

                    <Button
                        type="primary"
                        onClick={handleQuizClick}
                        style={{
                            width: '100%',
                            marginBottom: '15px',
                            backgroundColor: '#285c28',
                            borderColor: '#285c28',
                            borderRadius: '24px',
                            fontWeight: 'normal',
                            fontSize: '14px',
                        }}
                    >
                        Start a quiz together!
                    </Button>

                    <Button
                        type="primary"
                        onClick={handleVersusClick}
                        style={{
                            width: '100%',
                            marginBottom: '15px',
                            backgroundColor: '#285c28',
                            borderColor: '#285c28',
                            borderRadius: '24px',
                            fontWeight: 'normal',
                            fontSize: '14px',
                        }}
                    >
                        Versus Mode
                    </Button>

                    <div style={{ position: 'fixed', bottom: '20px' }}>
                        <Button
                            type="default"
                            onClick={handleTutorialClick}
                            style={{
                                backgroundColor: 'white',
                                borderColor: 'white',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                            }}
                        >
                            Tutorial and FAQs
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ flex: 1 }}>
                    <h2 style={{ marginBottom: '20px', color: '#333' }}>Your Decks</h2>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Spin size="large" />
                        </div>
                    ) : Object.keys(decks).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '160px', color: '#ff0000', fontWeight: 700 }}>
                            You have no saved decks yet. To get started, please create decks from the menu.
                        </div>
                    ) : (
                        <Row gutter={[16, 16]}>
                            {Object.entries(decks).map(([deckIdStr, { title }]) => {
                                const deckId = parseInt(deckIdStr);
                                return (
                                    <Col xs={24} sm={12} md={8} key={deckId}>
                                        <Card
                                            style={{
                                                height: '150px',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                            }}
                                            onClick={() => handleDeckClick(deckId)}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{title}</div>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                                                    <Dropdown
                                                        menu={{
                                                            items: [
                                                                { key: 'edit', label: 'Edit' },
                                                                { key: 'delete', label: 'Delete' },
                                                            ],
                                                            onClick: (e) => {
                                                                e.domEvent.stopPropagation();
                                                                if (e.key === 'edit') handleEditDeck(deckId);
                                                                else if (e.key === 'delete') handleDeleteDeck(deckId);
                                                            },
                                                        }}
                                                        trigger={['click']}
                                                        placement="bottomRight"
                                                    >
                                                        <Button
                                                            type="text"
                                                            icon={<EllipsisOutlined style={{ fontSize: '20px', color: '#aaa' }} />}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </Dropdown>
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeckPage;

