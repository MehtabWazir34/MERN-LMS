import { Link } from "react-router-dom";
import PublicLayout from "../../components/layout/Publiclayout";
import Button from "../../components/common/Button";

export default function NotFoundPage() {
    return (
        <PublicLayout>
            <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
                <span className="font-display text-6xl text-primary">404</span>
                <h1 className="mt-4 font-display text-2xl text-text-primary">Page not found</h1>
                <p className="mt-2 text-text-secondary">
                    The page you're looking for doesn't exist or may have moved.
                </p>
                <Link to="/" className="mt-8 w-full max-w-xs">
                    <Button fullWidth>Back to homepage</Button>
                </Link>
            </div>
        </PublicLayout>
    );
}