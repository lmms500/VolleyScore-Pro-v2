import { ScreenOrientation } from '@capacitor/screen-orientation';

type OrientationLockType = 'any' | 'natural' | 'landscape' | 'portrait' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary';

export const useScreenOrientation = () => {

  const lockOrientation = async (orientation: OrientationLockType) => {
    try {
      await ScreenOrientation.lock({ orientation });
    } catch (error) {
      console.error('Failed to lock screen orientation', error);
    }
  };

  const unlockOrientation = async () => {
    try {
      await ScreenOrientation.unlock();
    } catch (error) {
      console.error('Failed to unlock screen orientation', error);
    }
  };

  const getCurrentOrientation = async () => {
    try {
      const { type } = await ScreenOrientation.orientation();
      return type;
    } catch (error) {
      console.error('Failed to get current orientation', error);
      return null;
    }
  }

  return { lockOrientation, unlockOrientation, getCurrentOrientation };
};
