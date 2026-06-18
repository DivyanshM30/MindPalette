export default function YearViewLoading() {
    return (
        <div className="min-h-screen flex flex-col items-center p-4 pt-24 animate-pulse">
            {/* Title skeleton */}
            <div className="h-8 w-40 rounded-xl bg-gray-200 dark:bg-gray-800 mb-6" />

            {/* Year grid skeleton */}
            <div className="w-full max-w-4xl grid grid-cols-4 sm:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-800" />
                        <div className="grid grid-cols-7 gap-0.5">
                            {[...Array(35)].map((_, j) => (
                                <div key={j} className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-800" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
