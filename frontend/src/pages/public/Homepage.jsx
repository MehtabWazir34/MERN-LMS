import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicLayout from "../../components/layout/Publiclayout";
import CourseCard from "../../components/common/CourseCard";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import { getAllCourses } from "../../api/courses";

const FEATURES = [
    {
        title: "Learn at your own pace",
        description: "Browse courses, enroll when you're ready, and work through lectures on your own schedule.",
    },
    {
        title: "Track your progress",
        description: "See your attendance and grades update in real time, all in one dashboard.",
    },
    {
        title: "Get real feedback",
        description: "Instructors mark attendance and post results directly — no guessing where you stand.",
    },
];

export default function HomePage() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                const data = await getAllCourses({ signal: controller.signal });
                setCourses(data.courses.slice(0, 3));
                setStatus("success");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setStatus("error");
            }
        };

        load();
        return () => controller.abort();
    }, []);

    return (
        <PublicLayout>
            <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-20 text-center">
                <h1 className="font-display text-4xl text-text-primary sm:text-5xl">
                    Learn at your own pace, taught by real instructors.
                </h1>
                <p className="mt-4 max-w-xl text-text-secondary">
                    Browse courses, track your progress, and get graded feedback — all in one place.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Button fullWidth={false} className="px-6" onClick={() => navigate("/courses")}>
                        Browse courses
                    </Button>
                    <Button fullWidth={false} variant="secondary" className="px-6" onClick={() => navigate("/about")}>
                        Learn more
                    </Button>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 pb-16">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {FEATURES.map((feature) => (
                        <div key={feature.title} className="rounded-lg border border-border bg-surface p-6">
                            <h3 className="font-display text-lg text-text-primary">{feature.title}</h3>
                            <p className="mt-2 text-sm text-text-secondary">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 pb-20">
                <h2 className="font-display text-2xl text-text-primary">Featured courses</h2>

                {status === "loading" && (
                    <div className="mt-6 flex justify-center">
                        <Spinner />
                    </div>
                )}
                {status === "error" && (
                    <p className="mt-6 text-sm text-danger">Couldn't load courses right now.</p>
                )}
                {status === "success" && courses.length === 0 && (
                    <p className="mt-6 text-text-secondary">No courses available yet — check back soon.</p>
                )}
                {status === "success" && courses.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
                            <CourseCard key={course._id} course={course} />
                        ))}
                    </div>
                )}

                <div className="mt-8 text-center">
                    <Link to="/courses" className="text-sm font-medium text-primary hover:underline">
                        View all courses →
                    </Link>
                </div>
            </section>
        </PublicLayout>
    );
}