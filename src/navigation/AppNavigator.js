import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackSelect } from '../utils/feedback';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import OfframpScreen from '../screens/OfframpScreen';
import BankDetailsScreen from '../screens/BankDetailsScreen';
import ConfirmScreen from '../screens/ConfirmScreen';
import SuccessScreen from '../screens/SuccessScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReceiveScreen from '../screens/ReceiveScreen';
import SendScreen from '../screens/SendScreen';
import CalculatorScreen from '../screens/CalculatorScreen';
import UtilityScreen from '../screens/UtilityScreen';
import CardsScreen from '../screens/CardsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import KYCScreen from '../screens/KYCScreen';
import BankAccountsScreen from '../screens/BankAccountsScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import SecurityScreen from '../screens/SecurityScreen';
import ReferEarnScreen from '../screens/ReferEarnScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import AboutScreen from '../screens/AboutScreen';
import AutoProcessingSetupScreen from '../screens/AutoProcessingSetupScreen';
import AutoProcessingConfirmScreen from '../screens/AutoProcessingConfirmScreen';
import AutoProcessingSuccessScreen from '../screens/AutoProcessingSuccessScreen';
import AutoProcessingSettingsScreen from '../screens/AutoProcessingSettingsScreen';
import PinSetupScreen from '../screens/PinSetupScreen';
import PinEntryScreen from '../screens/PinEntryScreen';
import CeraTransferScreen from '../screens/CeraTransferScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import TrustedDevicesScreen from '../screens/TrustedDevicesScreen';
import LoginActivityScreen from '../screens/LoginActivityScreen';
import TwoFAScreen from '../screens/TwoFAScreen';
import CeraTagScreen from '../screens/CeraTagScreen';
import ReceiptScreen from '../screens/ReceiptScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Using MaterialCommunityIcons for tab bar — more polished filled/outline pairs
const TABS = [
  { name: 'Home',       icon: 'home-variant',     iconOff: 'home-variant-outline',  label: 'Home',    lib: 'mci' },
  { name: 'Calculator', icon: 'chart-line',        iconOff: 'chart-line',            label: 'Rates',   lib: 'mci' },
  { name: 'Cards',      icon: 'credit-card',       iconOff: 'credit-card-outline',   label: 'Cards',   lib: 'mci' },
  { name: 'Profile',    icon: 'account-circle',    iconOff: 'account-circle-outline', label: 'Profile', lib: 'mci' },
];

function CustomTabBar({ state, descriptors, navigation }) {
  const { colors } = useTheme();

  return (
    <View style={tabStyles.container}>
      <View style={[tabStyles.bar, { backgroundColor: '#FFFFFF', borderTopColor: colors.border }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tab = TABS.find((t) => t.name === route.name) || TABS[0];

          const onPress = () => {
            feedbackSelect();
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          const iconName = isFocused ? tab.icon : tab.iconOff;
          const iconColor = isFocused ? colors.primary : colors.textMuted;

          return (
            <TouchableOpacity key={route.key} style={tabStyles.tabBtn} onPress={onPress} activeOpacity={0.8}>
              <View style={tabStyles.iconWrap}>
                {isFocused && <View style={[tabStyles.activeIndicator, { backgroundColor: colors.primary + '20' }]} />}
                <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
              </View>
              <Text style={[tabStyles.label, { color: iconColor }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  bar: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 8,
    borderTopWidth: 1,
  },
  tabBtn: { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap: { alignItems: 'center', justifyContent: 'center', width: 48, height: 32, borderRadius: 16 },
  activeIndicator: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    borderRadius: 16,
  },
  label: { fontSize: 10, fontFamily: FONTS.semibold },
});

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calculator" component={CalculatorScreen} />
      <Tab.Screen name="Cards" component={CardsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'ios_from_right' }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Receive" component={ReceiveScreen} />
        <Stack.Screen name="Send" component={SendScreen} />
        <Stack.Screen name="Utility" component={UtilityScreen} />
        <Stack.Screen name="Offramp" component={OfframpScreen} />
        <Stack.Screen name="BankDetails" component={BankDetailsScreen} />
        <Stack.Screen name="Confirm" component={ConfirmScreen} />
        <Stack.Screen name="Success" component={SuccessScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Cards" component={CardsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="KYC" component={KYCScreen} />
        <Stack.Screen name="BankAccounts" component={BankAccountsScreen} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        <Stack.Screen name="Security" component={SecurityScreen} />
        <Stack.Screen name="ReferEarn" component={ReferEarnScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="AutoProcessingSetup" component={AutoProcessingSetupScreen} />
        <Stack.Screen name="AutoProcessingConfirm" component={AutoProcessingConfirmScreen} />
        <Stack.Screen name="AutoProcessingSuccess" component={AutoProcessingSuccessScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="AutoProcessingSettings" component={AutoProcessingSettingsScreen} />
        <Stack.Screen name="PinSetup" component={PinSetupScreen} />
        <Stack.Screen name="PinEntry" component={PinEntryScreen} />
        <Stack.Screen name="CeraTransfer" component={CeraTransferScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="TrustedDevices" component={TrustedDevicesScreen} />
        <Stack.Screen name="LoginActivity" component={LoginActivityScreen} />
        <Stack.Screen name="TwoFA" component={TwoFAScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="CeraTag" component={CeraTagScreen} />
        <Stack.Screen name="Receipt" component={ReceiptScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
