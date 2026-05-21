"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  iconName: keyof typeof LucideIcons;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  delay?: number;
}

export function KpiCard({ title, value, description, iconName, trend, trendValue, delay = 0 }: KpiCardProps) {
  const Icon = LucideIcons[iconName] as LucideIcons.LucideIcon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="bg-card border-border hover:border-primary/50 transition-colors duration-300 shadow-sm hover:shadow-primary/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          )}
          {trendValue && trend && (
            <p className={`text-xs mt-1 ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-muted-foreground'}`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {trendValue}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
