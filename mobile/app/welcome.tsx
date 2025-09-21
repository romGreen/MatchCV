import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.gradient}>
        {/* Magnetic field background */}
        <View style={styles.magneticField}>
          <View style={[styles.fieldCircle, styles.field1]} />
          <View style={[styles.fieldCircle, styles.field2]} />
          <View style={[styles.fieldCircle, styles.field3]} />
        </View>

        <View style={styles.content}>
          {/* Logo and branding */}
          <View style={styles.logoContainer}>
            <View style={styles.magnetLogo}>
              <View style={styles.magnetBase}>
                <View style={[styles.magnetPole, styles.poleNorth]} />
                <View style={[styles.magnetPole, styles.poleSouth]} />
                <View style={styles.connectionLine} />
              </View>
            </View>
            
          </View>

          {/* Features with custom icons */}
          <View style={styles.features}>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>🧲</Text>
              </View>
              <View style={styles.featureContent}>
                <Text variant="titleMedium" style={styles.featureTitle}>Magnetic Matching</Text>
                <Text variant="bodyMedium" style={styles.featureText}>
                  Attract people with similar hobbies and interests
                </Text>
              </View>
            </View>
            
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>🌍</Text>
              </View>
              <View style={styles.featureContent}>
                <Text variant="titleMedium" style={styles.featureTitle}>Local Discovery</Text>
                <Text variant="bodyMedium" style={styles.featureText}>
                  Find connections in your neighborhood
                </Text>
              </View>
            </View>
            
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>💫</Text>
              </View>
              <View style={styles.featureContent}>
                <Text variant="titleMedium" style={styles.featureTitle}>Meaningful Bonds</Text>
                <Text variant="bodyMedium" style={styles.featureText}>
                  Build lasting friendships through shared passions
                </Text>
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Start Connecting
            </Button>
            <Button
              mode="outlined"
              onPress={handleLogin}
              style={styles.secondaryButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.secondaryButtonLabel}
            >
              Already have an account?
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  magneticField: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fieldCircle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1000,
  },
  field1: {
    width: 200,
    height: 200,
    top: -50,
    right: -50,
  },
  field2: {
    width: 150,
    height: 150,
    bottom: -30,
    left: -30,
  },
  field3: {
    width: 100,
    height: 100,
    top: height * 0.3,
    left: width * 0.1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  magnetLogo: {
    marginBottom: 24,
  },
  magnetBase: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  magnetPole: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
  },
  poleNorth: {
    backgroundColor: '#FF6B6B',
    top: 20,
    left: 20,
  },
  poleSouth: {
    backgroundColor: '#4ECDC4',
    bottom: 20,
    right: 20,
  },
  connectionLine: {
    position: 'absolute',
    width: 30,
    height: 2,
    backgroundColor: '#FFD93D',
    transform: [{ rotate: '45deg' }],
  },
  title: {
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 28,
  },
  features: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  featureText: {
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  actions: {
    paddingBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  secondaryButton: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  buttonLabel: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonLabel: {
    color: '#fff',
    fontSize: 16,
  },
});