"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface AnalysisCardProps {
  title: string;
  icon: LucideIcon;
  items: string[];
  delay?: number;
  badgeColor?: "default" | "destructive" | "secondary" | "outline";
}

export function AnalysisCard({ title, icon: Icon, items, delay = 0, badgeColor = "default" }: AnalysisCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="h-full bg-card border-border hover:border-primary/30 transition-colors">
        <CardHeader className="flex flex-row items-center gap-2 pb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Aucune donnée disponible.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item, i) => (
                <motion.li 
                  key={i} 
                  className="flex items-start"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.1 + i * 0.1 }}
                >
                  <span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-sm text-foreground/90">{item}</span>
                </motion.li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
