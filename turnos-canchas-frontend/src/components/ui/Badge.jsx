import "./Badge.css"
export function Badge({ children, tone = "green", ...props }) {
  return <span className={`badge badge--${tone}`} {...props}>{children}</span>
}
