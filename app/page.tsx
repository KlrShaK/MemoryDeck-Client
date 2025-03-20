"use client";

import { Card, Col, Row } from "antd";

const authors = [
  {
    name: "Melih Serin",
    id: "24-744-443",
    email: "melih.serin@uzh.ch",
    github: "melihsrn",
  },
  {
    name: "Sarah Nabulsi",
    id: "24-740-755",
    email: "sarahosama.nabulsi@uzh.ch",
    github: "sarahnab",
  },
  {
    name: "Leyla Khasiyeva",
    id: "23-760-259",
    email: "leyla.khasiyeva@uzh.ch",
    github: "leylakhasieva",
  },
  {
    name: "Shaurya Kishore Panwar",
    id: "24-744-856",
    email: "shauryakishore.panwar@uzh.ch",
    github: "KlrShaK",
  },
  {
    name: "Nicola Luder",
    id: "22-729-081",
    email: "nicola.luder@uzh.ch",
    github: "nikkiluder",
  },
];

export default function Home() {
  return (
      <div
          style={{
            backgroundColor: "#16181D",
            minHeight: "100vh",
            padding: "2rem",
            color: "#fff",
          }}
      >
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "3em", fontWeight: "bold" }}>
            MemoryDeck Project Page for Team 40 for SOPRA-FS25
          </h1>
          <h2 style={{ fontSize: "2em", fontWeight: "bold", marginTop: "1rem" }}>
            Authors :-
          </h2>
        </div>
        <Row gutter={[16, 16]}>
          {authors.map((author, index) => (
              <Col xs={24} sm={12} md={8} lg={6} key={index}>
                <Card
                    variant="borderless"
                    style={{
                      backgroundColor: "#272B30",
                      color: "#fff",
                      borderRadius: "8px",
                      textAlign: "center",
                    }}
                >
                  <h2>{author.name}</h2>
                  <p>ID: {author.id}</p>
                  <p>
                    Email:{" "}
                    <a
                        href={`mailto:${author.email}`}
                        style={{ color: "#1890ff" }}
                    >
                      {author.email}
                    </a>
                  </p>
                  <p>
                    Github:{" "}
                    <a
                        href={`https://github.com/${author.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#1890ff" }}
                    >
                      {author.github}
                    </a>
                  </p>
                </Card>
              </Col>
          ))}
        </Row>
      </div>
  );
}
