import { useState } from "react";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import Alert from "../../components/common/Alert";
import { addLectureVideo, updateLectureVideo, deleteLectureVideo } from "../../api/courses";

const EMPTY_LECTURE = { title: "", description: "", duration: "", lectureNumber: "" };

// Parent (CourseManagePage) owns the course's `videos` array and passes
// it down — this component never fetches on its own, it just calls
// onVideosChange with the fresh array the API already returns after
// every add/edit/delete, so parent and child never fall out of sync.
export default function LectureManager({ courseId, videos, onVideosChange }) {
    const [form, setForm] = useState(EMPTY_LECTURE);
    const [videoFile, setVideoFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [banner, setBanner] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState(EMPTY_LECTURE);
    const [editVideoFile, setEditVideoFile] = useState(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const [deletingId, setDeletingId] = useState(null);

    const handleAddChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setBanner(null);

        if (!form.title.trim() || !form.description.trim() || !videoFile) {
            setBanner({ variant: "danger", message: "Title, description and a video file are required" });
            return;
        }

        setIsSubmitting(true);
        try {
            const data = await addLectureVideo(courseId, { ...form, video: videoFile });
            onVideosChange(data.course.videos);
            setForm(EMPTY_LECTURE);
            setVideoFile(null);
            setBanner({ variant: "success", message: "Lecture added!" });
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to add lecture" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const startEdit = (video) => {
        setEditingId(video._id);
        setEditForm({
            title: video.title,
            description: video.description,
            duration: String(video.duration ?? ""),
            lectureNumber: String(video.lectureNumber ?? ""),
        });
        setEditVideoFile(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm(EMPTY_LECTURE);
        setEditVideoFile(null);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (e, videoId) => {
        e.preventDefault();
        setBanner(null);
        setIsSavingEdit(true);
        try {
            const payload = { ...editForm };
            if (editVideoFile) payload.video = editVideoFile;
            const data = await updateLectureVideo(courseId, videoId, payload);
            onVideosChange(data.course.videos);
            cancelEdit();
            setBanner({ variant: "success", message: "Lecture updated!" });
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to update lecture" });
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleDelete = async (videoId) => {
        if (!window.confirm("Delete this lecture? This cannot be undone.")) return;
        setDeletingId(videoId);
        setBanner(null);
        try {
            const data = await deleteLectureVideo(courseId, videoId);
            onVideosChange(data.course.videos);
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to delete lecture" });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div>
            <h2 className="font-display text-xl text-text-primary">Lectures</h2>

            {banner && (
                <div className="mt-3">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                </div>
            )}

            <form
                onSubmit={handleAddSubmit}
                className="mt-4 space-y-3 rounded-lg border border-border bg-surface p-4"
            >
                <h3 className="text-sm font-semibold text-text-primary">Add a lecture</h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input id="lecture-title" name="title" label="Title" value={form.title} onChange={handleAddChange} />
                    <Input
                        id="lecture-number"
                        name="lectureNumber"
                        type="number"
                        label="Lecture number"
                        value={form.lectureNumber}
                        onChange={handleAddChange}
                    />
                </div>

                <div className="w-full">
                    <label htmlFor="lecture-description" className="mb-1.5 block text-sm font-medium text-text-secondary">
                        Description
                    </label>
                    <textarea
                        id="lecture-description"
                        name="description"
                        rows={3}
                        value={form.description}
                        onChange={handleAddChange}
                        className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                </div>

                <Input
                    id="lecture-duration"
                    name="duration"
                    type="number"
                    label="Duration (minutes)"
                    value={form.duration}
                    onChange={handleAddChange}
                />

                <div className="w-full">
                    <label htmlFor="lecture-video" className="mb-1.5 block text-sm font-medium text-text-secondary">
                        Video file
                    </label>
                    <input
                        id="lecture-video"
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                        className="w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-surface-hover file:px-3 file:py-2 file:text-sm file:font-medium file:text-text-primary"
                    />
                </div>

                <Button type="submit" fullWidth={false} className="px-6" isLoading={isSubmitting}>
                    Add lecture
                </Button>
            </form>

            {videos.length === 0 ? (
                <p className="mt-6 text-sm text-text-secondary">No lectures yet.</p>
            ) : (
                <ul className="mt-6 space-y-3">
                    {videos.map((video) => (
                        <li key={video._id} className="rounded-lg border border-border bg-surface p-4">
                            {editingId === video._id ? (
                                <form onSubmit={(e) => handleEditSubmit(e, video._id)} className="space-y-3">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Input
                                            id={`edit-title-${video._id}`}
                                            name="title"
                                            label="Title"
                                            value={editForm.title}
                                            onChange={handleEditChange}
                                        />
                                        <Input
                                            id={`edit-number-${video._id}`}
                                            name="lectureNumber"
                                            type="number"
                                            label="Lecture number"
                                            value={editForm.lectureNumber}
                                            onChange={handleEditChange}
                                        />
                                    </div>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        value={editForm.description}
                                        onChange={handleEditChange}
                                        className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    />
                                    <Input
                                        id={`edit-duration-${video._id}`}
                                        name="duration"
                                        type="number"
                                        label="Duration (minutes)"
                                        value={editForm.duration}
                                        onChange={handleEditChange}
                                    />
                                    <div className="w-full">
                                        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                                            Replace video <span className="text-text-muted">(optional)</span>
                                        </label>
                                        <input
                                            type="file"
                                            accept="video/*"
                                            onChange={(e) => setEditVideoFile(e.target.files?.[0] ?? null)}
                                            className="w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-surface-hover file:px-3 file:py-2 file:text-sm file:font-medium file:text-text-primary"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="submit" fullWidth={false} isLoading={isSavingEdit}>
                                            Save
                                        </Button>
                                        <Button type="button" variant="secondary" fullWidth={false} onClick={cancelEdit}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-medium text-text-primary">
                                            {video.lectureNumber ? `${video.lectureNumber}. ` : ""}
                                            {video.title}
                                        </p>
                                        <p className="mt-1 text-sm text-text-secondary">{video.description}</p>
                                        {video.duration ? <p className="mt-1 text-xs text-text-muted">{video.duration} min</p> : null}
                                    </div>
                                    <div className="flex flex-shrink-0 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => startEdit(video)}
                                            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(video._id)}
                                            disabled={deletingId === video._id}
                                            className="rounded-md border border-danger/30 bg-danger/10 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/20 disabled:opacity-60"
                                        >
                                            {deletingId === video._id ? "Deleting…" : "Delete"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}