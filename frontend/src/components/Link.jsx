import React from "react";

function navigate(to) {
  window.history.pushState({}, "", to);
  try {
    window.dispatchEvent(new PopStateEvent("popstate"));
  } catch {
    window.dispatchEvent(new Event("popstate"));
  }
}

export default function Link({ to, className, children, ...rest }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.defaultPrevented) return;
        if (e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        try {
          navigate(to);
        } catch {
          window.location.assign(to);
        }
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
