"use client";

import React from "react";
import { Typography, Card, Collapse, Button } from "antd";
import { useRouter } from "next/navigation";

const { Title, Paragraph } = Typography;
const { Panel } = Collapse;

const TutorialsPage: React.FC = () => {
    const router = useRouter();

    return (
        <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
            <Title level={2} style={{ textAlign: "center" }}>
                Tutorials & FAQ
            </Title>

            <Card style={{ marginBottom: "2rem" }}>
                <iframe
                    width="100%"
                    height="400"
                    src="https://www.youtube.com/embed/Ph5_9-ZSOek?si=uXfC8YZUYSy9KTtd"
                    title="Tutorial Video"
                    frameBorder="0"
                    allowFullScreen
                ></iframe>
            </Card>

            <Title level={4}>❓ Frequently Asked Questions</Title>
            <Collapse
                accordion
                style={{ backgroundColor: "#fff" }}
            >
                <Panel key="1"
                       header={<span style={{ color: "#000" }}>How do I create a new deck?</span>}
                       style={{ backgroundColor: "#fff" }}>
                    <Paragraph>
                        To create a new deck, click on the “Create” button in the sidebar. You&apos;ll be prompted to enter a deck title, category, and optionally a description. From there, you can start adding flashcards manually or use the AI tool to auto-generate them based on a topic.
                    </Paragraph>
                </Panel>


                <Panel key="2"
                       header={<span style={{ color: "#000" }}>Can I share decks with others?</span>}
                       style={{ backgroundColor: "#fff" }}>
                    <Paragraph>
                        Yes! When creating a deck, you can mark it as public. Public decks are visible to other users who can view and use them for their own learning or quizzing purposes.
                    </Paragraph>
                </Panel>


                <Panel key="3"
                       header={<span style={{ color: "#000" }}>Why does a question remain after I select an incorrect answer?</span>}
                       style={{ backgroundColor: "#fff" }}>
                    <Paragraph>
                        The question stays on screen until you answer it correctly or the quiz time ends. This approach is inspired by neuroscience research on <b>reinforcement learning</b>: repeated exposure to questions you answered incorrectly helps reinforce memory and promotes deeper learning. By persisting until you get it right, your brain receives a stronger learning signal, leading to better long-term retention.
                    </Paragraph>
                </Panel>

                <Panel key="4"
                       header={<span style={{ color: "#000" }}>Which decks can I use for multiplayer quiz mode?</span>}
                       style={{ backgroundColor: "#fff" }}>

                    <Paragraph>
                        Only <b>public decks</b> can be used in the multiplayer quiz mode. This ensures all players have equal access to the same content and maintains a fair competitive environment.
                    </Paragraph>
                </Panel>


                <Panel key="5"
                       header={<span style={{ color: "#000" }}>What is &apos;Generate with AI&apos;?</span>}
                       style={{ backgroundColor: "#fff" }}>

                    <Paragraph>
                        This feature allows you to automatically generate flashcards by entering a topic or prompt. The AI uses that input to create relevant questions and answers, which you can then edit, rearrange, or remove before saving.
                    </Paragraph>
                </Panel>

                <Panel key="6"
                       header={<span style={{ color: "#000" }}>Can I edit or delete a deck after creating it</span>}
                       style={{ backgroundColor: "#fff" }}>

                    <Paragraph>
                        Absolutely. From the main page, click on a deck to open it, then use the edit or delete options available on the deck toolbar. You can change the title, category, or flashcards at any time.
                    </Paragraph>
                </Panel>

                <Panel key="7"
                       header={<span style={{ color: "#000" }}>Is there a way to track my progress?</span>}
                       style={{ backgroundColor: "#fff" }}>

                    <Paragraph>
                        Yes. Click the “Performance” button on the main page to access detailed statistics about your quiz results over time. You can view progress graphs, filter by time ranges, and analyze your strengths and weaknesses.
                    </Paragraph>
                </Panel>

                <Panel key="8"
                       header={<span style={{ color: "#000" }}>How do multiplayer quizzes work?</span>}
                       style={{ backgroundColor: "#fff" }}>

                    <Paragraph>
                        In the multiplayer mode, you can invite other online users to compete with you in a quiz. Once accepted, both players are shown the same flashcards with a countdown timer. You can see your opponent&apos;s progress and scores in real-time.
                    </Paragraph>
                </Panel>

                <Panel key="9"
                       header={<span style={{ color: "#000" }}>What happens if I forget to log out?</span>}
                       style={{ backgroundColor: "#fff" }}>
                    <Paragraph>
                        If you are inactive for a while, your status may automatically switch to offline. However, you can always manually log out from the profile menu. Logging out ensures your session is secure, especially on shared devices.
                    </Paragraph>
                </Panel>
            </Collapse>


            <div style={{ marginTop: "2rem", textAlign: "center" }}>
                <Button type="primary" onClick={() => router.push("/decks")}>
                    Back to Decks
                </Button>
            </div>
        </div>
    );
};

export default TutorialsPage;