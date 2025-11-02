import { useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
export default function StoryCard(_a) {
    var story = _a.story, onSelect = _a.onSelect, _b = _a.isSelectable, isSelectable = _b === void 0 ? true : _b;
    // Create a completely random order every time the component is mounted
    // using a combination of Math.random() and unique component instance state
    var isRandomized = useState(function () {
        // Generate a completely random value every time, with no dependence on story ID
        return Math.random() > 0.5;
    })[0];
    // Determine which version appears in which position
    var firstVersion = isRandomized ? story.true_version : story.fake_version;
    var secondVersion = isRandomized ? story.fake_version : story.true_version;
    var handleSelectFirst = function () {
        onSelect(isRandomized ? "true" : "fake");
    };
    var handleSelectSecond = function () {
        onSelect(isRandomized ? "fake" : "true");
    };
    // Card style helpers
    var baseCard = "rounded-2xl w-[150%] max-w-4xl text-[#00ffe0] transition-all duration-300 hover:scale-105 hover:shadow-xl";
    var neonA = "bg-[#110263] border-4 border-[#00eeff] shadow-[0_0_16px_2px_#00eeff55] hover:shadow-[0_0_32px_6px_#00eeff99]";
    var neonB = "bg-[#370049] border-4 border-[#9e4f8e] shadow-[0_0_16px_2px_#9e4f8e55] hover:shadow-[0_0_32px_6px_#9e4f8e99]";
    return (<div className="flex flex-col items-center gap-6 mb-8">
      <motion.div whileHover={{ scale: 1.05, boxShadow: "0 0 32px 6px #00eeff" }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className={"".concat(baseCard, " ").concat(neonA)}>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-3">Version A</h3>
          <p>{firstVersion}</p>
        </CardContent>
        {isSelectable && (<div className="px-6 py-4 bg-[#110263] border-t border-[#00eeff]">
            <Button className="w-full text-[#ffd700] border-none bg-transparent hover:bg-[#ffd700]/10" onClick={handleSelectFirst} variant="default">
              Select as True
            </Button>
          </div>)}
      </motion.div>

      <motion.div whileHover={{ scale: 1.05, boxShadow: "0 0 32px 6px #9e4f8e" }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className={"".concat(baseCard, " ").concat(neonB)}>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-3">Version B</h3>
          <p>{secondVersion}</p>
        </CardContent>
        {isSelectable && (<div className="px-6 py-4 bg-[#370049] border-t border-[#9e4f8e]">
            <Button className="w-full text-[#9e4f8e] border-none bg-transparent hover:bg-[#9e4f8e]/10" onClick={handleSelectSecond} variant="default">
              Select as True
            </Button>
          </div>)}
      </motion.div>
    </div>);
}
