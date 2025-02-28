import React from 'react'

let className = {
  default:
    'py-1 px-2 rounded text-xs font-medium border bg-zinc-950 hover:bg-zinc-900/90 text-nowrap',
}

type Props = {
  variant?: 'default'
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export default function Button({
  children,
  variant = 'default',
  ...props
}: React.PropsWithChildren & Props) {
  return (
    <button className={className[variant]} {...props}>
      {children}
    </button>
  )
}
