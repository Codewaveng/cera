import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackSuccess, feedbackError, feedbackWarning, feedbackNotify } from '../utils/feedback';

const { height: SCREEN_H } = Dimensions.get('window');

const TYPES = {
  success: {
    icon: 'checkmark-circle',
    color: '#10B981',
    gradient: ['#10B981', '#059669'],
    sound: feedbackSuccess,
  },
  error: {
    icon: 'close-circle',
    color: '#EF4444',
    gradient: ['#EF4444', '#DC2626'],
    sound: feedbackError,
  },
  warning: {
    icon: 'warning',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'],
    sound: feedbackWarning,
  },
  comingsoon: {
    icon: 'time',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'],
    sound: feedbackWarning,
  },
  info: {
    icon: 'information-circle',
    color: '#7C3AED',
    gradient: ['#7C3AED', '#5B21B6'],
    sound: feedbackNotify,
  },
  cash: {
    icon: 'cash',
    color: '#10B981',
    gradient: ['#10B981', '#059669'],
    sound: feedbackSuccess,
  },
};

export default function AppModal({
  visible,
  type = 'info',
  title,
  message,
  primaryLabel = 'Got it',
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose,
}) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);
  const cfg = TYPES[type] || TYPES.info;

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(300)).current;
  const iconScale = useRef(new Animated.Value(0.3)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      cfg.sound?.();
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(sheetY, { toValue: 0, tension: 65, friction: 9, useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 1, tension: 80, friction: 6, delay: 150, useNativeDriver: true }),
        Animated.timing(iconRotate, { toValue: 1, duration: 400, delay: 150, useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 300, delay: 200, useNativeDriver: true }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(shimmer, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      backdropOpacity.setValue(0);
      sheetY.setValue(300);
      iconScale.setValue(0.3);
      iconRotate.setValue(0);
      contentOpacity.setValue(0);
      shimmer.setValue(0);
    }
  }, [visible]);

  const spin = iconRotate.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '0deg'] });
  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-120, 120] });

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(sheetY, { toValue: 300, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose?.());
  };

  const handlePrimary = () => {
    handleClose();
    onPrimary?.();
  };

  const handleSecondary = () => {
    handleClose();
    onSecondary?.();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      {/* Visual backdrop — pointerEvents none so it never blocks buttons */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', opacity: backdropOpacity }]}
        pointerEvents="none"
      />

      {/* Column layout: dismiss area on top, sheet pinned to bottom */}
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />

        <Animated.View style={[S.sheet, { transform: [{ translateY: sheetY }] }]}>
          <View style={S.handle} />

          <Animated.View style={[S.iconRing, { transform: [{ scale: iconScale }, { rotate: spin }], backgroundColor: cfg.color + '18' }]}>
            <LinearGradient colors={cfg.gradient} style={S.iconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name={cfg.icon} size={38} color="#fff" />
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  S.shimmerLine,
                  { transform: [{ translateX: shimmerX }, { rotate: '25deg' }] },
                ]}
              />
            </LinearGradient>
          </Animated.View>

          <Animated.View style={{ opacity: contentOpacity, width: '100%' }}>
            <Text style={S.title}>{title}</Text>
            {!!message && <Text style={S.message}>{message}</Text>}

            <TouchableOpacity activeOpacity={0.85} onPress={handlePrimary} style={S.primaryBtn}>
              <LinearGradient colors={cfg.gradient} style={S.primaryInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={S.primaryText}>{primaryLabel}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {!!secondaryLabel && (
              <TouchableOpacity style={S.secondaryBtn} onPress={handleSecondary} activeOpacity={0.7}>
                <Text style={[S.secondaryText, { color: cfg.color }]}>{secondaryLabel}</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    sheet: {
      backgroundColor: C.surface,
      borderTopLeftRadius: 36,
      borderTopRightRadius: 36,
      paddingHorizontal: 24,
      paddingTop: 14,
      paddingBottom: 48,
      borderTopWidth: 1,
      borderColor: C.border,
      alignItems: 'center',
      width: '100%',
    },
    handle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: C.border,
      marginBottom: 32,
    },
    iconRing: {
      width: 110,
      height: 110,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 26,
    },
    iconGradient: {
      width: 88,
      height: 88,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    shimmerLine: {
      width: 30,
      backgroundColor: 'rgba(255,255,255,0.35)',
      borderRadius: 4,
    },
    title: {
      color: C.text,
      fontSize: 24,
      fontFamily: FONTS.extrabold,
      textAlign: 'center',
      marginBottom: 12,
    },
    message: {
      color: C.textSecondary,
      fontSize: 14,
      fontFamily: FONTS.regular,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 36,
      paddingHorizontal: 4,
    },
    primaryBtn: {
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 14,
      width: '100%',
    },
    primaryInner: {
      height: 62,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
    },
    primaryText: {
      color: '#fff',
      fontSize: 17,
      fontFamily: FONTS.bold,
      letterSpacing: 0.3,
    },
    secondaryBtn: {
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    secondaryText: {
      fontSize: 15,
      fontFamily: FONTS.semibold,
    },
  });
}
