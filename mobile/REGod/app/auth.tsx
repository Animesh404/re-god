import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { setAudioModeAsync } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Logo from '../assets/images/logo.png';
import GoogleLogo from '../components/GoogleLogo';

const { width, height } = Dimensions.get('window');

type AuthStage = 'splash' | 'login' | 'onboarding1' | 'onboarding2' | 'onboarding3' | 'signup';

export default function AuthScreen() {
  const [teacherCode, setTeacherCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [stage, setStage] = useState<AuthStage>('splash');
  const fadeAnim = useRef(new Animated.Value(1)).current; // 1 = black overlay visible
  const [hasFaded, setHasFaded] = useState(false);

  const player = useVideoPlayer(require('@/assets/videos/Re-God video h264.mov'), (player) => {
    player.loop = true;
    player.muted = false;
    player.volume = 1;
  });

  useEffect(() => {
    let timer: any;
    if (player) {
      const statusListener = player.addListener('statusChange', (status) => {
        // Heuristic: fade once any status event arrives after play() call
        if (!hasFaded) {
          setHasFaded(true);
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }
      });

      setAudioModeAsync({
        allowsRecording: false,
        shouldPlayInBackground: false,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        interruptionModeAndroid: 'doNotMix',
        shouldRouteThroughEarpiece: false,
      }).catch(() => {});

      // Try to play after a delay
      timer = setTimeout(() => {
        try {
          player.play();
          console.log('Attempting to play video');
        } catch (error) {
          console.log('Error playing video:', error);
        }
        // Safety: fade after short delay in case status event misses
        if (!hasFaded) {
          setTimeout(() => {
            if (!hasFaded) {
              setHasFaded(true);
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }).start();
            }
          }, 700);
        }
      }, 400);

      return () => {
        statusListener?.remove();
        if (timer) clearTimeout(timer);
      };
    }
  }, [player]);

  // Splash -> Login transition
  useEffect(() => {
    if (stage === 'splash') {
      const t = setTimeout(() => setStage('login'), 2000);
      return () => clearTimeout(t);
    }
  }, [stage]);

  const handleSocialLogin = (provider: string) => {
    console.log(`Login with ${provider}`);
    // Implement social login logic here
  };

  const handleCreateAccount = () => {
    console.log('Create account');
    // Navigate to main app for now
    router.replace('/(tabs)/course');
  };

  const handleSignIn = () => {
    console.log('Sign in');
    router.replace('/(tabs)/course');
  };

  const handleForgotPassword = () => {
    console.log('Forgot password');
    // Implement forgot password logic here
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Initial Black Background */}
      <View style={styles.fallbackBackground} />
      
      {/* Fullscreen Video Background */}
      <VideoView
        player={player}
        style={styles.videoBackground}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        contentFit="cover"
        nativeControls={false}
        showsTimecodes={false}
      />
      
      {/* Persistent dark overlay for readability */}
      <View style={styles.overlay} />
      {/* Fade-from-black overlay to smooth the transition */}
      <Animated.View style={[styles.fadeOverlay, { opacity: fadeAnim }]} />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {stage === 'splash' && (
              <View style={[styles.splashContainer, { paddingTop: Math.round(height * 0.18) }]}>
                <Image source={Logo} style={styles.logoSplash} />
              </View>
            )}

            {stage === 'login' && (
              <>
                <View style={styles.logoContainer}>
                  <Image source={Logo} style={styles.logo}  />
                </View>
                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="rgba(128, 128, 128, 0.7)"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="rgba(128, 128, 128, 0.7)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="rgba(128, 128, 128, 0.7)"
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.rememberForgotContainer}>
                    <TouchableOpacity
                      style={styles.rememberMeContainer}
                      onPress={() => setRememberMe(!rememberMe)}
                    >
                      <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                        {rememberMe && <View style={styles.checkmark} />}
                      </View>
                      <Text style={styles.rememberMeText}>Remember me</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleForgotPassword}>
                      <Text style={styles.forgotPasswordText}>Forgot password</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn}>
                    <Text style={styles.primaryButtonText}>Sign in</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setStage('onboarding1')}>
                    <Text style={styles.linkButtonText}>Create account</Text>
                  </TouchableOpacity>
                  <View style={styles.musicCreditContainer}>
                    <Text style={[styles.musicCreditText, { fontWeight: 'bold', color: '#FFFFFF' }]}>Music</Text>
                    <Text style={styles.musicCreditText}>&quot;Eliza&apos;s Morning Wander&quot; by Matt Minikus</Text>
                  </View>
                </View>
              </>
            )}

            {(stage === 'onboarding1' || stage === 'onboarding2' || stage === 'onboarding3') && (
              <View style={[styles.formContainer, { justifyContent: 'center', flex: 1 }]}>
                {/* <View style={[styles.logoContainer, { marginTop: 24, marginBottom: 16 }]}>
                  <Image source={Logo} style={styles.logoSmall} />
                </View> */}
                <View>
                  <Text style={styles.headline}>
                    {stage === 'onboarding1' ? 'Interesting &\nInexhaustible' : stage === 'onboarding2' ? 'Deep & Diverse' : 'Purposeful &\nPersonalized'}
                  </Text>
                  <Text style={styles.subtext}>
                    {stage === 'onboarding1'
                      ? 'An exploration of the character of God, based on current and Biblical accounts of His interaction with people like us.'
                      : stage === 'onboarding2'
                      ? 'Each 10-15 minute lesson tackles real-life situations, providing valid reasons to hope. Discover more peace and joy as you gain fresh perspectives for navigating life.'
                      : 'While you can ask questions and connect with a real person through the app, the lessons are designed primarily for your personal discovery of God.'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setStage(stage === 'onboarding1' ? 'onboarding2' : stage === 'onboarding2' ? 'onboarding3' : 'signup')}
                >
                  <Text style={styles.primaryButtonText}>Next</Text>
                </TouchableOpacity>
                <View style={styles.musicCreditContainer}>
                  <Text style={[styles.musicCreditText, { fontWeight: 'bold', color: '#FFFFFF' }]}>Music</Text>
                  <Text style={styles.musicCreditText}>&quot;Eliza&apos;s Morning Wander&quot; by Matt Minikus</Text>
                </View>
              </View>
            )}

            {stage === 'signup' && (
              <View style={styles.formContainer}>
                {/* Logo */}
                <View style={[styles.logoContainer, { marginTop: 18, marginBottom: 12 }]}>
                  <Image source={Logo} style={styles.logo}  />
                </View>

                {/* Form Container */}
                <View style={styles.formContainer}>
                  {/* Teacher's Code Input */}
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Teacher's Code"
                      placeholderTextColor="rgba(128, 128, 128, 0.7)"
                      value={teacherCode}
                      onChangeText={setTeacherCode}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="rgba(128, 128, 128, 0.7)"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="rgba(128, 128, 128, 0.7)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="rgba(128, 128, 128, 0.7)"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Remember Me and Forgot Password */}
                  <View style={styles.rememberForgotContainer}>
                    <TouchableOpacity
                      style={styles.rememberMeContainer}
                      onPress={() => setRememberMe(!rememberMe)}
                    >
                      <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                        {rememberMe && <View style={styles.checkmark} />}
                      </View>
                      <Text style={styles.rememberMeText}>Remember me</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={handleForgotPassword}>
                      <Text style={styles.forgotPasswordText}>Forgot password</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Social Login Buttons */}
                  <View style={styles.socialButtonsContainer}>
                    {/* Google */}
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => handleSocialLogin('Google')}
                    >
                      <GoogleLogo size={20} />
                      <Text style={styles.socialButtonText}>Sign in with Google</Text>
                    </TouchableOpacity>

                    {/* Apple */}
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => handleSocialLogin('Apple')}
                    >
                      <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                      <Text style={styles.socialButtonText}>Sign in with Apple</Text>
                    </TouchableOpacity>

                    {/* Facebook */}
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => handleSocialLogin('Facebook')}
                    >
                      <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                      <Text style={styles.socialButtonText}>Sign in with Facebook</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Create Account Button */}
                  <TouchableOpacity
                    style={styles.createAccountButton}
                    onPress={handleCreateAccount}
                  >
                    <Text style={styles.createAccountButtonText}>Create account</Text>
                  </TouchableOpacity>

                  {/* Switch to Login */}
                  <View style={styles.switchRow}>
                    <Text style={styles.switchText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => setStage('login')}>
                      <Text style={styles.linkButtonText}>Sign in</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Music Credit */}
                  <View style={styles.musicCreditContainer}>
                    <Text style={[styles.musicCreditText, { fontWeight: 'bold', color: '#FFFFFF' }]}>Music</Text>
                    <Text style={styles.musicCreditText}>&quot;Eliza&apos;s Morning Wander&quot; by Matt Minikus</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fallbackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 0,
    backgroundColor: '#000000',
  },
  videoBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 2,
  },
  fadeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: '#000000',
    zIndex: 3,
  },
  safeArea: {
    flex: 1,
    zIndex: 4,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  splashContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoSplash: {
    width: Math.min(340, Math.round(width * 0.75)),
    height: Math.min(170, Math.round(width * 0.375)),
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  logo: {
    width: Math.min(320, Math.round(width * 0.72)),
    height: Math.min(160, Math.round(width * 0.36)),
  },
  logoSmall: {
    width: Math.min(220, Math.round(width * 0.5)),
    height: Math.min(110, Math.round(width * 0.25)),
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    width: '90%',
    alignSelf: 'center',
    paddingBottom: 24,
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(244, 245, 235, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#808080',
    borderWidth: 0,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  rememberForgotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'gray',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: 'white',
  },
  checkmark: {
    width: 10,
    height: 10,
    backgroundColor: 'black',
    borderRadius: 1,
  },
  rememberMeText: {
    color: 'white',
    fontSize: 14,
  },
  forgotPasswordText: {
    color: 'white',
    fontSize: 14,
  },
  socialButtonsContainer: {
    marginBottom: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  socialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  createAccountButton: {
    backgroundColor: '#B4B454',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  createAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#B4B454',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButtonText: {
    color: '#B4B454',
    fontSize: 16,
    textAlign: 'center',
    // marginTop: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  headline: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'left',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'left',
    marginBottom: 20,
  },
  musicCreditContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // paddingTop: 36,
    alignItems: 'center',
  },
  musicCreditText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
});