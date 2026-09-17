import Navbar from "./Navbar";

export default function PublicLayout({ children }) {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main>{children}</main>
            <footer className="border-t border-border px-6 py-8 text-center text-sm text-text-muted">
                © {new Date().getFullYear()} Ledger LMS
            </footer>
        </div>
    );
}