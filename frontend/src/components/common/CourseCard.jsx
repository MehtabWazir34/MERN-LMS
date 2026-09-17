import { Link } from "react-router-dom";

export default function CourseCard({ course }) {
    const { _id, title, description, price, poster, instructor } = course;

    return (
        <Link
            to={`/courses/${_id}`}
            className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-md"
        >
            <div className="aspect-video w-full overflow-hidden bg-surface-hover">
                {poster ? (
                    <img
                        src={poster}
                        alt={title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-text-muted">
                        No image
                    </div>
                )}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="line-clamp-2 font-display text-lg text-text-primary">{title}</h3>
                <p className="line-clamp-2 text-sm text-text-secondary">{description}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-sm text-text-muted">{instructor?.name}</span>
                    <span className="font-medium text-primary">${price}</span>
                </div>
            </div>
        </Link>
    );
}