import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgUri } from 'react-native-svg';
import { FONTS } from '../constants/colors';

const GH = 'https://raw.githubusercontent.com/Pariola-droid/Nigerian-Bank-Logos/main/public/library/';
const CB = 'https://logo.clearbit.com/';

const BANK_DATA = {
  'GTBank':                { bg: '#DC2626', short: 'GT',  logo: `${GH}gtco.svg`,                        type: 'svg' },
  'Access Bank':           { bg: '#E8192C', short: 'ACC', logo: `${GH}accesscorp.svg`,                  type: 'svg' },
  'Zenith Bank':           { bg: '#781B1B', short: 'ZEN', logo: `${GH}zenithbank.svg`,                  type: 'svg' },
  'First Bank of Nigeria': { bg: '#004C97', short: 'FBN', logo: `${GH}firstholdco.svg`,                 type: 'svg' },
  'First Bank':            { bg: '#004C97', short: 'FBN', logo: `${GH}firstholdco.svg`,                 type: 'svg' },
  'UBA':                   { bg: '#B01116', short: 'UBA', logo: `${GH}uba.svg`,                         type: 'svg' },
  'Fidelity Bank':         { bg: '#00935E', short: 'FID', logo: `${GH}fidelity.svg`,                    type: 'svg' },
  'Sterling Bank':         { bg: '#025FAB', short: 'STL', logo: `${GH}sterlingng.svg`,                  type: 'svg' },
  'Ecobank':               { bg: '#2563EB', short: 'ECO', logo: `${GH}eti.svg`,                         type: 'svg' },
  'Wema Bank':             { bg: '#7B1FA2', short: 'WMA', logo: `${GH}wemabank.svg`,                    type: 'svg' },
  'Stanbic IBTC':          { bg: '#0073CF', short: 'STB', logo: `${GH}stanbicibtc.svg`,                type: 'svg' },
  'Kuda Bank':             { bg: '#4E00C2', short: 'KDA', logo: `${GH}kuda.svg`,                       type: 'svg' },
  'Opay':                  { bg: '#00A651', short: 'OPY', logo: `${GH}opay.svg`,                       type: 'svg' },
  'PalmPay':               { bg: '#0B6E4F', short: 'PPY', logo: `${GH}palmpay.svg`,                    type: 'svg' },
  'Moniepoint':            { bg: '#0066CC', short: 'MNP', logo: `${GH}moniepoint.svg`,                 type: 'svg' },
  'Polaris Bank':          { bg: '#A11818', short: 'POL', logo: `${GH}polarisbank.svg`,                type: 'svg' },
};

export function getBankMeta(name) {
  return BANK_DATA[name] || {
    bg: '#7C3AED',
    short: (name || 'BK').slice(0, 3).toUpperCase(),
    type: 'fallback',
  };
}

export default function BankLogo({ bankName, size = 50 }) {
  const [failed, setFailed] = useState(false);
  const data = getBankMeta(bankName);
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scale.setValue(0.5);
    opacity.setValue(0);
    setFailed(false);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 90, friction: 6, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [bankName]);

  const radius = size * 0.28;
  const logoSize = size * 0.78;
  const shadow = { shadowColor: data.bg, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 };

  if (data.logo && !failed) {
    return (
      <Animated.View style={[{ width: size, height: size, borderRadius: radius, overflow: 'hidden', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, shadow, { transform: [{ scale }], opacity }]}>
        {data.type === 'svg' ? (
          <SvgUri width={logoSize} height={logoSize} uri={data.logo} onError={() => setFailed(true)} />
        ) : (
          <Image source={{ uri: data.logo }} style={{ width: logoSize, height: logoSize }} resizeMode="contain" onError={() => setFailed(true)} />
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <LinearGradient
        colors={[data.bg, data.bg + 'BB']}
        style={[{ width: size, height: size, borderRadius: radius, alignItems: 'center', justifyContent: 'center' }, shadow]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <Text style={{ color: '#fff', fontSize: size * 0.26, fontFamily: FONTS.extrabold, letterSpacing: 0.5 }}>
          {data.short}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}
