import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import styles from "./Button.module.css";

type Variant = "primary" | "dark" | "outline";

type CommonProps = {
  variant?: Variant;
  icon?: IconName;
  children: ReactNode;
  className?: string;
};

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = CommonProps & { href: string };

/** Uppercase call-to-action as used for Subscribe, Apply coupon, Proceed to checkout. */
export function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", icon, children, className, ...rest } = props;
  const classes = [
    styles.button,
    styles[variant],
    variant === "outline" ? "m-btn-2" : "m-btn",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const content = (
    <>
      <span>{children}</span>
      {icon ? <Icon name={icon} size={16} /> : null}
    </>
  );

  if ("href" in props && props.href !== undefined) {
    return (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }
  const { href: _href, ...buttonProps } = rest as ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };
  void _href;
  return (
    <button type="button" className={classes} {...buttonProps}>
      {content}
    </button>
  );
}
