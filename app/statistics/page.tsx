"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, Statistic, DatePicker, Typography, Spin, Empty, message, Select } from "antd";
import { Line } from "@ant-design/charts";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface QuizResult {
    timestamp: string;
    score: number;
    total: number;
}

const StatisticsPage: React.FC = () => {
    const api = useApi();
    const { value: rawUserId } = useLocalStorage<string>("userId", "");
    const userId = Number(rawUserId || 0);

    const [data, setData] = useState<QuizResult[]>([]);
    const [filtered, setFiltered] = useState<QuizResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            message.warning("Please log in to see your stats.");
            setLoading(false);
            return;
        }

        fetch("/mock/quizResults.json")
            .then((res) => {
                if (!res.ok) throw new Error("Network response was not OK");
                return res.json() as Promise<QuizResult[]>;
            })
            .then((json) => {
                setData(json);
                setFiltered(json);
            })
            .catch(() => message.error("Failed to load mock data."))
            .finally(() => setLoading(false));
    }, [userId]);

    const onRangeChange = (dates: (Dayjs | null)[] | null) => {
        if (!dates || !dates[0] || !dates[1]) {
            setFiltered(data);
            return;
        }
        const [start, end] = dates as [Dayjs, Dayjs];
        setFiltered(
            data.filter((entry) => {
                const d = new Date(entry.timestamp);
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
            const d = new Date(entry.timestamp);
            return d >= start.toDate() && d <= now.toDate();
        });
        setFiltered(filteredRange);
    };

    const totalQuizzes = filtered.length;
    const avgScore = useMemo(() => {
        if (!totalQuizzes) return 0;
        const sumPcts = filtered.reduce((sum, q) => sum + q.score / q.total, 0);
        return Math.round((sumPcts / totalQuizzes) * 100);
    }, [filtered, totalQuizzes]);

    const bestScore = useMemo(() => {
        if (!totalQuizzes) return 0;
        return Math.max(...filtered.map((q) => Math.round((q.score / q.total) * 100)));
    }, [filtered, totalQuizzes]);

    const chartData = useMemo(
        () =>
            filtered.map((q) => ({
                date: new Date(q.timestamp).toLocaleDateString(),
                score: Math.round((q.score / q.total) * 100),
            })),
        [filtered]
    );

    const chartConfig = {
        data: chartData,
        xField: "date",
        yField: "score",
        xAxis: { title: { text: "Date" } },
        yAxis: { title: { text: "Score (%)" } },
        smooth: true,
    };

    return (
        <div style={{ padding: 24 }}>
            <Title level={2}>Your Quiz Statistics</Title>

            {loading ? (
                <Spin tip="Loading statistics…" />
            ) : data.length === 0 ? (
                <Empty description="No quiz data yet" />
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
                        <Card style={{ backgroundColor: "#818181", color: "white" }}>
                            <Statistic title="Total Quizzes" value={totalQuizzes} valueStyle={{ color: "white" }} />
                        </Card>
                        <Card style={{ backgroundColor: "#818181", color: "white" }}>
                            <Statistic title="Average Score" value={`${avgScore}%`} valueStyle={{ color: "white" }} />
                        </Card>
                        <Card style={{ backgroundColor: "#818181", color: "white" }}>
                            <Statistic title="Best Score" value={`${bestScore}%`} valueStyle={{ color: "white" }} />
                        </Card>
                    </div>

                    <Card title="Performance Over Time">
                        <Line {...chartConfig} />
                    </Card>
                </>
            )}
        </div>
    );
};

export default StatisticsPage;
