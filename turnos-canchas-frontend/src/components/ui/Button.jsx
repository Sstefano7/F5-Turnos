import { cn } from "../../utils/cn"
import "./Button.css"

export function Button({ variant = "primary", size = "md", children, className, block, fullWidth, ...props }) {
  const blockClass = block || fullWidth ? "btn--full" : "";
  return (
    <button
      className={cn("btn", `btn--${variant}`, `btn--${size}`, blockClass, className)}
      {...props}
    >
      {children}
    </button>
  )
}
