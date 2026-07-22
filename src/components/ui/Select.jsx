import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * A searchable dropdown (combobox) component.
 *
 * The dropdown panel is rendered via a React portal into document.body so it
 * escapes any ancestor with overflow:auto/hidden — otherwise the panel would
 * be clipped by scroll containers.
 *
 * Props:
 *  - items       {Array}    List of items — can be primitives (strings/numbers) or objects.
 *  - valueKey    {string}   For object items: which key is used as the selected value passed to onChange.
 *  - labelKey    {string}   For object items: which key is shown as display text and used for filtering.
 *  - onChange    {function} Called with the resolved value when the user selects an item.
 *  - placeholder {string}   Placeholder shown when nothing is selected.
 *  - value       {any}      Optional controlled value — pre-selects the item whose valueKey matches.
 *  - children    {function} Optional render prop — receives the item and returns JSX for each list row.
 *                           If omitted, falls back to rendering the resolved label as plain text.
 */
/**
 * Additional props:
 *  - onSearch {function} When provided, fires with the raw search string on every
 *                        keystroke. The parent is responsible for updating `items`
 *                        based on the query. Internal client-side filtering is
 *                        skipped so the API results are shown as-is.
 *  - loading  {boolean}  When true, replaces the item list with a spinner. Useful
 *                        when items are fetched asynchronously via onSearch.
 */
function Select({
  items = [],
  valueKey,
  labelKey,
  onChange,
  placeholder = 'Select...',
  value,
  children,
  prependItem = null,
  onSearch,
  loading = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null); // full item object of the user's explicit pick
  const [dropdownPos, setDropdownPos] = useState(null); // {top, left, width} for portal positioning

  const triggerRef = useRef(null); // attached to the trigger button
  const dropdownRef = useRef(null); // attached to the portaled dropdown div

  // Resolve the display label for an item (works for both primitives and objects)
  function getLabel(item) {
    if (item === null || item === undefined) return '';
    if (labelKey && typeof item === 'object')
      return String(item[labelKey] ?? '');
    return String(item);
  }

  // Resolve the exported value for an item (the thing passed to onChange)
  function getValue(item) {
    if (valueKey && typeof item === 'object') return item[valueKey];
    return item;
  }

  // Derive the display label purely during render — no useEffect needed:
  //  1. Prefer an explicit user selection
  //  2. Fall back to the item whose value matches the `value` prop (e.g. GPS pre-set)
  //  3. Fall back to empty string (placeholder will show)
  function getDisplayLabel() {
    if (selectedItem) return getLabel(selectedItem);
    if (value !== undefined && value !== null) {
      const match = items.find((item) => getValue(item) === value);
      return match ? getLabel(match) : '';
    }
    return '';
  }

  // When onSearch is provided the parent handles filtering via the API,
  // so skip local filtering and display items as-is.
  const filteredItems = onSearch
    ? items
    : items.filter((item) =>
        getLabel(item).toLowerCase().includes(search.toLowerCase())
      );

  function handleSelect(item) {
    setSelectedItem(item);
    setSearch(''); // reset search so next open starts fresh
    setIsOpen(false);
    onChange?.(getValue(item));
  }

  function handleTriggerClick() {
    if (!isOpen) {
      // Snapshot the trigger's viewport position so the portal can align to it
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4, // 4px gap below the trigger
        left: rect.left,
        width: rect.width,
      });
      setSearch('');
    }
    setIsOpen((v) => !v);
  }

  // Close when the user clicks outside both the trigger and the portaled dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      const inTrigger = triggerRef.current?.contains(e.target);
      const inDropdown = dropdownRef.current?.contains(e.target);
      if (!inTrigger && !inDropdown) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayLabel = getDisplayLabel();

  return (
    <div className="relative w-full">
      {/* Trigger button — shows the selected label or placeholder text */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        className="w-full flex items-center border-0 my-1 justify-between pr-3 bg-white rounded-xs text-sm hover:border focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
      >
        <span className={displayLabel ? 'text-gray-900' : 'text-gray-400'}>
          {displayLabel || placeholder}
        </span>
        {/* Chevron flips when the dropdown is open */}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown panel — portaled into document.body so it escapes overflow clipping.
          Uses position:fixed with coordinates from getBoundingClientRect() on the trigger. */}
      {isOpen &&
        dropdownPos &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
            }}
            className="z-50 bg-white border border-gray-200 rounded-lg shadow-lg"
          >
            {/* Search input */}
            <div className="p-2 border-b border-gray-100">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  // Notify parent so it can trigger an async search (e.g. debounced API call)
                  onSearch?.(e.target.value);
                }}
                placeholder="Search..."
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Filtered item list — shows a spinner while an async search is in flight */}
            <ul className="max-h-48 overflow-y-auto py-1">
              {prependItem != null ? (
                <li className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 active:bg-gray-200">
                  {' '}
                  {prependItem}{' '}
                </li>
              ) : (
                ''
              )}
              {loading ? (
                <li className="flex justify-center items-center py-4">
                  <svg
                    className="w-5 h-5 animate-spin text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    {/* Track ring */}
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    {/* Spinning arc */}
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                </li>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item, i) => (
                  <li
                    key={i}
                    onClick={() => handleSelect(item)}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 active:bg-gray-200"
                  >
                    {/* Use the render-prop children if provided, otherwise fall back to plain label text */}
                    {typeof children === 'function'
                      ? children(item)
                      : getLabel(item)}
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-sm text-gray-400 text-center italic">
                  No results
                </li>
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}

export default Select;
