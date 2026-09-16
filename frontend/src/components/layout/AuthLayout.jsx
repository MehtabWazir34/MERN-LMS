export default function AuthLayout({ title, subtitle, children }) {
    return (
        <div className="min-h-screen bg-background md:flex">
            <div className="hidden flex-col justify-between bg-primary px-10 py-12 text-white md:flex md:w-2/5">
                <span className="font-display text-2xl tracking-tight">Ledger LMS</span>
                <div>
                    <h1 className="font-display text-3xl leading-tight">
                        Coursework, grading, and progress — kept in one place.
                    </h1>
                    <p className="mt-4 max-w-sm text-sm text-white/70">
                        One account, one role, one clear path — whether you're teaching a
                        course, running the platform, or working through one.
                    </p>
                </div>
                <p className="text-xs text-white/50">© {new Date().getFullYear()} Ledger LMS</p>
            </div>

            <div className="flex w-full items-center justify-center px-6 py-12 md:w-3/5">
                <div className="w-full max-w-sm">
                    <div className="mb-8 md:hidden">
                        <span className="font-display text-xl text-primary">Ledger LMS</span>
                    </div>
                    <h2 className="font-display text-2xl text-text-primary">{title}</h2>
                    {subtitle && <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>}
                    <div className="mt-8">{children}</div>
                </div>
            </div>
        </div>
    );
}