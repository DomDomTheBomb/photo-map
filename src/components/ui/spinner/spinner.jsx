import './spinner.css';

// Destructure size from props; defaults to null (no custom sizing applied)
function Spinner({ size = null, thickness = null}) {
  const optionalStyles = {}

  if (size) {
    optionalStyles['width'] = size
    optionalStyles['height'] = size
    if (!thickness) optionalStyles['border-width'] = `calc(5/48 * ${size})`
  }

  if (thickness) {
    optionalStyles['border-width'] = thickness
  }

  return <span className="loader" style={optionalStyles}></span>;
}

export default Spinner;
