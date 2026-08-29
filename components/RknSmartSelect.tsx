"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

type SmartChangeEvent = {
  target: {
    value: string;
  };
};

type Props = {
  value?: string | number;
  onChange?: (event: SmartChangeEvent) => void;

  children?: React.ReactNode;

  className?: string;
  disabled?: boolean;

  style?: React.CSSProperties;
  title?: string;

  id?: string;
  name?: string;

  "aria-label"?: string;
};

type SmartOption = {
  value: string;
  label: React.ReactNode;
  searchText: string;
  disabled: boolean;
};

function nodeText(node: React.ReactNode): string {
  if (
    typeof node === "string" ||
    typeof node === "number"
  ) {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(nodeText).join(" ");
  }

  if (React.isValidElement(node)) {
    return nodeText(
      (
        node as React.ReactElement<{
          children?: React.ReactNode;
        }>
      ).props.children
    );
  }

  return "";
}

export default function RknSmartSelect({
  value,
  onChange,
  children,
  className = "",
  disabled = false,
  style,
  title,
  id,
  name,
  "aria-label": ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 240,
    openUp: false,
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const options = useMemo<SmartOption[]>(() => {
    return React.Children.toArray(children)
      .filter((child) => React.isValidElement(child))
      .filter((child) => {
        const element =
          child as React.ReactElement<any>;

        return element.type === "option";
      })
      .map((child) => {
        const element =
          child as React.ReactElement<{
            value?: string | number;
            disabled?: boolean;
            children?: React.ReactNode;
          }>;

        const label = element.props.children;

        const optionValue =
          element.props.value !== undefined
            ? String(element.props.value)
            : nodeText(label);

        return {
          value: optionValue,
          label,
          searchText: nodeText(label).toLowerCase(),
          disabled: Boolean(element.props.disabled),
        };
      });
  }, [children]);

  const currentValue = String(value ?? "");

  const selected =
    options.find(
      (option) => option.value === currentValue
    ) || options[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      return options;
    }

    return options.filter((option) =>
      option.searchText.includes(q)
    );
  }, [options, query]);

  const searchable = options.length >= 7;

  const sourceClasses = className
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (item) =>
        "rkn-smart-source-" +
        item.replace(/[^a-zA-Z0-9_-]/g, "")
    )
    .join(" ");

  function updatePosition() {
    const button = buttonRef.current;

    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();

    const width = Math.max(rect.width, 230);

    const left = Math.min(
      Math.max(8, rect.left),
      Math.max(8, window.innerWidth - width - 8)
    );

    const spaceBelow =
      window.innerHeight - rect.bottom;

    const spaceAbove = rect.top;

    const openUp =
      spaceBelow < 300 &&
      spaceAbove > spaceBelow;

    setPosition({
      width,
      left,
      openUp,
      top: openUp
        ? Math.max(10, rect.top - 372)
        : rect.bottom + 8,
    });
  }

  function toggleOpen() {
    if (disabled) {
      return;
    }

    if (!open) {
      updatePosition();
    }

    setOpen((old) => !old);
    setQuery("");
  }

  function choose(option: SmartOption) {
    if (option.disabled) {
      return;
    }

    onChange?.({
      target: {
        value: option.value,
      },
    });

    setOpen(false);
    setQuery("");
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();

    const sync = () => updatePosition();

    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener(
        "scroll",
        sync,
        true
      );
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener(
        "mousedown",
        onPointer
      );

      document.removeEventListener(
        "keydown",
        onKey
      );
    };
  }, [open]);

  const menu =
    open &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            className={
              "rkn-smart-menu" +
              (position.openUp ? " is-up" : "")
            }
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
            }}
          >
            <div className="rkn-smart-menu-glow" />

            {searchable && (
              <div className="rkn-smart-search-wrap">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />
                  <path d="m20 20-3.7-3.7" />
                </svg>

                <input
                  autoFocus
                  value={query}
                  placeholder="Cari pilihan..."
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      filtered.length === 1
                    ) {
                      choose(filtered[0]);
                    }
                  }}
                />

                {query && (
                  <button
                    type="button"
                    className="rkn-smart-clear"
                    onClick={() => setQuery("")}
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            <div className="rkn-smart-options">
              {filtered.length === 0 && (
                <div className="rkn-smart-empty">
                  Tidak ada pilihan yang cocok
                </div>
              )}

              {filtered.map((option, index) => {
                const active =
                  option.value === currentValue;

                return (
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={option.disabled}
                    key={
                      option.value +
                      "-" +
                      index
                    }
                    className={
                      "rkn-smart-option" +
                      (active ? " is-selected" : "")
                    }
                    onClick={() => choose(option)}
                  >
                    <span className="rkn-smart-option-indicator">
                      {active ? (
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="m5 12 4 4L19 6" />
                        </svg>
                      ) : (
                        <span />
                      )}
                    </span>

                    <span className="rkn-smart-option-label">
                      {option.label}
                    </span>

                    {active && (
                      <span className="rkn-smart-selected-text">
                        ACTIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="rkn-smart-menu-footer">
              <span className="rkn-smart-pulse" />
              RKN SMART SELECT
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div
        className={
          "rkn-smart-select " +
          sourceClasses +
          (open ? " is-open" : "") +
          (disabled ? " is-disabled" : "")
        }
        style={style}
      >
        {name && (
          <input
            type="hidden"
            name={name}
            value={currentValue}
          />
        )}

        <button
          ref={buttonRef}
          id={id}
          type="button"
          title={title}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="rkn-smart-trigger"
          onClick={toggleOpen}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              toggleOpen();
            }

            if (
              event.key === "ArrowDown" &&
              !open
            ) {
              event.preventDefault();
              toggleOpen();
            }
          }}
        >
          <span className="rkn-smart-trigger-dot" />

          <span className="rkn-smart-trigger-label">
            {selected?.label || "Pilih..."}
          </span>

          <span className="rkn-smart-trigger-chevron">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="m7 10 5 5 5-5" />
            </svg>
          </span>
        </button>
      </div>

      {menu}
    </>
  );
}