import { useState } from "react";
import DashboardShell from "../components/layout/Dashboardshell";
import Input from "../components/common/Input.jsx";
import Button from "../components/common/Button.jsx";
import Alert from "../components/common/Alert.jsx";
import { updateMyProfile } from "../api/profile.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ROLES } from "../utils/roles.js";
import { Link } from "react-router-dom";

export default function ProfilePage() {
    const { user, role, updateUser } = useAuth();

    const [form, setForm] = useState({
        name: user?.name || "",
        contactNumber: user?.contactNumber || "",
        address: user?.address || "",
        about: user?.about || "",
    });
    const [pic, setPic] = useState(null);
    const [banner, setBanner] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Only ever true for a learner — instructors/admins never lock.
    const isLocked = role === ROLES.LEARNER && Boolean(user?.profileLocked);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBanner(null);
        setIsSubmitting(true);
        try {
            const payload = { name: form.name, contactNumber: form.contactNumber, address: form.address };
            if (role === ROLES.INSTRUCTOR) payload.about = form.about;
            if (pic) payload.pic = pic;

            const data = await updateMyProfile(role, payload);
            const updated = data.learner || data.instructor || data.admin;
            updateUser(updated);
            setPic(null);
            setBanner({ variant: "success", message: data.msg });
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to update profile" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardShell title="My Profile">
            <Link to="/" className="text-sm font-medium text-primary hover:bg-surface-hover border-border bg-surface p-2 rounded-lg ">
                                       ← Back to Home
                                    </Link>
            {banner && (
                <div className=" max-w-lg">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                </div>
            )}

            {isLocked ? (
                <div className="max-w-lg space-y-4 mt-4">
                    <Alert variant="info">
                        Your profile can only be edited once, and that edit has already been used. Contact an admin
                        if anything needs to change.
                    </Alert>
                    <div className="rounded-lg border border-border bg-surface p-4 my-4 ">
                        {user?.pic && (
                            <img src={user.pic} alt={user.name} className="my-4 h-24 w-24 rounded-full object-cover mx-auto" />
                        )}
                        <dl className="space-y-2 text-sm">
                            <div>
                                <dt className="text-text-muted">Name</dt>
                                <dd className="text-text-primary">{user?.name}</dd>
                            </div>
                            <div>
                                <dt className="text-text-muted">Email</dt>
                                <dd className="text-text-primary">{user?.email}</dd>
                            </div>
                            <div>
                                <dt className="text-text-muted">Contact number</dt>
                                <dd className="text-text-primary">{user?.contactNumber || "—"}</dd>
                            </div>
                            <div>
                                <dt className="text-text-muted">Address</dt>
                                <dd className="text-text-primary">{user?.address || "—"}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
                    {role === ROLES.LEARNER && (
                        <Alert variant="warning">
                            You can edit your profile only once. After saving, these details become permanently
                            locked and any further changes will need an admin.
                        </Alert>
                    )}

                    <div className="w-full flex flex-col items-center">
                        {user?.pic && !pic && (
                            <img src={user.pic} alt={user.name} className="mb-2 h-24 w-24 rounded-full object-cover border" />
                        )}
                        <label htmlFor="pic" className="mb-1.5 block text-sm font-medium text-text-secondary my-4 border-border border rounded-lg cursor-pointer p-1">Profile photo</label>
                        <input 
                            id="pic"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPic(e.target.files?.[0] ?? null)}
                            className="hidden "
                        />
                    </div>

                    <Input id="profile-name" name="name" label="Name" value={form.name} onChange={handleChange} />
                    <Input id="profile-email" label="Email" value={user?.email || ""} disabled />

                    <Input
                        id="profile-contact"
                        name="contactNumber"
                        label="Contact number"
                        value={form.contactNumber}
                        onChange={handleChange}
                    />

                    <div className="w-full">
                        <label htmlFor="profile-address" className="mb-1.5 block text-sm font-medium text-text-secondary">
                            Address
                        </label>
                        <textarea
                            id="profile-address"
                            name="address"
                            rows={3}
                            value={form.address}
                            onChange={handleChange}
                            className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>

                    {role === ROLES.INSTRUCTOR && (
                        <div className="w-full">
                            <label htmlFor="profile-about" className="mb-1.5 block text-sm font-medium text-text-secondary">
                                About
                            </label>
                            <textarea
                                id="profile-about"
                                name="about"
                                rows={3}
                                value={form.about}
                                onChange={handleChange}
                                className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                        </div>
                    )}

                    <Button type="submit" fullWidth={false} className="px-6" isLoading={isSubmitting}>
                        {role === ROLES.LEARNER ? "Save (one-time)" : "Save changes"}
                    </Button>
                </form>
            )}
        </DashboardShell>
    );
}