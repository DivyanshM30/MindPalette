export default function DayViewLoading() {
    return (
        <div className="min-h-screen flex flex-col items-center p-4 pt-24 animate-pulse">
            {/* Date nav skeleton */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="w-48 h-8 rounded-xl bg-gray-200 dark:bg-gray-800" />
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800" />
            </div>

            {/* Mood selector skeleton */}
            <div className="w-full max-w-md space-y-4">
                <div className="h-6 w-32 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="grid grid-cols-5 gap-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl bg-gray-200 dark:bg-gray-800" />
                    ))}
                </div>

                {/* Note area skeleton */}
                <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-800 mt-6" />
                <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-800" />

                {/* Button skeleton */}
                <div className="h-12 rounded-xl bg-gray-200 dark:bg-gray-800 mt-4" />
            </div>
        </div>
    )
}
