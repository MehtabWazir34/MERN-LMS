import { Link } from "react-router-dom";

// Expects a course from the public list (getAllCourses): picture {url}, subtitle,
// category, level, mode, duration, price, seatsLeft and the populated instructor.
export default function CourseCard({ course }) {
    const { _id, title, subtitle, picture, category, level, mode, duration, price, seatsLeft, instructor } = course;
    const isFull = seatsLeft === 0;

    return (
        <Link
            to={`/courses/${_id}`}
            className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-md"
        >
            <div className="relative aspect-video w-full overflow-hidden bg-surface-hover">
                {picture?.url ? (
                    <img
                        src={picture.url}
                        alt={title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-text-muted">No image</div>
                )}
                {isFull && (
                    <span className="absolute right-2 top-2 rounded-full bg-danger px-2.5 py-1 text-xs font-medium text-white">
                        Full
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    {category && <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">{category}</span>}
                    {level && <span className="rounded-full bg-surface-hover px-2.5 py-1 text-text-secondary">{level}</span>}
                </div>

                <h3 className="line-clamp-2 font-display text-lg text-text-primary">{title}</h3>
                <p className="line-clamp-2 text-sm text-text-secondary">{subtitle}</p>
                <p className="text-xs text-text-muted">{[mode, duration].filter(Boolean).join(" · ")}</p>

                <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                    <span className="truncate text-sm text-text-muted">{instructor?.name}</span>
                    <span className="shrink-0 font-medium text-primary">{price > 0 ? `$${price}` : "Free"}</span>
                </div>

                {typeof seatsLeft === "number" && !isFull && (
                    <p className="text-xs text-text-muted">
                        {seatsLeft} seat{seatsLeft === 1 ? "" : "s"} left
                    </p>
                )}
            </div>
        </Link>
    );
}