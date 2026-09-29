import { motion } from 'framer-motion'

import { Icon } from './Icon'

type Props = {
  title: string
  subtitle?: string
  icon: string
  action?: React.ReactNode
}

export const SectionHead = ({ title, subtitle, icon, action }: Props) => (
  <div className="section-head">
    <div className="section-head__title">
      <motion.span
        className="section-head__icon"
        initial={{ opacity: 0, scale: 0.7, rotate: -12 }}
        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Icon name={icon} size={18} />
      </motion.span>
      <div className="section-head__text">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </div>
    {action}
  </div>
)
