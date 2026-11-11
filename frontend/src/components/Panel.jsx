function Panel({ title, subtitle, action, className = '', children }) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <div className="panel-heading">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action && <div className="panel-action">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export default Panel
