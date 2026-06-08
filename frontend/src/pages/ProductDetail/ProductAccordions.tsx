import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export function AccordionItem({
  title,
  isOpen,
  onClick,
  children,
}: {
  title: string;
  isOpen: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="pdp-accordion">
      <button className="pdp-accordion-trigger" onClick={onClick}>
        {title}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="pdp-accordion-content-inner">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FeatureAccordionItem({
  icon,
  title,
  isOpen,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  isOpen: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="feature-accordion">
      <button className="feature-accordion-trigger" onClick={onClick}>
        <div className="feature-accordion-left">
          <span className="feature-accordion-icon">{icon}</span>
          <span className="feature-accordion-title">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="feature-accordion-content">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
