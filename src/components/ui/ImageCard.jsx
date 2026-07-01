import CloseIcon from '@mui/icons-material/Close';

function ImageCard({ src, name = '', onRemove }) {
  return (
    // `group` enables hover-triggered children via `group-hover:` classes
    <div className="aspect-square flex flex-col items-center m-1 relative group">
      <div className="relative">
        <img className="mb-1 h-20 w-20 rounded-lg object-cover" src={src} />
        {/* Remove button — hidden until the card is hovered */}
        <button
          onClick={onRemove}
          className="absolute m-1 top-0 right-0 bg-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <CloseIcon sx={{ fontSize: 12 }} />
        </button>
      </div>
      <span className="text-xs"> {name} </span>
    </div>
  );
}

export default ImageCard;
