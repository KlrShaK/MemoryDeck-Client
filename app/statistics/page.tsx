"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, Statistic, DatePicker, Typography, Spin, Empty, message, Select, Button, Table, Row, Col } from "antd";
import { Line } from "@ant-design/charts";
import { ArrowLeftOutlined, TrophyOutlined, ClockCircleOutlined, AreaChartOutlined, RiseOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Define the color palette
const COLORS = {
  primary: {
    base: '#1E8A4C',
    dark: '#146638',
    light: '#65BC8B',
    lighter: '#DAFCE7',
    lightest: '#F2FFF7'
  },
  neutral: {
    black: '#1C2024',
    darkGray: '#4A4F55',
    gray: '#8C9196',
    lightGray: '#D8DADF',
    offWhite: '#F5F7FA',
    white: '#FFFFFF'
  },
  accent: {
    success: '#2E8B57',
    warning: '#FFA500',
    error: '#E34B4B',
    info: '#5BADFF'
  },
  background: {
    body: '#c3fad4',
    card: '#FFFFFF',
    sidebar: '#E4F7EB',
    highlight: '#D0F3DC'
  }
};

interface QuizResult {
  userId: number;
  username: string;
  quizId: number;
  correctQuestions: number;
  numberOfAttempts: number;
  timeTakenSeconds: number;
  quizDate: string;
  isWinner: boolean | null;
}

interface TableRecord {
  key: number;
  date: string;
  score: string;
  timeTaken: string;
  result: 'Win' | 'Loss' | 'Draw';
}

interface ChartDataPoint {
  x: string;
  y: number;
  key: number;
}

// Define proper types for Ant Design table components
interface TableHeaderCellProps {
  align?: 'left' | 'center' | 'right';
  children?: React.ReactNode;
}

interface TableRowProps {
  'data-row-key'?: number;
  children?: React.ReactNode;
}

interface TableCellProps {
  children?: React.ReactNode;
}

// Helper function to determine score color
const getScoreColor = (score: string): string => {
  const value = parseInt(score);
  if (value >= 90) return COLORS.accent.success;
  if (value >= 70) return COLORS.primary.base;
  if (value >= 50) return COLORS.accent.warning;
  return COLORS.accent.error;
};

const StatisticsPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { value: userId } = useLocalStorage<string>("userId", "");

  const [data, setData] = useState<QuizResult[]>([]);
  const [filtered, setFiltered] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chart");

  useEffect(() => {
    if (!userId) {
      message.warning("Please log in to see your statistics.");
      router.push("/login");
      return;
    }

    const fetchStatistics = async () => {
      try {
        // Clean userId by removing quotes if they exist
        const cleanUserId = userId.replace(/^"|"$/g, '');
        const numericUserId = Number(cleanUserId);
        
        if (isNaN(numericUserId)) {
          message.error("Invalid user ID. Please log in again.");
          router.push("/login");
          return;
        }

        // Fetch statistics from the API
        const statistics = await apiService.get<QuizResult[]>(`/statistics/${numericUserId}`);
        
        setData(statistics);
        setFiltered(statistics);
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
        message.error("Failed to load statistics. Please try again.");
        setData([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [userId, apiService, router]);

  const onRangeChange = (dates: (Dayjs | null)[] | null) => {
    if (!dates || !dates[0] || !dates[1]) {
      setFiltered(data);
      return;
    }
    const [start, end] = dates as [Dayjs, Dayjs];
    setFiltered(
      data.filter((entry) => {
        const d = new Date(entry.quizDate);
        return d >= start.toDate() && d <= end.toDate();
      })
    );
  };

  const onQuickFilter = (range: string) => {
    const now = dayjs();
    let start: Dayjs;
    switch (range) {
      case "week":
        start = now.subtract(7, "day");
        break;
      case "month":
        start = now.subtract(1, "month");
        break;
      case "3months":
        start = now.subtract(3, "month");
        break;
      default:
        setFiltered(data);
        return;
    }
    const filteredRange = data.filter((entry) => {
      const d = new Date(entry.quizDate);
      return d >= start.toDate() && d <= now.toDate();
    });
    setFiltered(filteredRange);
  };

  const totalQuizzes = filtered.length;
  
  const avgScore = useMemo(() => {
    if (!totalQuizzes) return 0;
    const sumPcts = filtered.reduce((sum, q) => sum + (q.correctQuestions / q.numberOfAttempts), 0);
    return Math.round((sumPcts / totalQuizzes) * 100);
  }, [filtered, totalQuizzes]);

  const bestScore = useMemo(() => {
    if (!totalQuizzes) return 0;
    return Math.max(...filtered.map((q) => Math.round((q.correctQuestions / q.numberOfAttempts) * 100)));
  }, [filtered, totalQuizzes]);

  const winRate = useMemo(() => {
    if (!totalQuizzes) return 0;
    const wins = filtered.filter(r => r.isWinner === true).length;
    return Math.round((wins / totalQuizzes) * 100);
  }, [filtered, totalQuizzes]);

  // Time-axis data
  const chartData = useMemo(
    () =>
      filtered.map((q, idx) => ({
        x: dayjs(q.quizDate).format("MMM D, YYYY HH:mm"),
        y: Math.round((q.correctQuestions / q.numberOfAttempts) * 100),
        key: idx,
      })) as ChartDataPoint[],
    [filtered]
  );

  // Chart configuration
  const chartConfig = {
    data: chartData,
    xField: "x",
    yField: "y",
    point: {
      visible: true,
      size: 6,
      shape: "circle",
      style: { fill: COLORS.primary.base, stroke: "#fff", lineWidth: 2 },
    },
    xAxis: {
      visible: true,
      type: "time",
      mask: "MMM D",
      tickCount: 6,
      line: { style: { stroke: "#aaa", lineWidth: 1 } },
      tickLine: { style: { stroke: "#aaa", lineWidth: 1 } },
      label: {
        autoRotate: false,
        formatter: (val: string) => dayjs(val).format("MMM D"),
        style: { fill: COLORS.neutral.darkGray, fontSize: 12 },
      },
    },
    yAxis: {
      visible: true,
      title: { text: "Score (%)", style: { fill: COLORS.neutral.darkGray, fontSize: 12 } },
      line: { style: { stroke: "#aaa", lineWidth: 1 } },
      tickLine: { style: { stroke: "#aaa", lineWidth: 1 } },
      label: { style: { fill: COLORS.neutral.darkGray, fontSize: 12 } },
    },
    smooth: true,
    area: { style: { fill: `l(270) 0:#ffffff00 1:${COLORS.primary.base}33` } },
    line: { style: { stroke: COLORS.primary.base } },
    slider: { start: 0, end: 1, trendCfg: { isArea: true } },
    tooltip: {
      showTitle: false,
      showMarkers: false,
      shared: false,
      showCrosshairs: false,
      formatter: (datum: { x: string; y: number }) => [
        { name: "", value: dayjs(datum.x).format("MMM D, YYYY") },
        { name: "Score", value: `${datum.y}%` }
      ],
      domStyles: {
        "g2-tooltip": {
          padding: "8px",
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        },
        "g2-tooltip-list-item": {
          fontSize: "13px",
          color: COLORS.neutral.darkGray,
        },
      },
    },
    animation: { appear: { animation: "path-in", duration: 800 } },
  };

  // Last 10 attempts for table
  const last10 = useMemo(() => {
    return [...filtered]
      .sort((a, b) => new Date(b.quizDate).getTime() - new Date(a.quizDate).getTime())
      .slice(0, 10)
      .map((q, idx) => ({
        key: idx,
        date: dayjs(q.quizDate).format("MM/DD/YYYY HH:mm"),
        score: Math.round((q.correctQuestions / q.numberOfAttempts) * 100) + "%",
        timeTaken: Math.round(q.timeTakenSeconds) + "s",
        result: q.isWinner === true ? "Win" : q.isWinner === false ? "Loss" : "Draw"
      })) as TableRecord[];
  }, [filtered]);

  // Table columns definition
  const columns = [
    { 
      title: "Date & Time", 
      dataIndex: "date", 
      key: "date",
      render: (text: string) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <ClockCircleOutlined style={{ marginRight: "8px", color: COLORS.primary.base }} />
          <span style={{ color: COLORS.neutral.darkGray }}>{text}</span>
        </div>
      )
    },
    { 
      title: "Score", 
      dataIndex: "score", 
      key: "score",
      render: (text: string) => (
        <div style={{ 
          fontWeight: 600, 
          color: getScoreColor(text)
        }}>
          {text}
        </div>
      )
    },
    { 
      title: "Time Taken", 
      dataIndex: "timeTaken", 
      key: "timeTaken",
      render: (text: string) => (
        <span style={{ color: COLORS.neutral.darkGray }}>{text}</span>
      )
    },
    { 
      title: "Result", 
      dataIndex: "result", 
      key: "result", 
      render: (text: string) => {
        let color: string, bgColor: string;
        
        if (text === "Win") {
          color = '#FFFFFF';
          bgColor = COLORS.accent.success;
        } else if (text === "Loss") {
          color = '#FFFFFF';
          bgColor = COLORS.accent.error;
        } else { // Draw
          color = COLORS.neutral.darkGray;
          bgColor = COLORS.neutral.lightGray;
        }
        
        return (
          <div style={{
            padding: "4px 12px",
            borderRadius: "12px",
            display: "inline-block",
            fontWeight: 600,
            color: color,
            backgroundColor: bgColor,
          }}>
            {text}
          </div>
        );
      }
    }
  ];

  return (
    <div style={{ 
      backgroundColor: COLORS.background.body, 
      minHeight: "100vh", 
      padding: "0",
      fontFamily: "'Poppins', sans-serif"
    }}>
      <div style={{ 
        padding: "20px", 
        display: "flex", 
        alignItems: "center", 
        background: COLORS.background.body
      }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push('/decks')}
          style={{ 
            marginRight: "16px", 
            color: COLORS.primary.dark,
            border: "none",
            background: "transparent"
          }}
        />
        <Title 
          level={3} 
          style={{ 
            margin: 0, 
            color: COLORS.primary.dark, 
            fontFamily: "'Poppins', sans-serif", 
            fontWeight: 600 
          }}
        >
          Your Quiz Statistics
        </Title>
      </div>

      <div style={{ 
        padding: "0 20px 40px", 
        maxWidth: "1200px", 
        margin: "0 auto" 
      }}>
        {loading ? (
          <div style={{ 
            textAlign: "center", 
            padding: "80px 0", 
            background: COLORS.primary.lighter, 
            borderRadius: "16px", 
            marginTop: "16px",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)"
          }}>
            <Spin size="large" />
            <div style={{ marginTop: "16px", color: COLORS.primary.dark }}>
              Loading statistics...
            </div>
          </div>
        ) : data.length === 0 ? (
          <Card style={{ 
            textAlign: "center", 
            padding: "40px", 
            borderRadius: "16px", 
            background: COLORS.neutral.white,
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)",
            marginTop: "16px"
          }}>
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
              description={
                <span style={{ color: COLORS.primary.dark, fontSize: "16px" }}>
                  You haven&apos;t taken any quizzes yet
                </span>
              } 
            />
            <Button 
              type="primary" 
              onClick={() => router.push('/decks')} 
              style={{ 
                marginTop: "24px", 
                backgroundColor: COLORS.primary.base,
                borderColor: COLORS.primary.base,
                borderRadius: "20px",
                padding: "0 24px",
                height: "40px"
              }}
            >
              Take Your First Quiz
            </Button>
          </Card>
        ) : (
          <>
            <Card
              style={{
                borderRadius: "16px",
                marginTop: "16px",
                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)",
                background: COLORS.neutral.white,
                overflow: "hidden"
              }}
            >
              <div style={{ padding: "0 0 20px" }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  flexWrap: "wrap",
                  gap: "16px",
                  marginBottom: "16px"
                }}>
                  <div>
                    <Text style={{ color: COLORS.primary.dark, fontWeight: 500 }}>Filter by date range:</Text>
                    <div style={{ marginTop: "8px" }}>
                      <RangePicker
                        onChange={onRangeChange}
                        popupClassName="light-range-calendar" 
                        style={{
                          backgroundColor: COLORS.neutral.offWhite,
                          borderColor: COLORS.neutral.lightGray,
                          borderRadius: "8px",
                          marginRight: "8px",
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Text style={{ color: COLORS.primary.dark, fontWeight: 500 }}>Quick filters:</Text>
                    <div style={{ marginTop: "8px" }}>
                      <Select
                        placeholder="Quick Range"
                        onChange={onQuickFilter}
                        style={{
                          width: "160px",
                          backgroundColor: COLORS.neutral.offWhite,
                          borderColor: COLORS.neutral.lightGray,
                          borderRadius: "8px"
                        }}
                      >
                        <Option value="week">Last 7 days</Option>
                        <Option value="month">Last month</Option>
                        <Option value="3months">Last 3 months</Option>
                        <Option value="all">All time</Option>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      height: "100%",
                      borderRadius: "12px",
                      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
                      border: `1px solid ${COLORS.primary.base}`,
                      background: COLORS.primary.lightest
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                      <AreaChartOutlined style={{ fontSize: "20px", color: COLORS.primary.base, marginRight: "8px" }} />
                      <Text style={{ color: COLORS.primary.dark, fontWeight: 600 }}>Total Quizzes</Text>
                    </div>
                    <Statistic
                      value={totalQuizzes}
                      valueStyle={{ color: COLORS.primary.dark, fontWeight: 700, fontSize: "28px" }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      height: "100%",
                      borderRadius: "12px",
                      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
                      border: `1px solid ${COLORS.primary.base}`,
                      background: COLORS.primary.lightest
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                      <RiseOutlined style={{ fontSize: "20px", color: COLORS.primary.base, marginRight: "8px" }} />
                      <Text style={{ color: COLORS.primary.dark, fontWeight: 600 }}>Average Score</Text>
                    </div>
                    <Statistic
                      value={avgScore}
                      suffix="%"
                      valueStyle={{ color: COLORS.primary.dark, fontWeight: 700, fontSize: "28px" }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      height: "100%",
                      borderRadius: "12px",
                      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
                      border: `1px solid ${COLORS.primary.base}`,
                      background: COLORS.primary.lightest
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                      <TrophyOutlined style={{ fontSize: "20px", color: COLORS.accent.warning, marginRight: "8px" }} />
                      <Text style={{ color: COLORS.primary.dark, fontWeight: 600 }}>Best Score</Text>
                    </div>
                    <Statistic
                      value={bestScore}
                      suffix="%"
                      valueStyle={{ color: COLORS.primary.dark, fontWeight: 700, fontSize: "28px" }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      height: "100%",
                      borderRadius: "12px",
                      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
                      border: `1px solid ${COLORS.primary.base}`,
                      background: COLORS.primary.lightest
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                      <TrophyOutlined style={{ fontSize: "20px", color: COLORS.primary.base, marginRight: "8px" }} />
                      <Text style={{ color: COLORS.primary.dark, fontWeight: 600 }}>Win Rate</Text>
                    </div>
                    <Statistic
                      value={winRate}
                      suffix="%"
                      valueStyle={{ color: COLORS.primary.dark, fontWeight: 700, fontSize: "28px" }}
                    />
                  </Card>
                </Col>
              </Row>

              <div style={{ marginTop: "24px" }}>
                <div style={{ 
                  display: "flex", 
                  borderBottom: `1px solid ${COLORS.neutral.lightGray}`, 
                  marginBottom: "16px" 
                }}>
                  <div 
                    onClick={() => setActiveTab("chart")}
                    style={{
                      padding: "10px 20px",
                      fontWeight: 600,
                      color: activeTab === "chart" ? COLORS.primary.base : COLORS.neutral.gray,
                      borderBottom: activeTab === "chart" ? `2px solid ${COLORS.primary.base}` : "none",
                      cursor: "pointer"
                    }}
                  >
                    Performance Chart
                  </div>
                  <div 
                    onClick={() => setActiveTab("list")}
                    style={{
                      padding: "10px 20px",
                      fontWeight: 600,
                      color: activeTab === "list" ? COLORS.primary.base : COLORS.neutral.gray,
                      borderBottom: activeTab === "list" ? `2px solid ${COLORS.primary.base}` : "none",
                      cursor: "pointer"
                    }}
                  >
                    Recent Attempts
                  </div>
                </div>

                {activeTab === "chart" ? (
                  <div style={{ height: "400px" }}>
                    <Line {...chartConfig} />
                  </div>
                ) : (
                  <Table
                    columns={columns}
                    dataSource={last10}
                    pagination={false}
                    rowKey="key"
                    className="statistics-table"
                    style={{ 
                      borderRadius: "12px", 
                      overflow: "hidden",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
                    }}
                    components={{
                      header: {
                        cell: (props: TableHeaderCellProps) => (
                          <th
                            style={{
                              background: COLORS.primary.lighter,
                              color: COLORS.primary.dark,
                              fontWeight: 600,
                              padding: '16px',
                              fontSize: '14px',
                              textAlign: props.align || 'left',
                              borderBottom: 'none'
                            }}
                          >
                            {props.children}
                          </th>
                        ),
                      },
                      body: {
                        row: (props: TableRowProps) => {
                          const index = props['data-row-key'] as number;
                          return (
                            <tr
                              style={{
                                background: index % 2 === 0 
                                  ? COLORS.neutral.white
                                  : COLORS.primary.lightest
                              }}
                            >
                              {props.children}
                            </tr>
                          );
                        },
                        cell: (props: TableCellProps) => (
                          <td
                            style={{
                              padding: '16px',
                              borderBottom: `1px solid ${COLORS.neutral.lightGray}`,
                              fontSize: '14px'
                            }}
                          >
                            {props.children}
                          </td>
                        ),
                      },
                    }}
                    locale={{ 
                      emptyText: (
                        <Empty 
                          description="No attempts to show" 
                          image={Empty.PRESENTED_IMAGE_SIMPLE} 
                        />
                      )
                    }}
                  />
                )}
              </div>
            </Card>

            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <Button
                type="primary"
                onClick={() => router.push('/decks')}
                style={{
                  backgroundColor: COLORS.primary.base,
                  borderColor: COLORS.primary.base,
                  borderRadius: "20px",
                  padding: "0 24px",
                  height: "40px",
                  fontWeight: 500
                }}
              >
                Back to Decks
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatisticsPage;