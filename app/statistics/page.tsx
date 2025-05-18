"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, Statistic, DatePicker, Typography, Spin, Empty, message, Select, Button, Tabs, Table } from "antd";
import { Line } from "@ant-design/charts";
import { useApi } from "@/hooks/useApi";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

interface QuizResult {
    userId:           number;
    username:         string;
    quizId:           number;
    correctQuestions: number;
    numberOfAttempts: number;
    timeTakenSeconds: number;          // already in seconds
    quizDate:         Date;
    isWinner:         boolean | null;  // true / false / null(draw)
}

const StatisticsPage: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    // const { value: rawUserId } = useLocalStorage<string>("userId", "");
    // const userId = Number(rawUserId || 0);
    const [userId, setUserId] = useState<string | null>(null)

    const [data, setData] = useState<QuizResult[]>([]);
    const [filtered, setFiltered] = useState<QuizResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUserId = localStorage.getItem("userId");
        if (storedUserId) {
          // const parsedUserId = Number(storedUserId);
          // if (!isNaN(parsedUserId)) {
          setUserId(storedUserId);
          // }
        }
      }, []);

    useEffect(() => {
        if (!userId) {
            message.warning("Please log in to see your stats.");
            return;
        }

        setLoading(true);
        // drop the async fn; chain the promise so React won’t warn about an ignored Promise
        void apiService
            .get<QuizResult[]>(`/statistics/${userId}`)
            .then((result) => {
                setData(result);
                setFiltered(result);
            })
            .catch(() => {
                message.error("Failed to load data.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [userId, apiService]);


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
        const sumPcts = filtered.reduce((sum, q) => sum + q.correctQuestions / q.numberOfAttempts, 0);
        return Math.round((sumPcts / totalQuizzes) * 100);
    }, [filtered, totalQuizzes]);

    const bestScore = useMemo(() => {
        if (!totalQuizzes) return 0;
        return Math.max(...filtered.map((q) => Math.round((q.correctQuestions / q.numberOfAttempts) * 100)));
    }, [filtered, totalQuizzes]);

    const winRate = useMemo(() => {
        if (!totalQuizzes) return 0;
        const wins = filtered.filter(r => r.isWinner === true ).length;
        return totalQuizzes  === 0 ? 0 : Math.round(100 * (wins / totalQuizzes));
    }, [filtered, totalQuizzes]);

    // 1) True time-axis data
    const chartData = useMemo(
        () =>
            filtered.map((q, idx) => ({
                x: dayjs(q.quizDate).format("MMM D, YYYY HH:mm"),
                y: Math.round((q.correctQuestions / q.numberOfAttempts) * 100),
                key: idx,
            })),
        [filtered]
    );


    // 2) Configure as a time axis
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chartConfig: any = {
        data: chartData,
        xField: "x",
        yField: "y",
        point: {
            visible: true,
            size: 6,
            shape: "circle",
            style: { fill: "#1890ff", stroke: "#fff", lineWidth: 2 },
        },
        xAxis: {
            visible: true,
            type: "time",
            mask: "MMM D",
            tickCount: 6,
            line: { style: { stroke: "#fff", lineWidth: 1 } },
            tickLine: { style: { stroke: "#fff", lineWidth: 1 } },
            label: {
                autoRotate: false,
                formatter: (val: number) => dayjs(val).format("MMM D"),
                style: { fill: "#fff", fontSize: 12 },
            },
        },
        yAxis: {
            visible: true,
            title: { text: "Score (%)", style: { fill: "#fff", fontSize: 12 } },
            line: { style: { stroke: "#fff", lineWidth: 1 } },
            tickLine: { style: { stroke: "#fff", lineWidth: 1 } },
            label: { style: { fill: "#fff", fontSize: 12 } },
        },
        smooth: true,
        area: { style: { fill: "l(270) 0:#ffffff00 1:#1890ff33" } },
        slider: { start: 0, end: 1, trendCfg: { isArea: true } },

        tooltip: {
            showTitle: false,
            showMarkers: false,
            shared: false,
            showCrosshairs: false,
            formatter: (datum: { x: number; y: number }) => [
                { name: "", value: dayjs(datum.x).format("MMM D, YYYY") },
                { name: "Score", value: `${datum.y}%` }
            ],
            domStyles: {
                "g2-tooltip": {
                    padding: "8px",
                    background: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                },
                "g2-tooltip-list-item": {
                    fontSize: "13px",
                    color: "#000",
                },
            },
        },

        animation: { appear: { animation: "path-in", duration: 800 } },
    };


    //3)
    const last10 = useMemo(() => {
        return [...filtered]
            .sort((a, b) => new Date(b.quizDate).getTime() - new Date(a.quizDate).getTime())
            .slice(0, 10)
            .map((q, idx) => ({
                key: idx,
                date: dayjs(q.quizDate).format("MM/DD/YYYY HH:mm"),
                score: Math.round((q.correctQuestions / q.numberOfAttempts) * 100) + "%",
                timeTaken: q.timeTakenSeconds + "s",
            }));
    }, [filtered]);

    return (
        <div style={{ padding: 24 }}>
            <Title level={2}>Your Quiz Statistics</Title>

            {loading ? (
                <div style={{ textAlign: "center", marginTop: 80 }}>
                    <Spin tip="Loading statistics…" size="large" />
                </div>
            ) : data.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="You haven’t taken any quizzes yet."
                />
            ) : (
                <>
                    <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                        <RangePicker
                            onChange={onRangeChange}
                            style={{
                                backgroundColor: "#fff",
                                color: "#000",
                                borderColor: "#ccc",
                                borderRadius: 8,
                                padding: "6px 12px",
                            }}
                            popupClassName="light-range-calendar"
                        />

                        <Select
                            placeholder="Quick Range"
                            onChange={onQuickFilter}
                            style={{
                                width: 160,
                                backgroundColor: "#fff",
                                color: "#000",
                                borderRadius: 8,
                                border: "1px solid #ccc",
                            }}
                            dropdownStyle={{ backgroundColor: "#fff", color: "#000" }}
                            popupClassName="light-select-dropdown"
                        >
                            <Option value="week">Last 7 days</Option>
                            <Option value="month">Last month</Option>
                            <Option value="3months">Last 3 months</Option>
                        </Select>
                    </div>


                    <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
                        <Card style={{ backgroundColor: "#fff", color: "#111" }}>
                            <Statistic
                                title={<span style={{ color: "#333" }}>Total Quizzes</span>}
                                value={totalQuizzes}
                                valueStyle={{ color: "#111" }}
                            />
                        </Card>
                        <Card style={{ backgroundColor: "#fff", color: "#111" }}>
                            <Statistic
                                title={<span style={{ color: "#333" }}>Average Score</span>}
                                value={`${avgScore}%`}
                                valueStyle={{ color: "#111" }}
                            />
                        </Card>
                        <Card style={{ backgroundColor: "#fff", color: "#111" }}>
                            <Statistic
                                title={<span style={{ color: "#333" }}>Best Score</span>}
                                value={`${bestScore}%`}
                                valueStyle={{ color: "#111" }}
                            />
                        </Card>
                        <Card style={{ backgroundColor: "#fff", color: "#111" }}>
                            <Statistic
                                title={<span style={{ color: "#333" }}>Win Rate</span>}
                                value={`${winRate}%`}
                                valueStyle={{ color: "#111" }}
                            />
                        </Card>
                    </div>

                    {/* 3) Tabs for Timeline + Last 10 Attempts */}
                    <Tabs defaultActiveKey="chart" style={{ marginTop: 24 }}>
                        <TabPane tab="Timeline" key="chart">
                            <Card title={<span style={{ color: "#111", fontWeight: 600 }}>Performance Over Time</span>}
                                  style={{ background: "#fff" }}>
                                <Line {...chartConfig} />
                            </Card>
                        </TabPane>

                        <TabPane tab="Last 10 Attempts" key="list">
                            <Card
                                style={{ background: "#fff", color: "#111" }}
                                bodyStyle={{ color: "#111" }}
                            >
                                <Table
                                    className="white-table"
                                    columns={[
                                        { title: "Date & Time", dataIndex: "date", key: "date" },
                                        { title: "Score", dataIndex: "score", key: "score" },
                                        { title: "Time Taken", dataIndex: "timeTaken", key: "timeTaken" },
                                    ]}
                                    dataSource={last10}
                                    pagination={false}
                                    locale={{ emptyText: "No attempts to show" }}
                                />

                            </Card>
                        </TabPane>
                    </Tabs>

                    <Button style={{ marginTop: 16 }} onClick={() => router.push(`/decks`)}>
                        Back to Decks
                    </Button>

                </>
            )}
        </div>
    );
};

export default StatisticsPage;