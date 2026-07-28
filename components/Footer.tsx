'use client'
import { usePathname } from 'next/navigation'
import { Github, Linkedin, Mail, Heart } from 'lucide-react'

export default function Footer() {
    const pathname = usePathname()

    // Hide footer on login page
    if (pathname === '/login') return null
    return (
        <footer className="print-hide w-full border-t border-gray-200 dark:border-gray-800 mt-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>Made with</span>
                        <Heart size={14} className="text-pink-500 fill-pink-500" />
                        <span>by Divyansh Mishra</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <a
                            href="https://github.com/DivyanshM30"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            aria-label="Visit GitHub profile"
                            title="GitHub"
                        >
                            <Github size={20} />
                        </a>
                        <a
                            href="https://www.linkedin.com/in/DivyanshM30"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-blue-600"
                            aria-label="Visit LinkedIn profile"
                            title="LinkedIn"
                        >
                            <Linkedin size={20} />
                        </a>
                        <a
                            href="mailto:divyanshm.code@gmail.com"
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-purple-600"
                            aria-label="Send email"
                            title="Email"
                        >
                            <Mail size={20} />
                        </a>
                    </div>

                    <div className="text-xs text-gray-400 dark:text-gray-500">
                        © {new Date().getFullYear()} MindPalette. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    )
}
