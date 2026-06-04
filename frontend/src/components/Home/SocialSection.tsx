import { motion } from 'framer-motion';
import { SOCIAL_LINKS } from '../../config';
import { InstagramIcon, WhatsAppIcon, YoutubeIcon, PinterestIcon, TwitterIcon } from '../../lib/socialIcons';
import { cinematicStagger, cinematicItem } from '../AnimatedPage';

const SOCIAL_ITEMS = [
  { key: 'instagram', href: SOCIAL_LINKS.instagram, label: 'Instagram', Icon: InstagramIcon },
  { key: 'whatsapp', href: SOCIAL_LINKS.whatsapp, label: 'WhatsApp', Icon: WhatsAppIcon },
  { key: 'youtube', href: SOCIAL_LINKS.youtube, label: 'YouTube', Icon: YoutubeIcon },
  { key: 'pinterest', href: SOCIAL_LINKS.pinterest, label: 'Pinterest', Icon: PinterestIcon },
  { key: 'twitter', href: SOCIAL_LINKS.twitter, label: 'Twitter', Icon: TwitterIcon },
];

export default function SocialSection() {
  return (
    <motion.section
      className="section delivery-section"
      id="social-section"
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.3 }}
      variants={cinematicStagger}
    >
      {/* Corner decorations */}
      <div className="bauhaus-corner bauhaus-corner-tl" />
      <div className="bauhaus-corner bauhaus-corner-br" />

      <div className="container delivery-content">
        <motion.div className="social-icons-row" variants={cinematicItem}>
          {SOCIAL_ITEMS.map(({ key, href, label, Icon }) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-wrap"
              aria-label={label}
            >
              <Icon size={28} />
            </a>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

