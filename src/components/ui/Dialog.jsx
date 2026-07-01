/**
 * Simple dialog component for rendering dialogs
 */
function Dialog({
  isOpen = false,
  onClose,
  width = '',
  height = '',
  children,
}) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" />
      {/* Clicks on the overlay area (outside the card) fire onClose; stopPropagation on the card prevents it from closing when clicking inside */}
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        onClick={onClose}
      >
        {/* max-w-md is omitted when a custom width is provided, since max-width would override the inline width style */}
        <div
          className={`bg-white rounded-xl p-4 w-full shadow-xl ${!width ? 'max-w-md' : ''}`}
          style={{ width, height }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );
}

export default Dialog;
