import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicLayout from "../../components/layout/Publiclayout.jsx";
import CourseCard from "../../components/common/CourseCard";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import { getAllCourses } from "../../api/courses";

export default function HomePage() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getAllCourses();
                setCourses(data.courses.slice(0, 3));
                setStatus("success");
            } catch {
                setStatus("error");
            }
        };
        load();
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
                <div className="mt-8">
                    <Button fullWidth={false} className="px-8" onClick={() => navigate("/courses")}>
                        Browse courses
                    </Button>
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