import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const sounds = {};
let ready = false;

async function initAudio() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,   // play even when iOS silent switch is ON
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    const load = async (key, file, vol = 1.0) => {
      const { sound } = await Audio.Sound.createAsync(file, { volume: vol, shouldPlay: false });
      sounds[key] = sound;
    };
    await Promise.all([
      load('tap',     require('../../assets/sounds/tap.wav'),     0.8),
      load('success', require('../../assets/sounds/success.wav'), 1.0),
      load('cash',    require('../../assets/sounds/cash.wav'),    1.0),
      load('error',   require('../../assets/sounds/error.wav'),   1.0),
      load('notify',  require('../../assets/sounds/notify.wav'),  0.9),
    ]);
    ready = true;
  } catch (e) {
    console.warn('[Audio] init failed:', e?.message);
  }
}

initAudio();

async function play(key) {
  try {
    if (!ready) return;
    const s = sounds[key];
    if (!s) return;
    await s.stopAsync();
    await s.setPositionAsync(0);
    await s.playAsync();
  } catch (e) {
    console.warn('[Audio] play failed:', e?.message);
  }
}

export const feedbackTap = () => {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  play('tap');
};

export const feedbackSelect = () => {
  try { Haptics.selectionAsync(); } catch {}
  play('tap');
};

export const feedbackLight = () => {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
};

export const feedbackMedium = () => {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
};

export const feedbackHeavy = () => {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
};

export const feedbackSuccess = () => {
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
  play('success');
};

export const feedbackCash = () => {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
  play('cash');
};

export const feedbackError = () => {
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
  play('error');
};

export const feedbackWarning = () => {
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
  play('notify');
};

export const feedbackNotify = () => {
  try { Haptics.selectionAsync(); } catch {}
  play('notify');
};
