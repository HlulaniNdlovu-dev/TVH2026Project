import { useRef, useState } from 'react';
import { fileToDataUrl } from '../utils/image.js';
import Icon from './Icon.jsx';

// Optional photo attachments. `value` is a list of small JPEG data URLs.
export default function PhotoPicker({ value, onChange, max = 1, label = 'Add a photo (optional)' }) {
  const input = useRef(null);
  const [error, setError] = useState('');

  const handleFiles = async (event) => {
    const files = [...event.target.files].slice(0, max - value.length);
    event.target.value = '';
    try {
      const urls = await Promise.all(files.map((f) => fileToDataUrl(f)));
      onChange([...value, ...urls]);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="photo-row">
        {value.map((src, i) => (
          <div className="photo-thumb" key={src.slice(-30) + i}>
            <img src={src} alt={`Attachment ${i + 1}`} />
            <button type="button" aria-label="Remove photo" onClick={() => onChange(value.filter((_, j) => j !== i))}>
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button type="button" className="photo-add" onClick={() => input.current?.click()}>
            <Icon name="camera" size={22} />
            <span>{label}</span>
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple={max > 1} hidden onChange={handleFiles} />
      {error && <div className="error small">{error}</div>}
    </div>
  );
}
