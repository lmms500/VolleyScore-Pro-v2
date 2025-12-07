import { useState, useEffect } from 'react';

const getOrientation = () => window.screen.orientation.type;

export const useScreenOrientation = () => {
  const [orientation, setOrientation] = useState(getOrientation());

  useEffect(() => {
    const handleOrientationChange = () => setOrientation(getOrientation());

    const orientation = window.screen.orientation;
    orientation.addEventListener('change', handleOrientationChange);

    return () => {
      orientation.removeEventListener('change', handleOrientationChange);
    };
  }, []);

  return orientation;
};
