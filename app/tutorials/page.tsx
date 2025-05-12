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
                    src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                    title="Tutorial Video"
                    frameBorder="0"
                    allowFullScreen
                ></iframe>
            </Card>

            <Title level={4}>❓ Frequently Asked Questions</Title>
            <Collapse accordion>
                <Panel header="How do I create a new deck?" key="1">
                    <Paragraph>
                        Click on “Create” in the sidebar, fill in your deck details and start adding flashcards.
                    </Paragraph>
                </Panel>
                <Panel header="Can I share decks with others?" key="2">
                    <Paragraph>
                        Yes, you can mark a deck as public during creation, which allows others to view it.
                    </Paragraph>
                </Panel>
                <Panel header="What is 'Generate with AI'?" key="3">
                    <Paragraph>
                        This feature allows you to auto-generate flashcards based on a topic prompt using AI.
                    </Paragraph>
                </Panel>
            </Collapse>

            <div style={{ marginTop: "2rem", textAlign: "center" }}>
                <Button type="primary" onClick={() => router.push("/contact")}>
                    Need More Help?
                </Button>
            </div>
        </div>
    );
};

export default TutorialsPage;
