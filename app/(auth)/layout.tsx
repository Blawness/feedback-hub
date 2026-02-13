export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                {children}
            </div>
        </div>
    );
}
