export default function InsightsLoading() {
    return (
        <div className="min-h-screen flex flex-col items-center p-4 pt-24 animate-pulse">
            {/* Title skeleton */}
            <div className="h-8 w-32 rounded-xl bg-gray-200 dark:bg-gray-800 mb-8" />

            {/* Chart skeleton */}
            <div className="w-full max-w-2xl h-48 rounded-2xl bg-gray-200 dark:bg-gray-800 mb-8" />

            {/* Stats cards skeleton */}
            <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800" />
                ))}
            </div>

            {/* Monthly breakdown skeleton */}
            <div className="w-full max-w-2xl space-y-3">
                <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-800" />
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 rounded-xl bg-gray-200 dark:bg-gray-800" />
                ))}
            </div>
        </div>
    )
}
