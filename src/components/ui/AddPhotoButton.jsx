import AddIcon from '@mui/icons-material/Add';

function AddPhotoButton({ onClick }) {
  return (
    <>
      <button
        className="absolute h-10 w-10 z-10 bg-white m-3 rounded-full hover:shadow-sm active:brightness-95 transition-opacity"
        onClick={onClick}
      >
        <AddIcon className="text-primary" />
      </button>
    </>
  );
}

export default AddPhotoButton;
