import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    color?: string;
}

export function StatCard({ label, value, icon: Icon, trend, trendUp, color = "blue" }: StatCardProps) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        purple: "bg-purple-50 text-purple-600",
        orange: "bg-orange-50 text-orange-600",
        green: "bg-green-50 text-green-600",
    }[color] || "bg-gray-50 text-gray-600";

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${colorClasses}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">{label}</p>
            </div>
        </div>
    );
}
