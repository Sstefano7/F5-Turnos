import "./Card.css"
export function Card({ children, className = "", hover = false, ...props }) {
  return <div className={`card ${hover ? "card--hover" : ""} ${className}`} {...props}>{children}</div>
}
export function CardMedia({ src, alt, badge }) {
  return (
    <div className="card__media">
      <img src={src} alt={alt} loading="lazy" />
      {badge && <div className="card__media-badge">{badge}</div>}
    </div>
  )
}
