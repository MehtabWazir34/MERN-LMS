import { useEffect, useState } from "react";
import PublicLayout from "../../components/layout/Publiclayout.jsx";
import CourseCard from "../../components/common/CourseCard";
import Spinner from "../../components/common/Spinner";
import Alert from "../../components/common/Alert";
import { getAllCourses } from "../../api/courses";

export default function CoursesPage() {
    const [courses, setCourses] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getAllCourses();
                setCourses(data.courses);
                setStatus("success");
            } catch {
                setStatus("error");
            }
        };
        load();
    }, []);

    return (
        <PublicLayout>
            <section className="mx-auto max-w-6xl px-6 py-12">
                <h1 className="font-display text-3xl text-text-primary">All courses</h1>

                {status === "loading" && (
                    <div className="mt-10 flex justify-center">
                        <Spinner />
                    </div>
                )}
                {status === "error" && (
                    <div className="mt-6">
                        <Alert variant="danger">Couldn't load courses right now. Please try again later.</Alert>
                    </div>
                )}
                {status === "success" && courses.length === 0 && (
                    <p className="mt-6 text-text-secondary">No courses available yet.</p>
                )}
                {status === "success" && courses.length > 0 && (
                    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
                            <CourseCard key={course._id} course={course} />
                        ))}
                    </div>
                )}
            </section>
        </PublicLayout>
    );
}