import React, { useState } from 'react';
import { View, StyleSheet, Modal, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Text, Button, Card, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';

interface CountryData {
  code: string;
  name: string;
  cities: string[];
}

// Sample countries and cities - in a real app, this would come from an API
const COUNTRIES: CountryData[] = [
  {
    code: 'US',
    name: 'United States',
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose']
  },
  {
    code: 'CA',
    name: 'Canada',
    cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener']
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    cities: ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Leicester']
  },
  {
    code: 'AU',
    name: 'Australia',
    cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Wollongong', 'Hobart']
  },
  {
    code: 'DE',
    name: 'Germany',
    cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig']
  },
  {
    code: 'FR',
    name: 'France',
    cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille']
  }
];

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (country: string, city: string) => void;
  currentCountry?: string;
  currentCity?: string;
}

export default function LocationPicker({ 
  visible, 
  onClose, 
  onLocationSelect, 
  currentCountry, 
  currentCity 
}: LocationPickerProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>(currentCity || '');
  const [showCountryPicker, setShowCountryPicker] = useState<boolean>(false);
  const [showCityInput, setShowCityInput] = useState<boolean>(false);
  const [cityInput, setCityInput] = useState<string>(currentCity || '');

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setSelectedCity(''); // Reset city when country changes
    setCityInput('');
    setShowCountryPicker(false);
    setShowCityInput(true);
  };

  const handleCityInput = (city: string) => {
    setCityInput(city);
    setSelectedCity(city);
  };

  const handleConfirm = () => {
    if (selectedCountry && selectedCity) {
      onLocationSelect(selectedCountry.name as string, selectedCity);
      onClose();
    }
  };

  const handleBack = () => {
    if (showCityInput) {
      setShowCityInput(false);
      setShowCountryPicker(true);
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Button onPress={handleBack}>
            {showCityInput ? '← Back' : 'Cancel'}
          </Button>
          <Text variant="headlineSmall" style={styles.title}>
            {showCountryPicker ? 'Select Country' : 'Enter City'}
          </Text>
          <Button 
            onPress={handleConfirm}
            disabled={!selectedCountry || !selectedCity}
            mode="contained"
          >
            Done
          </Button>
        </View>

        <View style={styles.content}>
          {showCountryPicker ? (
            <View style={styles.countrySection}>
              <Text variant="bodyMedium" style={styles.description}>
                Choose your country to get started
              </Text>
              <CountryPicker
                withFilter
                withFlag
                withCountryNameButton
                withAlphaFilter
                withCallingCode
                withEmoji
                onSelect={handleCountrySelect}
                containerButtonStyle={styles.countryPickerButton}
                countryCode={selectedCountry?.cca2 as CountryCode}
              />
            </View>
          ) : showCityInput ? (
            <View style={styles.citySection}>
              <Text variant="bodyMedium" style={styles.description}>
                Enter your city in {selectedCountry?.name as string}
              </Text>
              <View style={styles.cityInputContainer}>
                <TextInput
                  style={styles.cityInput}
                  placeholder="Enter your city name"
                  value={cityInput}
                  onChangeText={handleCityInput}
                  autoFocus
                />
              </View>
              {selectedCity && (
                <View style={styles.selectedLocation}>
                  <Text variant="bodyMedium" style={styles.selectedText}>
                    Selected: {selectedCity}, {selectedCountry?.name as string}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.initialSection}>
              <Text variant="bodyMedium" style={styles.description}>
                Let's set up your location for better matches
              </Text>
              <Button
                mode="contained"
                onPress={() => setShowCountryPicker(true)}
                style={styles.startButton}
              >
                Select Location
              </Button>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  countrySection: {
    flex: 1,
    justifyContent: 'center',
  },
  citySection: {
    flex: 1,
    justifyContent: 'center',
  },
  initialSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryPickerButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cityInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cityInput: {
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  selectedLocation: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  selectedText: {
    color: '#2e7d32',
    textAlign: 'center',
    fontWeight: '500',
  },
  startButton: {
    borderRadius: 8,
    paddingHorizontal: 32,
  },
});
