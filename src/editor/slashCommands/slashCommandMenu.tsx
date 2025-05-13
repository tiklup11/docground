// src/editor/slashCommands/SlashCommandMenu.tsx
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { SlashCommandMenuComponentProps } from "./slashCommand.config";
import "./menuStyles.css";

export interface SlashCommandMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

const SlashCommandMenu = forwardRef<
  SlashCommandMenuRef,
  SlashCommandMenuComponentProps
>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevItemsLengthRef = useRef(props.items.length); // Track previous items length

  const selectItem = useCallback(
    (index: number) => {
      const item = props.items[index];
      if (item) {
        props.command(item); // This is TipTap's internal command to select the item
        // The actual execution of the slash command's action happens in LiveMarkdownEditor's
        // slashSuggestionOptions.command based on the `props` passed there.
        // After selection, we should signal to close.
        props.onClose(); // Explicitly call onClose after selection
      }
    },
    [props]
  ); // props.command and props.onClose are stable if memoized in parent

  useImperativeHandle(ref, () => ({
    onKeyDown: (event: KeyboardEvent): boolean => {
      if (event.key === "ArrowUp") {
        setSelectedIndex(
          (prevIndex) =>
            (prevIndex + props.items.length - 1) % props.items.length
        );
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((prevIndex) => (prevIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === "Enter") {
        if (props.items[selectedIndex]) {
          selectItem(selectedIndex);
          // props.onClose() is called within selectItem
        } else if (props.items.length === 0) {
          // If enter is pressed and there are no items, close the menu
          props.onClose();
        }
        return true;
      }
      if (event.key === "Escape") {
        // Handle Escape directly in menu's keydown as well
        props.onClose();
        return true;
      }
      return false;
    },
  }));

  useEffect(() => {
    // If items list becomes empty and it previously had items (meaning query resulted in no matches)
    // and the menu is meant to be active (implied by this component rendering), then close.
    if (props.items.length === 0 && prevItemsLengthRef.current > 0) {
      console.log("[SlashCommandMenu] No items match query, calling onClose.");
      props.onClose();
    }
    prevItemsLengthRef.current = props.items.length; // Update previous length for next render
  }, [props.items, props.onClose]);

  useEffect(() => {
    // Reset selected index only if items array actually changes identity or length,
    // or if the query changes (which would lead to new items).
    setSelectedIndex(0);
  }, [props.items]); // Simpler dependency: only react to items list changing

  useEffect(() => {
    if (
      scrollContainerRef.current &&
      props.items.length > 0 &&
      props.items[selectedIndex]
    ) {
      const itemsOffset = scrollContainerRef.current.querySelector(
        ".menu-title"
      )
        ? 1
        : 0;
      const selectedItemElement = scrollContainerRef.current.children[
        selectedIndex + itemsOffset
      ] as HTMLElement;
      if (selectedItemElement) {
        selectedItemElement.scrollIntoView({
          behavior: "auto",
          block: "nearest",
        });
      }
    }
  }, [selectedIndex, props.items]);

  // If this component is rendered but there are no items (e.g. initial empty query before user types)
  // it might be better to not render anything, or rely on the parent (LiveMarkdownEditor)
  // to not render this component if items are empty *after* a query.
  // The useEffect above handles closing if items become empty *after* having items.
  // If initial items list is empty, it might flash, so parent should control rendering.
  if (props.items.length === 0 && props.query !== "") {
    // Only hide if query is not empty but results are
    // This might already be handled by the useEffect calling onClose,
    // but this provides an immediate non-render.
    return null;
  }

  return (
    <div
      id="slash-command-menu"
      ref={scrollContainerRef}
      className="tippy-content"
    >
      <div className="menu-title">Blocks</div>
      {props.items.map((item, index) => (
        <button
          key={item.id}
          className={`menu-item ${index === selectedIndex ? "selected" : ""}`}
          onClick={() => selectItem(index)}
          type="button"
        >
          <div className="item-content">
            <div className="item-title">{item.title}</div>
            {item.description && (
              <div className="item-description">{item.description}</div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
});

SlashCommandMenu.displayName = "SlashCommandMenu";

export default SlashCommandMenu;
