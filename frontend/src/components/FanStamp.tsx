import { motion } from "framer-motion";
import { Fan } from "lucide-react";
import "./FanStamp.css";

interface FanStampProps {
  index: number;
  filled: boolean;
  isLatest: boolean;
  total: number;
}

export default function FanStamp({ index, filled, isLatest }: FanStampProps) {
  const classes = [
    "fan-stamp",
    filled ? "filled" : "empty",
    isLatest ? "latest" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.div
      className={classes}
      initial={{ opacity: 0, scale: 0.3, rotate: -30 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.5,
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
    >
      <motion.div
        className="fan-stamp-icon"
        whileHover={{ scale: 1.15, rotate: filled ? 15 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <Fan strokeWidth={filled ? 2.5 : 1.5} />
      </motion.div>
      <span className="fan-stamp-label">{index + 1}</span>
    </motion.div>
  );
}
