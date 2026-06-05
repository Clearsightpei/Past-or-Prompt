import { useState } from "react";
import { Story } from "@shared/schema";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface StoryCardProps {
  story: Story;
  // The AI-generated fake to play against, fetched from /api/stories/:id/fake.
  fakeVersion: string;
  onSelect: (choice: "true" | "fake") => void;
  isSelectable?: boolean;
}

export default function StoryCard({ story, fakeVersion, onSelect, isSelectable = true }: StoryCardProps) {
  // Randomize which side shows the true vs fake version on each mount.
  const [isRandomized] = useState(() => Math.random() > 0.5);

  const firstVersion = isRandomized ? story.true_version : fakeVersion;
  const secondVersion = isRandomized ? fakeVersion : story.true_version;

  const handleSelectFirst = () => onSelect(isRandomized ? "true" : "fake");
  const handleSelectSecond = () => onSelect(isRandomized ? "fake" : "true");

  const card =
    "rounded-xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
      {[
        { label: "A", text: firstVersion, accent: "border-l-sky-400", onSel: handleSelectFirst },
        { label: "B", text: secondVersion, accent: "border-l-amber-400", onSel: handleSelectSecond },
      ].map((v) => (
        <motion.div
          key={v.label}
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className={`${card} border-l-4 ${v.accent} flex flex-col`}
        >
          <CardContent className="p-6 flex-1">
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wide text-stone-400 mb-3">
              Version {v.label}
            </h3>
            <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{v.text}</p>
          </CardContent>
          {isSelectable && (
            <div className="px-6 py-4 border-t border-stone-100">
              <Button variant="outline" className="w-full" onClick={v.onSel}>
                This one is real
              </Button>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
