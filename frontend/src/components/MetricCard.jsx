function MetricCard({ label, value, unit, icon: Icon, tone = 'blue', footnote }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon tone-${tone}`}><Icon size={19} strokeWidth={2} /></div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}<span>{unit}</span></div>
      {footnote && <div className="metric-footnote">{footnote}</div>}
    </article>
  )
}

export default MetricCard
