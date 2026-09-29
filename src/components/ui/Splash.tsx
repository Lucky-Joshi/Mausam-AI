import { motion } from 'framer-motion'

import { dashboard, landing } from '../../data'
import { Icon } from './Icon'

/** Short branded splash shown while the local JSON engine resolves. */
export const Splash = () => (
  <motion.div
    className="splash"
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.45 }}
    role="status"
    aria-label="Loading Mausam AI"
  >
    <motion.div
      className="splash__inner"
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="brand-mark" style={{ width: 54, height: 54 }}>
        <Icon name="cloud-sun" size={28} strokeWidth={2} />
      </span>
      <strong className="splash__title">{dashboard.appName}</strong>
      <span className="splash__tag">{landing.meta.description}</span>
      <span className="splash__bar">
        <i />
      </span>
      <span className="splash__note">{landing.cta.note}</span>
    </motion.div>
  </motion.div>
)
