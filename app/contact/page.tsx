"use client";

import React, { useState } from "react";
import { Typography, Form, Input, Button, Card } from "antd";
import { useRouter } from "next/navigation";

const { Title, Paragraph } = Typography;

const ContactPage: React.FC = () => {
    const [submitted, setSubmitted] = useState(false);
    const router = useRouter();

    const onFinish = async (values: any) => {
        console.log("Submitted values:", values);
        // …backend call placeholder…
        setSubmitted(true);
    };

    const fieldStyle = {
        backgroundColor: "#ffffff",
        color: "#000000",
        border: "1px solid #d9d9d9",
        borderRadius: 4,
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
            {!submitted ? (
                <>
                    {/* …form code unchanged… */}
                </>
            ) : (
                <Card
                    style={{
                        backgroundColor: "#ffffff",   // pure white
                        textAlign: "center",
                        padding: "2rem",
                        borderRadius: 8,
                    }}
                >
                    <Title level={3} style={{ color: "#000000", marginBottom: "1rem" }}>
                        Thank you!
                    </Title>
                    <Paragraph style={{ color: "#000000", marginBottom: "2rem" }}>
                        Your request has been received. We’ll get back to you shortly.
                    </Paragraph>

                    <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
                        <Button onClick={() => router.push("/tutorials")}>
                            Back to Tutorials & FAQ
                        </Button>
                        <Button type="primary" onClick={() => router.push("/decks")}>
                            Go to Homepage
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ContactPage;
