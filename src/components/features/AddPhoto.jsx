import ImageCard from '../ui/ImageCard';

import Dropzone from 'react-dropzone';
import { useCallback } from 'react';

function AddPhoto({ filesForUpload, setFiles, removeFile }) {
  // handle when the user drags and drops files in
  const onDrop = useCallback(
    (acceptedFiles) => {
      setFiles(acceptedFiles);
    },
    [setFiles]
  );

  return (
    <div>
      <div>
        <span className="text-2xl font-medium"> Add Photos </span>
      </div>

      {/* Drag and drop are for users to drop/select files */}
      <Dropzone
        onDrop={onDrop}
        accept={
          {
            'image/png': ['.jpeg', '.jpg', '.png', '.tiff', '.hiec'],
          } /* only accept image files */
        }
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            {...getRootProps()}
            className={`mt-4 flex items-center justify-center border-2 border-dashed rounded-lg h-20 cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
          >
            <input {...getInputProps()} />
            {/* Text changes based on whether a file is being dragged over */}
            <p className="text-gray-500 text-sm">
              {isDragActive
                ? 'Drop your photos here...'
                : 'Drag & drop photos here, or click to select'}
            </p>
          </div>
        )}
      </Dropzone>

      <div className="my-5 max-h-[50%] grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] overflow-y-auto">
        {filesForUpload.length > 0 ? (
          filesForUpload.map((file, index) => (
            <ImageCard
              key={index}
              src={URL.createObjectURL(file)}
              name={file.name}
              onRemove={() => removeFile(index)}
            />
          ))
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}

export default AddPhoto;
