'use client';

import { LucideIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PathwayTopicProps {
  title: string;
  description: string;
  icon: LucideIcon;
  progress: number;
  colorClass: string;
  onClick?: () => void;
}

export function PathwayTopic({ title, description, icon: Icon, progress, colorClass, onClick }: PathwayTopicProps) {
  return (
    <div className={`group relative p-6 rounded-3xl border border-border bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 transform hover:-translate-y-1`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-10 transition-colors group-hover:scale-110 duration-300`}>
          <Icon className={`w-8 h-8 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-black text-foreground">{progress}%</span>
          <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">DOMINIO</span>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-black mb-1 text-foreground group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-muted-foreground font-medium line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-muted-foreground uppercase">
            <span>PROGRESO</span>
            <span>NIVEL 1</span>
          </div>
          <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden">
             <div
               className={`h-full transition-all duration-1000 ease-out rounded-full ${colorClass}`}
               style={{ width: `${progress}%` }}
             />
          </div>
        </div>

        <Button
          onClick={onClick}
          className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/10 group-hover:scale-[1.02] transition-transform active:scale-95"
        >
          <Play className="w-4 h-4 mr-2 fill-current" />
          Practicar ahora
        </Button>
      </div>
    </div>
  );
}
