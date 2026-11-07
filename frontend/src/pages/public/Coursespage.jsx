import { useEffect, useMemo, useState } from "react";
import PublicLayout from "../../components/layout/Publiclayout";
import CourseCard from "../../components/common/CourseCard";
import Spinner from "../../components/common/Spinner";
import Alert from "../../components/common/Alert";
import useSeo, { companyCanonical } from "../../hooks/useSeo";
import { getAllCourses, COURSE_LEVELS, COURSE_MODES } from "../../api/courses";

const LABEL = "mb-1.5 block text-xs font-medium text-text-secondary";
const CONTROL =
    "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40";

export default function CoursesPage() {
    useSeo({
        title: "All courses",
        description:
            "Browse our online, onsite and hybrid courses. Filter by category, level and mode, then request to enroll.",
        canonical: companyCanonical("/courses"),
    });

    const [courses, setCourses] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [level, setLevel] = useState("");
    const [mode, setMode] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                const data = await getAllCourses({ signal: controller.signal });
                setCourses(data.courses);
                setStatus("success");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setStatus("error");
            }
        };

        load();
        return () => controller.abort();
    }, []);

    const categories = useMemo(
        () => [...new Set(courses.map((c) => c.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
        [courses]
    );

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return courses.filter((course) => {
            if (category && course.category !== category) return false;
            if (level && course.level !== level) return false;
            if (mode && course.mode !== mode) return false;
            if (!query) return true;
            return [course.title, course.subtitle, course.category, ...(course.technologies ?? [])].some((value) =>
                String(value ?? "").toLowerCase().includes(query)
            );
        });
    }, [courses, search, category, level, mode]);

    const hasFilters = Boolean(search || category || level || mode);

    const clearFilters = () => {
        setSearch("");
        setCategory("");
        setLevel("");
        setMode("");
    };

    return (
        <PublicLayout>
            <section className="mx-auto max-w-6xl px-6 py-12">
                <h1 className="font-display text-3xl text-text-primary">All courses</h1>
                <p className="mt-2 max-w-2xl text-text-secondary">
                    Find a course that fits your goals, then send a request to enroll.
                </p>

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
                    <>
                        <form
                            role="search"
                            aria-label="Filter courses"
                            onSubmit={(e) => e.preventDefault()}
                            className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
                        >
                            <div className="sm:col-span-2">
                                <label htmlFor="course-search" className={LABEL}>
                                    Search
                                </label>
                                <input
                                    id="course-search"
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Title, topic or technology"
                                    className={CONTROL}
                                />
                            </div>
                            <div>
                                <label htmlFor="course-category" className={LABEL}>
                                    Category
                                </label>
                                <select
                                    id="course-category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className={CONTROL}
                                >
                                    <option value="">All categories</option>
                                    {categories.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="course-level" className={LABEL}>
                                    Level
                                </label>
                                <select
                                    id="course-level"
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value)}
                                    className={CONTROL}
                                >
                                    <option value="">All levels</option>
                                    {COURSE_LEVELS.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="course-mode" className={LABEL}>
                                    Mode
                                </label>
                                <select
                                    id="course-mode"
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value)}
                                    className={CONTROL}
                                >
                                    <option value="">All modes</option>
                                    {COURSE_MODES.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </form>

                        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                            <p aria-live="polite" className="text-text-muted">
                                {filtered.length} course{filtered.length === 1 ? "" : "s"}
                                {hasFilters ? " found" : ""}
                            </p>
                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="font-medium text-primary hover:underline"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>

                        <h2 className="sr-only">Course list</h2>

                        {filtered.length === 0 ? (
                            <p className="mt-8 text-text-secondary">No courses match your filters.</p>
                        ) : (
                            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {filtered.map((course) => (
                                    <CourseCard key={course._id} course={course} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </section>
        </PublicLayout>
    );
}